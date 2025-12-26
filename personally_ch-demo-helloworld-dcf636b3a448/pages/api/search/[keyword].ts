import { NextApiRequest, NextApiResponse } from 'next';
import xml2js from 'xml2js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let { keyword } = req.query;
  const domain = req.headers.host?.replace(':3001', '');

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
  const apiUrl = process.env.Freestar_API_URL || 'https://searchapi.freestar.com/feed';
  const apiKey = process.env.Freestar_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Freestar API key not configured' });
  }

  const clientIp =
    (Array.isArray(req.headers['x-forwarded-for']) ? req.headers['x-forwarded-for'][0] :
      req.headers['x-forwarded-for']) ||
    req.socket?.remoteAddress ||
    '';

  const postFields: Record<string, string> = {
    keywords: searchKeyword,
    src: 'SS',
    market: 'us',
    network: '',
    campaign: '',
    adgroup: '',
    supplier: '',
    
    ip: clientIp.toString(),
    serve_url: `https://likedcontent.com/search/${searchKeyword}`,
    ua: req.headers['user-agent'] ?? '',
    type: 'SS',
    enable_merch_rating: '1',
    enable_favicon: '1',
    enable_action_ext: '1',
    enable_site_links: '1',
    enable_enhanced_site_link: '1',
    enable_image_extensions: '1',
    enable_callout_extension: '1',
    enable_more_sponsored_results: '1',
    enable_product_ads: '1',
    enable_pla_merchant_promotion: '1',
    enable_pla_product_ratings: '1',
    enable_pla_price_drop: '1',
    enable_pla_elite_badge: '1'
  };

  // Call an API to get the source_type
  const sourceTypeResponse = await fetch(`${process.env.API_URL}/api/freestar/insertupdate`, {
    method: 'POST',
    body: JSON.stringify({
      domain: domain,
      keyword: searchKeyword,
      src: 'SS',
      market: 'us',
      serve_url: `https://likedcontent.com/search/${searchKeyword}`,
      adgroup: '',
      network: '',
      campaign: '',
      supplier: '',
    }),
  });

  let source_type = 0;
  if (sourceTypeResponse.ok) {
    const sourceTypeData = await sourceTypeResponse.json();
    source_type = sourceTypeData.source_id || 0;
  }

  try {
    const response = await fetch(apiUrl + '?' + new URLSearchParams(postFields), {
      method: 'GET',
      headers: {
        'Authorization': process.env.Freestar_API_KEY || '',
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });

    if (!response.ok) {
      console.error(`Error fetching from API: ${response.status} ${response.statusText}`);
      res.status(500).json({ error: 'Failed to fetch results from the API' });
      return;
    }

    const xml = await response.text();
    
    const parseString = xml2js.parseStringPromise;
    const json = await parseString(xml);

    const listings = json?.Results?.ResultSet?.[0]?.Listing;

    res.status(200).json({ listings });
  } catch (error) {
    console.error('Error fetching or parsing API response:', error);
    res.status(500).json({ error: 'Failed to fetch results from the API' });
  }
}
