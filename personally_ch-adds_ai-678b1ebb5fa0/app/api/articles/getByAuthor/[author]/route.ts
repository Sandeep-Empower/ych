import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ author: string }> }) {
	// get the slug from the path parameter
	const { author } = await params;
	const { searchParams } = new URL(req.url);
	const domain = searchParams.get('domain');
	const limit = searchParams.get('limit');
	const take = Number(limit);

	if (!domain) {
		return NextResponse.json(
			{ error: 'Domain parameter is required' },
			{ status: 400 }
		)
	}

	// Query the database for site data
	const site = await prisma.site.findUnique({
		where: { domain }
	})

	if (!site) {
		return NextResponse.json(
			{ error: 'Site not found' },
			{ status: 404 }
		)
	}

	// get the article from the database
	const articles = await prisma.article.findMany({
		where: { site_id: site.id },
		select: {
			id: true,
      image_url: true,
			title: true,
			created_at: true,
			slug: true,
			meta_description: true,
			article_tags: {
				select: {
					tag: {
						select: {
							name: true,
							slug: true
						}
					}
				}
			}
		},
		take: take
	});
	return NextResponse.json({ success: true, articles: articles });
}