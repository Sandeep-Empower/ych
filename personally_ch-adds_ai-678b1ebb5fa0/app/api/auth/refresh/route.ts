import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Generate new access and refresh tokens using a valid refresh token
 *     tags:
 *       - Authentication
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token (optional if provided in cookies)
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: New JWT access token
 *                 refreshToken:
 *                   type: string
 *                   description: New JWT refresh token
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *         headers:
 *           Set-Cookie:
 *             description: Updated authentication cookies
 *             schema:
 *               type: string
 *       400:
 *         description: Missing refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid or expired refresh token
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
export async function POST(request: NextRequest) {
  try {
    let refreshToken;

    // Try to get refresh token from request body first
    try {
      const body = await request.json();
      refreshToken = body.refreshToken;
    } catch (jsonError) {
      // If JSON parsing fails, try to get from cookies
      refreshToken = request.cookies.get('refreshToken')?.value;
    }

    // If still no refresh token, try cookies as fallback
    if (!refreshToken) {
      refreshToken = request.cookies.get('refreshToken')?.value;
    }

    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token is required' }, { status: 400 });
    }

    // Verify the refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'your-refresh-secret-key'
    ) as { userId: string; email: string };

    // Check if the session exists and is active
    const session = await prisma.userSession.findFirst({
      where: {
        refresh_token: refreshToken,
        user_id: decoded.userId,
        is_active: true,
        expires_at: {
          gt: new Date()
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nicename: true,
            role: true
          }
        }
      }
    });

    if (!session) {
      return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Generate new refresh token
    const newRefreshToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'your-refresh-secret-key',
      { expiresIn: '30d' }
    );

    // Update the session with new refresh token
    await prisma.userSession.update({
      where: { id: session.id },
      data: {
        refresh_token: newRefreshToken,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    // Set new cookies
    const response = NextResponse.json(
      { 
        success: true, 
        token: newAccessToken, 
        refreshToken: newRefreshToken,
        user: session.user
      },
      { status: 200 }
    );

    // Set new access token cookie
    response.cookies.set('token', newAccessToken, {
      httpOnly: true,
      secure: process.env.APP_ENV === 'production' || process.env.APP_ENV === 'staging',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    // Set new refresh token cookie
    response.cookies.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.APP_ENV === 'production' || process.env.APP_ENV === 'staging',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });

    return response;
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
  }
} 