import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { searchParams } = new URL(req.url);
    const { slug } = await params;
    const domain = searchParams.get('domain');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    if (!domain || !slug) {
      return NextResponse.json({ error: 'Domain and tag parameters are required' }, { status: 400 });
    }

    // Find the site by domain
    const site = await prisma.site.findUnique({
      where: { domain },
      select: { id: true },
    });
    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Find the tag by slug
    const tag = await prisma.tag.findUnique({
      where: { slug: slug },
      select: { id: true },
    });
    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    // Get articles for the tag and site
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where: {
          site_id: site.id,
          article_tags: {
            some: {
              tag_id: tag.id,
            },
          },
        },
        select: {
          id: true,
          image_url: true,
          title: true,
          created_at: true,
          meta_description: true,
          slug: true,
          article_tags: {
            select: {
              tag: {
                select: {
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.article.count({
        where: {
          site_id: site.id,
          article_tags: {
            some: {
              tag_id: tag.id,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      articles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching articles by tag:', error);
    return NextResponse.json({ error: 'Failed to fetch articles by tag' }, { status: 500 });
  }
}
