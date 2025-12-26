import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: User logout
 *     description: Logout user from current device or all devices
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
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
 *               logoutAll:
 *                 type: boolean
 *                 description: Whether to logout from all devices
 *                 default: false
 *                 example: false
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 *         headers:
 *           Set-Cookie:
 *             description: Cleared authentication cookies
 *             schema:
 *               type: string
 *       400:
 *         description: Missing refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Logged out from all devices
 */
export async function POST(req: NextRequest) {
  try {
    let refreshToken, logoutAll = false;
    
    try {
      const body = await req.json();
      refreshToken = body.refreshToken;
      logoutAll = body.logoutAll || false;
    } catch (e) {
      // If no JSON body, try to get from cookies
      refreshToken = req.cookies.get('refreshToken')?.value;
    }

    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token is required' }, { status: 400 });
    }

    // Verify the refresh token to get user ID
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'your-refresh-secret-key'
    ) as { userId: string };

    if (logoutAll) {
      // Logout from all devices - deactivate all sessions for the user
      await prisma.userSession.updateMany({
        where: {
          user_id: decoded.userId,
          is_active: true
        },
        data: {
          is_active: false
        }
      });
    } else {
      // Logout from current device only - deactivate the specific session
      await prisma.userSession.updateMany({
        where: {
          refresh_token: refreshToken,
          user_id: decoded.userId,
          is_active: true
        },
        data: {
          is_active: false
        }
      });
    }

    // Clear cookies
    const response = NextResponse.json({ 
      success: true, 
      message: logoutAll ? 'Logged out from all devices' : 'Logged out successfully' 
    });

    response.cookies.delete('token');
    response.cookies.delete('refreshToken');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    // Clear cookies
    const response = NextResponse.json({ 
      success: true, 
      message: 'Logged out from all devices'
    });

    response.cookies.delete('token');
    response.cookies.delete('refreshToken');
    return response;
  }
}