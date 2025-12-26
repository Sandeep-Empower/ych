import { headers } from 'next/headers'



export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const headersList = await headers()
  const domain = headersList.get('x-domain')

  if (!domain) {
    return null
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    const response = await fetch(`${apiUrl}/api/articles/get/${slug}?domain=${domain}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      // Add cache control to prevent stale data
      cache: 'no-store',
    })

    if (!response.ok) {
      // console.error(`Failed to fetch site data: ${response.status} ${response.statusText}`)
      return null
    }

    const data = await response.json()
    return data.article || null
  } catch (error) {
    console.error('Error fetching site data:', error)
    return null
  }
}

export async function getArticlesByAuthor(author: string, numberOfArticles: number): Promise<Article[] | null> {
  const headersList = await headers()
  const domain = headersList.get('x-domain')

  if (!domain) {
    return null
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    const response = await fetch(`${apiUrl}/api/articles/getByAuthor/${author}?domain=${domain}&limit=${numberOfArticles}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      // Add cache control to prevent stale data
      cache: 'no-store',
    })

    if (!response.ok) {
      // console.error(`Failed to fetch site data: ${response.status} ${response.statusText}`)
      return null
    }

    const data = await response.json()
    return data.articles   || null
  } catch (error) {
    console.error('Error fetching site data:', error)
    return null
  }
}

export async function fetchSearchResults(query: string, page?: number, limit?: number): Promise<SearchResults> {
  // /api/articles/get/search?query=wellness&domain=example.com&page=1&limit=10
  const headersList = await headers()
  const domain = headersList.get('x-domain')
  if (!domain) {
    return { sponsored: [], organic: { articles: [], total: 0, page: 0, limit: 0, totalPages: 0 } }
  }
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
  const response = await fetch(`${apiUrl}/api/articles/get/search?query=${encodeURIComponent(query)}&domain=${domain}&page=${page}&limit=${limit || 10}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    // Add cache control to prevent stale data
    cache: 'no-store',
  })

  if (!response.ok) {
    // console.error(`Failed to fetch site data: ${response.status} ${response.statusText}`)
    return { sponsored: [], organic: { articles: [], total: 0, page: 0, limit: 0, totalPages: 0 } }
  }

  const data = await response.json()
  if (!data || !data.success || !data.articles) {
    return { sponsored: [], organic: { articles: [], total: 0, page: 0, limit: 0, totalPages: 0 } }
  }
  const articles = data as ArticleSearchResult;
  const sponsored = data.sponsored as SponsoredSearchResult[] || [];

  return {
    sponsored,
    organic: articles,
  };
}

export async function getArticlesByTag(tag: string, numberOfArticles: number): Promise<Article[] | null> {
  const headersList = await headers()
  const domain = headersList.get('x-domain')

  if (!domain) {
    return null
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    const response = await fetch(`${apiUrl}/api/articles/getByTag/${tag}?domain=${domain}&limit=${numberOfArticles}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      // Add cache control to prevent stale data
      cache: 'no-store',
    })

    if (!response.ok) {
      // console.error(`Failed to fetch site data: ${response.status} ${response.statusText}`)
      return null
    }

    const data = await response.json()
    return data.articles   || null
  } catch (error) {
    console.error('Error fetching site data:', error)
    return null
  }
}