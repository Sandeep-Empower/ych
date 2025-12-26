import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { articleId } = await req.json();
    if (!articleId) {
      return NextResponse.json({ error: 'Missing articleId' }, { status: 400 });
    }

    // Remove all related article tags first
    await prisma.articleTag.deleteMany({ where: { article_id: articleId } });
    // Delete the article
    await prisma.article.delete({ where: { id: articleId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting article:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
