import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/security';

export async function GET(request: NextRequest) {
  // SECURITY: Require authentication
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) {
    return auth;
  }
  const { userId } = auth;

  const search = request.nextUrl.searchParams.get('search');
  try {
    // SECURITY: Only return user's OWN sites (prevent data leak)
    const whereClause: any = {
      user_id: userId,  // Filter by authenticated user
    };

    if (search) {
      whereClause.OR = [
        { domain: { contains: search, mode: 'insensitive' as const } },
        { site_name: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    const sites = await prisma.site.findMany({
      include: {
        site_meta: true,
        articles: true,
        static_pages: true,
        company: true,
        // SECURITY: Don't expose user data in list
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
