import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get('search');
  try {
    const whereClause = search ? {
      OR: [
        { domain: { contains: search, mode: 'insensitive' as const } },
        { site_name: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {};
    const sites = await prisma.site.findMany({
      include: {
        site_meta: true,
        articles: true,
        static_pages: true,
        company: true,
        user: {
          select: {
            id: true,
            email: true,
            nicename: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      where: whereClause,
    });
    return NextResponse.json(sites);
  } catch (error) {
    console.error('Error fetching all sites:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
