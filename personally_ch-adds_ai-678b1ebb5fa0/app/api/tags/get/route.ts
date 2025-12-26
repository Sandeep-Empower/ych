import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get('domain');
  const limit = searchParams.get('limit');
  const take = limit ? Number(limit) : 10;

  if (!domain) {
    return NextResponse.json(
      { error: 'Domain parameter is required' },
      { status: 400 }
    );
  }

  // Check site exists
  const site = await prisma.site.findUnique({
    where: { domain }
  });

  if (!site) {
    return NextResponse.json(
      { error: 'Site not found' },
      { status: 404 }
    );
  }

  // Fetch tags related to this site's articles
  const tags = await prisma.tag.findMany({
    where: {
      article_tags: {
        some: {
          article: {
            site: {
              domain
            }
          }
        }
      }
    },
    select: {
      id: true,
      name: true,
      slug: true
    },
    take
  });

  return NextResponse.json({ success: true, tags });
}
