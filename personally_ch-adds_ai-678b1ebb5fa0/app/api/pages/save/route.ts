import { NextRequest, NextResponse } from 'next/server';
import { StaticPage, StaticPageType } from '@prisma/client';
import { prisma } from '@/lib/prisma';


export async function POST(req: NextRequest) {
  try {
    const { siteId, pages } = await req.json();

    if (!siteId || typeof pages !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    await prisma.staticPage.deleteMany({
      where: {
        site_id: siteId,
      },
    });

    // Create or update pages if already exists
    const savedPages: StaticPage[] = [];
    Object.entries(pages).forEach(async ([key, value]) => {
      const pageType = StaticPageType[key.toUpperCase() as keyof typeof StaticPageType];
      const title = key.charAt(0).toUpperCase() + key.slice(1);
      const content = value as string;

      const existingPage = await prisma.staticPage.upsert({
        where: {
          site_id_page_type: {
            site_id: siteId,
            page_type: pageType,
          },
        },
        update: {
          content: content,
        },
        create: {
          page_type: pageType,
          title: title,
          content: content,
          site_id: siteId,
        },
      });
      savedPages.push(existingPage);
    });

    return NextResponse.json({
      success: true,
      saved: savedPages.length,
      pages: savedPages,
    });
  } catch (error) {
    console.error('Error saving static pages:', error);
    return NextResponse.json({ error: 'Failed to save static pages' }, { status: 500 });
  }
}
