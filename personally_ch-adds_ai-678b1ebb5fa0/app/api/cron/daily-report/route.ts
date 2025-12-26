import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


async function call_freestar(date: string): Promise<void> {
  try {
    // Build query parameters
    const params = new URLSearchParams({
      date: date
    });
    
    const url = `https://reporting.searchapi.freestar.com/reporting/search-type/daily?${params.toString()}`;
    
    // Make the API request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': '6kAG1uYAuTjVZJXpJy2ujHC6',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.text();

    // Delete existing data for the date
    const deleted = await prisma.impFreestarYsmDaily.deleteMany({
      where: {
        date: new Date(date)
      }
    });

    console.log(`${deleted.count} records deleted for date ${date}`);

    // Insert new report data
    await insertReportData(result);

  } catch (error) {
    console.error('Error in call_freestar:', error);
    throw error;
  }
}

async function insertReportData(reportData: string): Promise<void> {
  try {
    // Parse CSV data
    const lines = reportData.trim().split('\n');
    
    if (lines.length <= 1) {
      console.log('No data to insert');
      return;
    }

    // Skip the header line
    const dataLines = lines.slice(1);

    for (const line of dataLines) {
      try {
        // Parse CSV line (simple split by comma - you might need a more robust CSV parser for complex data)
        const columns = line.split(',').map(col => col.trim().replace(/^"(.*)"$/, '$1'));
        
        if (columns.length >= 15) {
          // Map the columns to the database fields
          const [
            date,
            siteDomain,
            trafficSourceName,
            trafficSourceCode,
            product,
            market,
            sourceTag,
            typeTag,
            deviceType,
            adType,
            searches,
            biddedSearches,
            biddedResults,
            biddedClicks,
            partnerNetRevenue
          ] = columns;

          // Insert record using Prisma
          await prisma.impFreestarYsmDaily.upsert({
            where: {
              date_site_domain_traffic_source_code_type_tag_device_type_ad_type: {
                date: new Date(date),
                site_domain: siteDomain,
                traffic_source_code: trafficSourceCode,
                type_tag: typeTag,
                device_type: deviceType,
                ad_type: adType
              }
            },
            update: {
              site_domain: siteDomain,
              traffic_source_name: trafficSourceName,
              product: product,
              market: market,
              source_tag: sourceTag,
              searches: parseInt(searches) || 0,
              bidded_searches: parseInt(biddedSearches) || 0,
              bidded_results: parseInt(biddedResults) || 0,
              bidded_clicks: parseInt(biddedClicks) || 0,
              partner_net_revenue: parseFloat(partnerNetRevenue) || 0
            },
            create: {
              date: new Date(date),
              site_domain: siteDomain,
              traffic_source_name: trafficSourceName,
              traffic_source_code: trafficSourceCode,
              product: product,
              market: market,
              source_tag: sourceTag,
              type_tag: typeTag,
              device_type: deviceType,
              ad_type: adType,
              searches: parseInt(searches) || 0,
              bidded_searches: parseInt(biddedSearches) || 0,
              bidded_results: parseInt(biddedResults) || 0,
              bidded_clicks: parseInt(biddedClicks) || 0,
              partner_net_revenue: parseFloat(partnerNetRevenue) || 0
            }
          });
        }
      } catch (recordError) {
        console.error('Error inserting record:', recordError);
        // Continue processing other records
      }
    }

    console.log(`Successfully processed ${dataLines.length} records`);
  } catch (error) {
    console.error('Error in insertReportData:', error);
    throw error;
  }
}

// This endpoint will be called by a cron job service daily at 3 AM
export async function GET(req: NextRequest) {
  try {
    // Verify the request is from the cron job service (you can add authentication here)
    const authHeader = req.headers.get('authorization');
    
    // Add your cron job authentication logic here
    // For example, check for a secret token
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_TOKEN}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting daily Freestar data processing at:', new Date().toISOString());

    //date and script timing stuff
    const datetime = new Date();
    const date = datetime.toISOString().split('T')[0];
    const urldate = datetime.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });

    const time = new Date().getTime();
    const start = time;

    const date_week_ago = new Date(datetime.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const date_yesterday = new Date(datetime.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const date_today = datetime.toISOString().split('T')[0];

    call_freestar(date_yesterday);
    call_freestar(date_today);

    // Adjusted to reflect the change from hourly to daily
    const max_date = await prisma.impFreestarYsmDaily.findMany({
      select: {
        date: true
      },
      orderBy: {
        date: 'desc'
      },
      take: 1
    });
    const max_date_result = max_date?.length > 0 ? max_date[0].date : null;
    console.log('All times are America/New_York');
    console.log(`Freestar Data refreshness: Daily data up to ${max_date_result}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Daily processing completed',
      processedDate: date,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Daily cron job error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal Server Error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Optional: Add a manual trigger endpoint for testing
export async function POST(req: NextRequest) {
  // This allows manual triggering of the daily process for testing
  return GET(req);
}
