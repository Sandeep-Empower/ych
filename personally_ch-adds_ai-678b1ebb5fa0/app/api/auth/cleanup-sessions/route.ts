import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Cleanup expired sessions
export async function POST(req: NextRequest) {
  try {
    // Verify the request is from an authorized source (you can add authentication here)
    const authHeader = req.headers.get('authorization');
    
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_TOKEN}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting session cleanup at:', new Date().toISOString());

    // Deactivate expired sessions
    const expiredSessions = await prisma.userSession.updateMany({
      where: {
        expires_at: {
          lt: new Date()
        },
        is_active: true
      },
      data: {
        is_active: false
      }
    });

    // Optionally, you can also delete very old sessions (older than 90 days)
    const oldSessions = await prisma.userSession.deleteMany({
      where: {
        expires_at: {
          lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        }
      }
    });

    console.log(`Session cleanup completed: ${expiredSessions.count} sessions deactivated, ${oldSessions.count} old sessions deleted`);

    return NextResponse.json({
      success: true,
      message: 'Session cleanup completed',
      expiredSessionsDeactivated: expiredSessions.count,
      oldSessionsDeleted: oldSessions.count,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Session cleanup error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
