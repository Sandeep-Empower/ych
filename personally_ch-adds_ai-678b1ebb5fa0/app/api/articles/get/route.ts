import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get('siteId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    if (!siteId) {
      return NextResponse.json({ error: 'siteId parameter is required' }, { status: 400 });
    }

    // Search articles by query in title, content, or meta_description
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where: { site_id: siteId },
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
        where: { site_id: siteId },
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
    console.error('Error searching articles:', error);
    return NextResponse.json({ error: 'Failed to search articles' }, { status: 500 });
  }
} 