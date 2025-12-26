import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const website = searchParams.get('website') || '';
    const dateFrom = searchParams.get('date_from') || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dateTo = searchParams.get('date_to') || new Date().toISOString().split('T')[0];
    const format = searchParams.get('format') || '';
    const totals = searchParams.get('totals') === '1';

    // Validate login
    if (!website) {
      return NextResponse.json({ error: 'No or invalid ID specified' }, { status: 400 });
    }

    // Validate date format
    const dateRegex = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
    if (!dateRegex.test(dateFrom) || !dateRegex.test(dateTo)) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    const site = await prisma.site.findUnique({
      where: {
        id: website
      }
    });

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }


    // Fetch data from freestar_ysm_typecodes table
    const typecodes = await prisma.freestarYsmTypecodes.findMany({
      where: {
        c_site: site.domain,
        c_supplier: ''
      }
    });
    console.log(typecodes);

    if (typecodes.length === 0) {
      return NextResponse.json({ 
        chartData: [],
        summaryTotals: { total_clicks: 0, total_revenue: 0 }
      });
    }

    // Get type IDs for the query
    const typeIds = typecodes.map(t => t.id);

    // Fetch real data from imp_freestar_ysm_hourly table
    const hourlyData = await prisma.impFreestarYsmHourly.findMany({
      where: {
        date: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo)
        },
        type_tag: {
          in: typeIds
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Process data for chart
    const chartData = processForChart(hourlyData, dateFrom, dateTo);

    // Calculate summary totals
    const summaryTotals = {
      total_clicks: chartData.reduce((sum, item) => sum + item.bidded_clicks, 0),
      total_revenue: chartData.reduce((sum, item) => sum + item.revenue, 0)
    };

    // Handle different output formats
    if (format) {
      switch (format) {
        case 'csv':
          return outputCSV(chartData);
        case 'json':
          return NextResponse.json(chartData);
        case 'xml':
          return outputXML(chartData);
        default:
          break;
      }
    }

    return NextResponse.json({
      chartData,
      summaryTotals,
      isSingleDay: dateFrom === dateTo
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

function processForChart(data: any[], dateFrom: string, dateTo: string) {
  const isSingleDay = dateFrom === dateTo;
  const finalData: any[] = [];

  if (isSingleDay) {
    const hourlyData: Record<string, { clicks: number, revenue: number }> = {};

    // Aggregate clicks and revenue by hour
    data.forEach(row => {
      const hour = row.hour;
      if (!hourlyData[hour]) {
        hourlyData[hour] = { clicks: 0, revenue: 0 };
      }
      hourlyData[hour].clicks += row.bidded_clicks || 0;
      hourlyData[hour].revenue += row.partner_net_revenue || 0;
    });

    Object.keys(hourlyData).forEach(hour => {
      finalData.push({
        date: `${dateFrom} ${hour.padStart(2, '0')}:00`,
        bidded_clicks: hourlyData[hour].clicks,
        revenue: hourlyData[hour].revenue
      });
    });
  } else {
    const dailyData: Record<string, { clicks: number, revenue: number }> = {};

    // Aggregate clicks and revenue by day
    data.forEach(row => {
      const date = row.date.toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { clicks: 0, revenue: 0 };
      }
      dailyData[date].clicks += row.bidded_clicks || 0;
      dailyData[date].revenue += row.partner_net_revenue || 0;
    });

    Object.keys(dailyData).forEach(date => {
      finalData.push({
        date: date,
        bidded_clicks: dailyData[date].clicks,
        revenue: dailyData[date].revenue
      });
    });
  }

  // Sort by date
  finalData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return finalData;
}

function outputCSV(data: any[]) {
  const csvContent = [
    ['Date', 'Clicks', 'Revenue'],
    ...data.map(row => [row.date, row.bidded_clicks, row.revenue])
  ].map(row => row.join(',')).join('\n');

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="report.csv"'
    }
  });
}

function outputXML(data: any[]) {
  let xmlContent = '<?xml version="1.0" encoding="UTF-8"?><root>';
  
  data.forEach(row => {
    xmlContent += '<record>';
    xmlContent += `<date>${row.date}</date>`;
    xmlContent += `<bidded_clicks>${row.bidded_clicks}</bidded_clicks>`;
    xmlContent += `<revenue>${row.revenue}</revenue>`;
    xmlContent += '</record>';
  });
  
  xmlContent += '</root>';

  return new NextResponse(xmlContent, {
    headers: {
      'Content-Type': 'text/xml'
    }
  });
}
