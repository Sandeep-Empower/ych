import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    // Get the slug from the path parameter
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get('domain');
    let siteId = searchParams.get('siteId');

    // Validate required parameters
    if (!domain && !siteId) {
      return NextResponse.json(
        { error: 'Either domain or siteId parameter is required' },
        { status: 400 }
      );
    }

    // If only domain is provided, fetch the siteId
    if (domain && !siteId) {
      const site = await prisma.site.findUnique({
        where: { domain },
        select: { id: true },
      });
      if (!site) {
        return NextResponse.json(
          { error: 'Site not found for the given domain' },
          { status: 404 }
        );
      }
      siteId = site.id;
    }

    if (!siteId) {
      return NextResponse.json(
        { error: 'siteId could not be determined' },
        { status: 400 }
      );
    }

    // Get the article from the database
    const article = await prisma.article.findUnique({
      where: { site_id_slug: { slug, site_id: siteId } },
      select: {
        id: true,
        image_url: true,
        title: true,
        created_at: true,
        content: true,
        slug: true,
        meta_description: true,
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
    });

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, article });
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}