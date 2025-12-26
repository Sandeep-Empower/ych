import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const siteId = searchParams.get('siteId');

		if (!siteId) {
			return NextResponse.json({ error: 'siteId is required' }, { status: 400 });
		}

		// Find the static pages by site_id
		const staticPages = await prisma.staticPage.findMany({
			where: {
				site_id: siteId,
			}
		});

		const pages = staticPages.map((page) => ({
			key: page.page_type.toLowerCase(),
			label: page.title,
			content: page.content,
		}));

		return NextResponse.json({ success: true, pages });
	} catch (error) {
		console.error('Error fetching static page:', error);
		return NextResponse.json({ error: 'Failed to fetch static pages' }, { status: 500 });
	}
} 