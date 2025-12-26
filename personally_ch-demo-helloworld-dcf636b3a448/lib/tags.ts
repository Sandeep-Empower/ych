import { headers } from 'next/headers'

export async function getTags(): Promise<Tag[] | null> {
  const headersList = await headers();
  const domain = headersList.get('x-domain');
  const numberOfTags = 10;

  if (!domain) return null;

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    const response = await fetch(`${apiUrl}/api/tags/get?domain=${domain}&limit=${numberOfTags}`, {
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
    return data.tags || null
  } catch (error) {
    console.error('Error fetching site data:', error)
    return null
  }
}