interface Tag {
  name: string
  slug: string
}

interface ArticleTag {
  id: string
  status: boolean
  created_at: string
  updated_at: string
  tag_id: string
  article_id: string
  tag: Tag
}

interface Article {
  id: string
  title: string
  content: string
  created_at: string
  updated_at: string
  image_url: string
  meta_description: string
  meta_keywords: string
  meta_title: string
  published: boolean
  slug: string
  status: boolean
  article_tags: ArticleTag[]
}

interface SiteMeta {
  meta_key: string
  meta_value: string
}

interface Company {
  id: string
  name: string
  address: string
  phone: string
  email: string
}

interface SiteData {
  id: string
  domain: string
  site_name: string
  status: boolean
  company: Company
  phoneNumber: string
  email: string
  site_meta: SiteMeta[],
  articles: Article[],
  articlesCount: number
}

interface TagData {
  id: string
  name: string
  slug: string
  status: boolean
  created_at: string
  updated_at: string
}

interface ArticleSearchResult {
  articles: Article[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface SponsoredSearchResult {
  title: string
  url: string
  description: string
  image_url?: string
}

interface SearchResults {
  sponsored: SponsoredSearchResult[]
  organic: ArticleSearchResult
}