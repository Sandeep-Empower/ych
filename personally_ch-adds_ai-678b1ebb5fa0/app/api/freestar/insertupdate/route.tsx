import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const {
        domain,
        keyword,
        src,
        market,
        serve_url,
        adgroup,
        network,
        campaign,
        supplier,
      } = body;

    // Validate required fields
    if (!domain || !keyword) {
      return NextResponse.json({ 
        error: 'Missing required fields: domain and keyword are required' 
      }, { status: 400 });
    }

    const site = await prisma.site.findUnique({
      where: { domain },
    });

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Check if record exists first, then create or update
    let freestarYsmTypecodes = await prisma.freestarYsmTypecodes.findFirst({
      where: {
        c_site: domain || serve_url,
        c_market: market || '',
        c_network: network || '',
        c_campaign: campaign || '',
        c_adgroup: adgroup || '',
        c_supplier: supplier || '',
        keyword: keyword,
        feed: src || '',
      },
    });

    if (freestarYsmTypecodes) {
      // Record exists, update it (equivalent to ON DUPLICATE KEY UPDATE)
      freestarYsmTypecodes = await prisma.freestarYsmTypecodes.update({
        where: { id: freestarYsmTypecodes.id },
        data: {
          c_site: domain || serve_url,
          c_market: market || '',
          c_network: network || '',
          c_campaign: campaign || '',
          c_adgroup: adgroup || '',
          c_supplier: supplier || '',
          keyword: keyword,
          feed: src || '',
          updated_at: new Date(),
        },
      });
    } else {
      // Record doesn't exist, create new one
      freestarYsmTypecodes = await prisma.freestarYsmTypecodes.create({
        data: {
          c_site: domain || serve_url,
          c_market: market || '',
          c_network: network || '',
          c_campaign: campaign || '',
          c_adgroup: adgroup || '',
          c_supplier: supplier || '',
          keyword: keyword,
          feed: src || '',
        },
      });
    }

    // Get the source_id and convert to source_type
    const source_id = freestarYsmTypecodes.id;
    const source_type = source_id ? parseInt(source_id) : 0;

    return NextResponse.json({ 
      success: true, 
      freestarYsmTypecodes,
      source_id,
      source_type
    }, { status: 200 });

  } catch (error) {
    console.error('Freestar API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal Server Error. Please try again later.',
      },
      { status: 500 }
    );
  }
}