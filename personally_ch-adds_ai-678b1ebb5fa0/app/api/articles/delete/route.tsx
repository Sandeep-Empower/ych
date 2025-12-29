import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isValidUUID } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    // SECURITY: Require authentication
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) {
      return auth;
    }
    const { userId } = auth;

    const { articleId } = await req.json();
    if (!articleId) {
      return NextResponse.json({ error: 'Missing articleId' }, { status: 400 });
    }

    // SECURITY: Validate articleId format
    if (!isValidUUID(articleId)) {
      return NextResponse.json({ error: 'Invalid articleId format' }, { status: 400 });
    }

    // SECURITY: Verify user owns the article's site
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: { site: { select: { user_id: true } } }
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    if (article.site.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized - You do not own this article' }, { status: 403 });
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
