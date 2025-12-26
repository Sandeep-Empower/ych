import path from 'path';
import fs from 'fs/promises';
import { NextApiRequest, NextApiResponse } from 'next';

const CACHE_DIR = path.join(process.cwd(), 'cache');
const BING_API_KEY = process.env.BING_API_KEY;
const BING_ENDPOINT = 'https://api.bing.microsoft.com/v7.0/search';
const market = 'en-US';
const responseFilter = 'webpages';
const safeSearch = 'strict';
const count = 3;

async function fetchFromBing(query: string): Promise<any> {
  const url = `${BING_ENDPOINT}?mkt=${market}&responseFilter=${responseFilter}&safeSearch=${safeSearch}&count=${count}&q=${encodeURIComponent(
    query.toLowerCase()
  )}`;

  const response = await fetch(url, {
    headers: {
      'Ocp-Apim-Subscription-Key': BING_API_KEY!,
    },
  });
  const json = await response.json();
  if (!response.ok) {
    console.error(`Bing API error: ${json.error.message}`);
    return { error: json.error.message };
  }
  return json;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let { keyword } = req.query;

  if (!keyword || (Array.isArray(keyword) && keyword.length === 0)) {
    return res.status(400).json({ error: 'Missing search keyword' });
  }

  // decode the html-encoded keyword
  if (Array.isArray(keyword)) {
    keyword = keyword.map(k => decodeURIComponent(k)).join(' ');
  }
  else {
    keyword = decodeURIComponent(keyword as string);
  }

  const searchKeyword = Array.isArray(keyword) ? keyword.join(' ') : keyword;
  const cacheFile = path.join(CACHE_DIR, `${encodeURIComponent(searchKeyword.toLowerCase())}.txt`);

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
      const json = await fetchFromBing(searchKeyword);
      if (json.error) {
        return res.status(500).json({ error: json.error.message });
      }
      await fs.writeFile(cacheFile, JSON.stringify(JSON.stringify(json)));
      data = json;
    }

    res.status(200).json({ results: data.webPages?.value || [] });
  } catch (err) {
    console.error('Error fetching Bing data:', err);
    res.status(500).json({ error: 'Failed to fetch Bing data' });
  }
}
