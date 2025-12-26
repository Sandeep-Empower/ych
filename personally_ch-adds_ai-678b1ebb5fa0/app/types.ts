

type Article = {
    id: number;
    title: string;
    metaDescription: string;
    content: string;
    tags: string[];
    featuredImage: string;
    imagePrompt?: string;
  };
  
  type Title = {
    id: number;
    title: string;
  };
  
  type Tag = {
    tag: {
      name: string;
      slug: string;
    }
  }
  
  type SiteArticle = {
    id: string;
    image_url: string;
    slug: string
    title: string;
    created_at: string;
    meta_description: string;
    content: string;
    article_tags: Tag[]
  };