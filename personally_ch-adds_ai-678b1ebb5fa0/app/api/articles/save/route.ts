import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sanitizeSlug } from '@/lib/utils';
import { uploadToSpaces } from '@/lib/do-spaces';
import { requireAuth, isValidUUID } from '@/lib/security';

async function generateUniqueSlug(baseSlug: string, siteId: string) {
  let slug = baseSlug;
  let count = 1;
  while (true) {
    const existing = await prisma.article.findFirst({
      where: { slug, site_id: siteId },
      select: { id: true },
    });
    if (!existing) break;
    count += 1;
    slug = `${baseSlug}-${count}`;
  }
  return slug;
}

function randomDateWithinLastThreeMonths() {
  const now = new Date();
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(now.getMonth() - 3);
  const randomTime = threeMonthsAgo.getTime() + Math.random() * (now.getTime() - threeMonthsAgo.getTime());
  return new Date(randomTime);
}

/**
 * @swagger
 * /api/articles/save:
 *   post:
 *     summary: Save articles to a site
 *     description: Save multiple articles with tags and featured images to a specific site
 *     tags:
 *       - Articles
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - siteId
 *               - articles
 *               - form
 *             properties:
 *               siteId:
 *                 type: string
 *                 description: ID of the site to save articles to
 *                 example: site-uuid-123
 *               articles:
 *                 type: string
 *                 description: JSON string containing array of articles
 *                 example: '[{"title":"Article Title","content":"<p>Content</p>","slug":"article-title","meta_description":"Description","tags":["tag1","tag2"],"image_prompt":"Image description"}]'
 *               form:
 *                 type: string
 *                 description: JSON string containing form data
 *                 example: '{"contentStyle":"Professional","tone":"Friendly","niche":"Technology","language":"English","refreshCycle":"monthly"}'
 *     responses:
 *       200:
 *         description: Articles saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Articles saved successfully
 *                 articles:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Article'
 *       400:
 *         description: Missing required fields or invalid data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(req: NextRequest) {
  // SECURITY: Require authentication
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) {
    return auth;
  }
  const { userId } = auth;

  const formData = await req.formData();
  const siteId = formData.get('siteId') as string;
  const articlesJson = formData.get('articles') as string;
  const formJson = formData.get('form') as string;

  // SECURITY: Validate siteId format
  if (!siteId || !isValidUUID(siteId)) {
    return NextResponse.json({ error: 'Invalid siteId format' }, { status: 400 });
  }

  // SECURITY: Verify user owns the site
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: { user_id: true }
  });

  if (!site) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 });
  }

  if (site.user_id !== userId) {
    return NextResponse.json({ error: 'Unauthorized - You do not own this site' }, { status: 403 });
  }

  const articles = JSON.parse(articlesJson);
  const form = JSON.parse(formJson);
  const { contentStyle, tone, niche, language, refreshCycle } = form;
  let imageUrl = '';

  // Explicitly type savedArticles
  const savedArticles: any[] = [];

  try {
    await prisma.$transaction(async (tx) => {
      for (const article of articles) {
        // 1. Ensure tags exist and get their IDs
        const tagIds = await Promise.all(
          article.tags.map(async (tagName: string) => {
            const tagSlug = sanitizeSlug(tagName.trim());
            const tagTitle = tagName.charAt(0).toUpperCase() + tagName.slice(1).toLowerCase();
            const tag = await tx.tag.upsert({
              where: { slug: tagSlug },
              update: {},
              create: { name: tagTitle, slug: tagSlug },
            });
            return tag.id;
          })
        );

        // 2. Generate a unique slug for the article
        const baseSlug = article.slug || sanitizeSlug(article.title);
        const uniqueSlug = await generateUniqueSlug(baseSlug, siteId);
        const randomDate = randomDateWithinLastThreeMonths();

        // Check if there's an image file for this article
        const imageFile = formData.get(`imageFile_${articles.indexOf(article)}`) as File;
        if (imageFile) {
          // Convert File to Buffer for upload
          const arrayBuffer = await imageFile.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const filename = `article-${uniqueSlug}-${Date.now()}.${imageFile.name.split('.').pop()}`;
          imageUrl = await uploadToSpaces(buffer, filename, siteId, imageFile.type);
          article.featuredImage = imageUrl;
        } else {
          imageUrl = article.featuredImage;
        }

        // 3. Save the article
        const result = await tx.article.create({
          data: {
            title: article.title,
            content: article.content,
            image_url: imageUrl,
            meta_description: article.metaDescription,
            site_id: siteId,
            slug: uniqueSlug,
            created_at: randomDate,
            updated_at: randomDate,
            article_tags: {
              create: tagIds.map((tagId) => ({
                tag: { connect: { id: tagId } },
              })),
            },
          },
        });
        savedArticles.push(result);
      }

      // Upsert siteMeta for all keys
      const metaEntries = [
        { key: 'niche', value: niche },
        { key: 'contentStyle', value: contentStyle },
        { key: 'tone', value: tone },
        { key: 'language', value: language },
        { key: 'refreshCycle', value: refreshCycle },
      ];
      await Promise.all(
        metaEntries.map(({ key, value }) =>
          tx.siteMeta.upsert({
            where: { site_id_meta_key: { meta_key: key, site_id: siteId } },
            update: { meta_value: value },
            create: { meta_key: key, meta_value: value, site_id: siteId },
          })
        )
      );
    });

    return NextResponse.json({ success: true, saved: savedArticles.length, articles: savedArticles });
  } catch (error) {
    console.error('Error saving articles and meta:', error);
    return NextResponse.json({ success: false, error: 'Failed to save articles or meta.' }, { status: 500 });
  }
} 