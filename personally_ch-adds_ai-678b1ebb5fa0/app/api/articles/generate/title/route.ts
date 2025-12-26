import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getDummyTitles } from '../../dummyData';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper to call OpenAI for titles
async function fetchTitles({ contentStyle, tone, niche, language, numberOfArticles }: any) {
  const prompt = `
    You must generate exactly ${numberOfArticles} unique, catchy article titles for a ${niche} website.
    
    Requirements:
    - Style: ${contentStyle}
    - Tone: ${tone}
    - Language: ${language}
    - Format: Respond ONLY with a JSON object in the following format:
    {
      "titles": [
        "Title 1",
        "Title 2",
        ...
        "Title ${numberOfArticles}"
      ]
    }
    Do not include any extra commentary, explanation, or text outside the JSON object.
    Ensure the "titles" array contains exactly ${numberOfArticles} items.
    `;

  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: "You are a professional content writer. Generate engaging article titles."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 3500,
    response_format: { type: "json_object" }
  });

  const content = completion.choices[0].message.content;
  if (!content) throw new Error("OpenAI response content is null");
  let titlesArr;
  try {
    const response = JSON.parse(content as string);
    if (Array.isArray(response)) {
      titlesArr = response;
    } else if (Array.isArray(response.titles)) {
      titlesArr = response.titles;
    } else {
      throw new Error("Unexpected response format from OpenAI");
    }
  } catch (e) {
    throw new Error("Failed to parse OpenAI response as expected titles array");
  }
  return titlesArr;
}

export async function POST(req: NextRequest) {
  const { contentStyle, tone, niche, language, numberOfArticles } = await req.json();

  try {
    if (process.env.APP_ENV !== 'production' && process.env.APP_ENV !== 'staging') {
      return NextResponse.json({ titles: getDummyTitles(numberOfArticles) }, { status: 200 });
    }

    let allTitles: string[] = [];
    let attempts = 0;
    const maxAttempts = 3;
    let remaining = numberOfArticles;
    while (allTitles.length < numberOfArticles && attempts < maxAttempts) {
      const needed = numberOfArticles - allTitles.length;
      const newTitles = await fetchTitles({ contentStyle, tone, niche, language, numberOfArticles: needed });
      // Add only unique titles
      allTitles = Array.from(new Set([...allTitles, ...newTitles]));
      attempts++;
    }
    // If still not enough, fallback to dummy data for the rest
    if (allTitles.length < numberOfArticles) {
      const dummy = getDummyTitles(numberOfArticles - allTitles.length).map((t: any) => t.title);
      allTitles = allTitles.concat(dummy);
    }
    const titles = allTitles.slice(0, numberOfArticles).map((title, index) => ({ id: index + 1, title }));
    return NextResponse.json({ titles }, { status: 200 });
  } catch (error) {
    console.error('Error generating titles:', error);
    const titles = getDummyTitles(numberOfArticles);
    return NextResponse.json({ titles }, { status: 200 });
  }
} 