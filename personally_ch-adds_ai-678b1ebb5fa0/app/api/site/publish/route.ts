import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const { siteId } = await req.json();
  const site = await prisma.site.findUnique({
    where: { id: siteId },
  });
  if (!site) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 });
  }
  // publish site
  await prisma.site.update({
    where: { id: siteId },
    data: {
      status: true,
    },
  });

  return NextResponse.json({ success: true, url: site?.domain });
} 