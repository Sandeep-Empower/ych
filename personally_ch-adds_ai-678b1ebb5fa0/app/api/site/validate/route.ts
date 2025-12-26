import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


export async function POST(req: NextRequest) {
  try {
    const { siteId } = await req.json();

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    // Check if site exists
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: { 
        id: true,
        domain: true,
        site_name: true,
        company: {
          select: {
            name: true,
            email: true,
            phone: true,
            address: true
          }
        },
        site_meta: {
          select: {
            meta_key: true,
            meta_value: true
          }
        }
      }
    });

    if (!site) {
      return NextResponse.json({ error: 'Invalid site ID' }, { status: 404 });
    }

    const meta = site.site_meta.reduce<Record<string, string>>((acc, { meta_key, meta_value }) => {
      acc[meta_key] = meta_value;
      return acc;
    }, {});

    return NextResponse.json({ valid: true, domain: site.domain, site_name: site.site_name, meta, company: site.company });
  } catch (error) {
    console.error('Error validating site:', error);
    return NextResponse.json({ error: 'Failed to validate site' }, { status: 500 });
  }
} 