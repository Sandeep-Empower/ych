import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getDummyArticles } from '../../dummyData'; // Adjust path as needed
import { withTimeoutAndRetry } from '@/lib/withTimeoutAndRetry';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// Fallback article generator
function generateFallbackArticle(title: string, articleId: number) {
  const slug = generateSlug(title);
  return {
    id: articleId,
    title,
    slug,
    metaDescription: `${title} - Comprehensive guide and insights. Learn more about this topic with expert analysis and practical tips.`,
    tags: ['guide', 'insights'],
    content: `<h2>About ${title}</h2><p>This article provides comprehensive information about ${title}. Our team has gathered the most relevant and up-to-date information to help you understand this topic better.</p><h3>Key Points</h3><ul><li>Detailed analysis of ${title}</li><li>Expert insights and recommendations</li><li>Practical applications and examples</li></ul><h3>Conclusion</h3><p>Understanding ${title} is essential for making informed decisions. This guide provides the foundation you need to explore this topic further.</p>`,
    imagePrompt: `Professional illustration representing ${title}, clean design, modern style`,
    featuredImage: '',
  };
}

// Retry function for article generation
async function generateArticleWithRetry(
  title: string,
  contentStyle: string,
  tone: string,
  language: string,
  articleId: number,
  maxRetries = 2
) {
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const systemPrompt = `You are a professional content writer and SEO strategist for ${language}.
        Generate a JSON response for the following article title with:
        - metaDescription (150-160 characters, optimized for click-through)
        - tags: 1-2 relevant keywords
        - content: An HTML text of 1000-2500 words in ${tone} tone and ${contentStyle} style (use SEO practices, H2/H3, proper formatting)
        - imagePrompt: vivid scene for a high-quality featured image

        Respond only in this exact JSON format:
        {
          "article": {
            "metaDescription": "",
            "tags": ["", ""],
            "content": "",
            "imagePrompt": ""
          }
        }

        Title: ${title}

        IMPORTANT: Return ONLY valid JSON. Do NOT include markdown, comments, or explanations. Ensure 'content' an HTML text only.`;

      const start = performance.now();

      const completion = await withTimeoutAndRetry(() =>
        openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'system', content: systemPrompt }],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 3500,
        })
      );

      const end = performance.now();
      const gptDurationMs = Math.round(end - start);

      const content = completion.choices[0].message.content;
      if (!content) {
        throw new Error("OpenAI returned empty content");
      }

      // Safely parse JSON
      try {
        const parsed = JSON.parse(content);
        if (!parsed.article) {
          throw new Error("Missing 'article' key in response");
        }

        const article = {
          ...parsed.article,
          id: articleId,
          title,
          slug: generateSlug(title),
        };

        return { article, durationMs: gptDurationMs };
      } catch (parseError) {
        console.warn(`Attempt ${attempt}: Invalid JSON structure from OpenAI:`, content);
        lastError = parseError;
        
        // If this is the last attempt, continue to next iteration
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
          continue;
        }
      }
    } catch (error) {
      console.warn(`Attempt ${attempt}: Error generating article:`, error);
      lastError = error;
      
      // If this is the last attempt, break and use fallback
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        continue;
      }
    }
  }

  // If all retries failed, return fallback article
  console.warn(`All ${maxRetries} attempts failed for article "${title}". Using fallback.`);
  const fallbackArticle = generateFallbackArticle(title, articleId);
  return { article: fallbackArticle, durationMs: 0, fallback: true };
}

export async function POST(req: NextRequest) {
  try {
    const { contentStyle, tone, language, title, articleId } = await req.json();

    // Return dummy in non-production mode
    if (process.env.APP_ENV !== 'production' && process.env.APP_ENV !== 'staging') {
      const dummy = getDummyArticles(1)[0];
      return NextResponse.json({
        article: {
          ...dummy,
          id: articleId,
          title,
          slug: generateSlug(title),
        },
        durationMs: 500,
      });
    }

    // Generate article with retry mechanism
    const result = await generateArticleWithRetry(
      title,
      contentStyle,
      tone,
      language,
      articleId
    );

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error("Critical error in article generation:", error);
    
    // Even if everything fails, return a fallback article
    const { title, articleId } = await req.json().catch(() => ({ title: 'Article', articleId: 0 }));
    const fallbackArticle = generateFallbackArticle(title, articleId);
    
    return NextResponse.json({ 
      article: fallbackArticle, 
      durationMs: 0, 
      fallback: true,
      error: 'Used fallback due to critical error'
    }, { status: 200 }); // Return 200 instead of 500 to prevent frontend failure
  }
}
