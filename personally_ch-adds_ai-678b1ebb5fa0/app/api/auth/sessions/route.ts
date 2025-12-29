import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, isValidUUID } from '@/lib/security';

// Get all active sessions for a user
export async function GET(req: NextRequest) {
  try {
    // SECURITY: Require authentication
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) {
      return auth;
    }
    const { userId } = auth;

    // Get all active sessions for the user
    const sessions = await prisma.userSession.findMany({
      where: {
        user_id: userId,
        is_active: true,
        expires_at: {
          gt: new Date()
        }
      },
      select: {
        id: true,
        device_info: true,
        ip_address: true,
        created_at: true,
        expires_at: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return NextResponse.json({ 
      success: true, 
      sessions 
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

// Logout from a specific session
export async function DELETE(req: NextRequest) {
  try {
    // SECURITY: Require authentication
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) {
      return auth;
    }
    const { userId } = auth;

    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // SECURITY: Validate session ID format
    if (!isValidUUID(sessionId)) {
      return NextResponse.json({ error: 'Invalid session ID format' }, { status: 400 });
    }

    // Deactivate the specific session
    const result = await prisma.userSession.updateMany({
      where: {
        id: sessionId,
        user_id: userId,
        is_active: true
      },
      data: {
        is_active: false
      }
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Session not found or already inactive' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Session logged out successfully' 
    });
  } catch (error) {
    console.error('Delete session error:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
