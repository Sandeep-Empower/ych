import { NextRequest, NextResponse } from 'next/server';
import { StaticPageType } from '@prisma/client';

import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ page_type: string }> }) {
  try {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get('domain');
    const { page_type } = await params;

    if (!domain || !page_type) {
      return NextResponse.json({ error: 'Domain and page_type are required' }, { status: 400 });
    }

    // Find the site by domain
    const site = await prisma.site.findUnique({
      where: { domain },
      select: { id: true },
    });
    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Find the static page by site_id and page_type
    const staticPage = await prisma.staticPage.findFirst({
      where: {
        site_id: site.id,
        page_type: page_type.toUpperCase() as StaticPageType,
      },
    });

    if (!staticPage) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, page: staticPage });
  } catch (error) {
    console.error('Error fetching static page:', error);
    return NextResponse.json({ error: 'Failed to fetch static page' }, { status: 500 });
  }
} 