// app/api/bing/route.ts

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const CACHE_DIR = path.join(process.cwd(), 'cache');
const BING_API_KEY = process.env.BING_API_KEY;
const BING_ENDPOINT = 'https://api.bing.microsoft.com/v7.0/search';

async function fetchFromBing(query: string): Promise<any> {
  const url = `${BING_ENDPOINT}?mkt=en-US&responseFilter=webpages&safeSearch=strict&count=10&q=${encodeURIComponent(
    query.toLowerCase()
  )}`;

  const response = await fetch(url, {
    headers: {
      'Ocp-Apim-Subscription-Key': BING_API_KEY!,
    },
  });

  const json = await response.json();
  return json;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get('q');

  if (!keyword) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  const cacheFile = path.join(CACHE_DIR, `${encodeURIComponent(keyword.toLowerCase())}.txt`);

  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    const exists = await fs
      .access(cacheFile)
      .then(() => true)
      .catch(() => false);

    let data;

    if (exists) {
      const raw = await fs.readFile(cacheFile, 'utf-8');
      data = JSON.parse(JSON.parse(raw));
    } else {
      const json = await fetchFromBing(keyword);
      await fs.writeFile(cacheFile, JSON.stringify(JSON.stringify(json)));
      data = json;
    }

    return NextResponse.json({ results: data.webPages?.value || [] });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch Bing data' }, { status: 500 });
  }
}
