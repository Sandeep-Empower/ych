import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getDummyArticles } from '../../dummyData';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * @swagger
 * /api/articles/generate/article:
 *   post:
 *     summary: Generate articles using AI
 *     description: Generate complete articles with content, meta descriptions, tags, and image prompts using OpenAI
 *     tags:
 *       - Articles
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titles
 *               - contentStyle
 *               - tone
 *               - niche
 *               - language
 *               - numberOfArticles
 *             properties:
 *               titles:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of article titles to generate content for
 *                 example: ["How to Build a Website", "Best SEO Practices"]
 *               contentStyle:
 *                 type: string
 *                 description: Writing style for the articles
 *                 example: "Professional and informative"
 *               tone:
 *                 type: string
 *                 description: Tone of voice for the articles
 *                 example: "Friendly and engaging"
 *               niche:
 *                 type: string
 *                 description: Industry or topic niche
 *                 example: "Web Development"
 *               language:
 *                 type: string
 *                 description: Language for the articles
 *                 example: "English"
 *               numberOfArticles:
 *                 type: integer
 *                 description: Number of articles to generate
 *                 example: 2
 *     responses:
 *       200:
 *         description: Articles generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 articles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                         description: Article title
 *                       content:
 *                         type: string
 *                         description: Article content in HTML format
 *                       slug:
 *                         type: string
 *                         description: URL-friendly slug
 *                       meta_description:
 *                         type: string
 *                         description: SEO meta description
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: Article tags
 *                       image_prompt:
 *                         type: string
 *                         description: Prompt for generating featured image
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(req: NextRequest) {
  try {
    const { contentStyle, tone, niche, language, numberOfArticles, titles } = await req.json();

    if (process.env.APP_ENV !== 'production' && process.env.APP_ENV !== 'staging') {
      return NextResponse.json({ articles: getDummyArticles(numberOfArticles) }, { status: 200 });
    }

    // Prepare the prompt for OpenAI
    const prompt = `
      For each of the following article titles, generate an engaging, well-structured article with metadata and image details.

      Write each article with the following requirements:

      1. **Content**: 
        - 1500 to 2500 words
        - Style: ${contentStyle}
        - Tone: ${tone}
        - Language: ${language}
        - Use proper headings (H2, H3) and paragraph formatting
        - Ensure readability and SEO best practices

      2. **Slug**:
        - URL-friendly version of the title
        - Lowercase, words separated by hyphens

      3. **Meta Description**:
        - 2-3 sentence summary (approx. 150-160 characters)
        - Written to maximize click-through rate on search engines

      4. **Tags**:
        - Array of 1-2 relevant tags/keywords

      5. **Image Prompt**:
        - A vivid, specific, and imaginative description of a scene that can be used to generate a high-quality featured image. The scene must be safe, family-friendly, and compliant with content policies — avoid references to people, faces, nudity, violence, weapons, drugs, controversial or political topics, real brands, or any sensitive material. Focus on objects, landscapes, abstract visuals, architecture, or nature elements that visually represent the article’s theme. 

      ---

      Here are the article titles:

      ${titles.map((title: string, i: number) => `${i + 1}. ${title}`).join('\n')}

      ---

      Please respond in the following strict JSON format:

      {
        "articles": [
          {
            "title": "Article Title",
            "slug": "article-title",
            "metaDescription": "Short meta description here...",
            "tags": ["tag1", "tag2"],
            "content": "Full article content here...",
            "imagePrompt": "A vivid scene of ..."
          },
          ...
        ]
      }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a professional content writer. Generate engaging article content."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });
    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("OpenAI response content is null");
    }
    let articlesArr;
    try {
      const response = JSON.parse(content as string);
      // Accept both { articles: [...] } and just an array
      if (Array.isArray(response)) {
        articlesArr = response;
      } else if (Array.isArray(response.articles)) {
        articlesArr = response.articles;
      } else {
        throw new Error("Unexpected response format from OpenAI");
      }
    } catch (e) {
      throw new Error("Failed to parse OpenAI response as expected articles array");
    }
    const articles = articlesArr.map((article: any, index: number) => ({
      id: index + 1,
      title: article.title,
      slug: article.slug,
      content: article.content,
      metaDescription: article.metaDescription,
      tags: article.tags,
      imagePrompt: article.imagePrompt
    }));
    return NextResponse.json({ articles }, { status: 200 });
  } catch (error) {
    console.error('Error generating articles:', error);
    return NextResponse.json({ error: 'Failed to generate articles' }, { status: 500 });
  }
} 