import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadToSpaces } from '@/lib/do-spaces';
import { requireAuth, isValidUUID } from '@/lib/security';

export const config = {
	api: {
		bodyParser: false, // To handle file uploads
	},
};

async function generateUniqueSlug(baseSlug: string, siteId: string, articleId: string) {
	let slug = baseSlug;
	let count = 1;
	while (true) {
		const existing = await prisma.article.findFirst({
			where: { slug, site_id: siteId, id: { not: articleId } },
			select: { id: true },
		});
		if (!existing) break;
		count += 1;
		slug = `${baseSlug}-${count}`;
	}
	return slug;
}

export async function POST(req: NextRequest) {
	try {
		// SECURITY: Require authentication
		const auth = requireAuth(req);
		if (auth instanceof NextResponse) {
			return auth;
		}
		const { userId } = auth;

		// Parse form data (for file upload)
		const formData = await req.formData();
		const content = formData.get('content') as string;
		const title = formData.get('title') as string;
		const meta_description = formData.get('meta_description') as string;
		const tags = formData.get('tags') as string; // comma separated
		const siteId = formData.get('siteId') as string;
		const articleId = formData.get('articleId') as string;
		const image = formData.get('image'); // File or null

		if (!title || !siteId || !articleId) {
			return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
		}

		// SECURITY: Validate IDs format
		if (!isValidUUID(siteId) || !isValidUUID(articleId)) {
			return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
		}

		// SECURITY: Verify user owns the article's site
		const article = await prisma.article.findUnique({
			where: { id: articleId },
			include: { site: { select: { user_id: true } } }
		});

		if (!article) {
			return NextResponse.json({ error: 'Article not found' }, { status: 404 });
		}

		if (article.site.user_id !== userId) {
			return NextResponse.json({ error: 'Unauthorized - You do not own this article' }, { status: 403 });
		}

		// Generate slug from title
		const baseSlug = title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
		const uniqueSlug = await generateUniqueSlug(baseSlug, siteId, articleId);

		// Handle image upload (if present)
		let image_url: string | undefined = undefined;
		if (image && typeof image === 'object' && 'arrayBuffer' in image) {
			const bytes = await image.arrayBuffer();
			const buffer = Buffer.from(bytes);
			const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
			const filename = `${uniqueSuffix}-${image.name}`;
			image_url = await uploadToSpaces(buffer, filename, "generated", image.type);
		}

		// Update the article
		const updated = await prisma.article.update({
			where: { id: articleId },
			data: {
				title,
				slug: uniqueSlug,
				content,
				meta_description,
				...(image_url ? { image_url } : {}),
			},
		});

		// Update tags
		if (tags) {
			const tagNames = tags.split(', ').map(t => t.trim()).filter(Boolean);
			// Upsert tags and connect
			const tagIds = await Promise.all(
				tagNames.map(async (tagName) => {
					const tagSlug = tagName.toLowerCase().replace(/ /g, '-');
					const tagTitle = tagName.charAt(0).toUpperCase() + tagName.slice(1).toLowerCase();
					const tag = await prisma.tag.upsert({
						where: { slug: tagSlug },
						update: {},
						create: { name: tagTitle, slug: tagSlug },
					});
					return tag.id;
				})
			);
			// Remove old tags and add new
			await prisma.articleTag.deleteMany({ where: { article_id: articleId } });
			await prisma.articleTag.createMany({
				data: tagIds.map(tagId => ({ article_id: articleId, tag_id: tagId })),
				skipDuplicates: true,
			});
		}

		return NextResponse.json({ success: true, article: updated });
	} catch (error) {
		console.error('Error updating article:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
