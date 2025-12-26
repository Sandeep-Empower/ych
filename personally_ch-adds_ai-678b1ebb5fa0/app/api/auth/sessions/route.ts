import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// Get all active sessions for a user
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Access token required' }, { status: 401 });
    }

    // Verify access token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as { userId: string };

    // Get all active sessions for the user
    const sessions = await prisma.userSession.findMany({
      where: {
        user_id: decoded.userId,
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
    const { sessionId } = await req.json();
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Access token required' }, { status: 401 });
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Verify access token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as { userId: string };

    // Deactivate the specific session
    const result = await prisma.userSession.updateMany({
      where: {
        id: sessionId,
        user_id: decoded.userId,
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
