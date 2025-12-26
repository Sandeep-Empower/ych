import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user with email/username and password
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userEmail
 *               - password
 *             properties:
 *               userEmail:
 *                 type: string
 *                 description: User email or username
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   description: JWT access token
 *                 refreshToken:
 *                   type: string
 *                   description: JWT refresh token
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *         headers:
 *           Set-Cookie:
 *             description: Authentication cookies
 *             schema:
 *               type: string
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
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
export async function POST(request: Request) {
  try {
    const { userEmail, password } = await request.json();

    if (!userEmail || !password) {
      return NextResponse.json({ error: 'Username/Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          {email: userEmail},
          {nicename: userEmail}
        ]
      },
      select: {
        id: true,
        password: true,
        email: true,
        nicename: true,
        metas: true,
        role: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Create access token with longer expiration (7 days for development)
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Create refresh token (30 days)
    let refreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'your-refresh-secret-key',
      { expiresIn: '30d' }
    );

    // Get device information from request headers
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor || realIp || 'Unknown';

    // Create new user session
    try {
      await prisma.userSession.create({
        data: {
          user_id: user.id,
          refresh_token: refreshToken,
          device_info: userAgent,
          ip_address: ipAddress,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          is_active: true
        }
      });
    } catch (error: any) {
      if (error.code === 'P2002' && error.meta?.target?.includes('refresh_token')) {
        // Generate a new unique refresh token and retry
        const newRefreshToken = jwt.sign(
          { userId: user.id, email: user.email, timestamp: Date.now() },
          process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'your-refresh-secret-key',
          { expiresIn: '30d' }
        );
        
        await prisma.userSession.create({
          data: {
            user_id: user.id,
            refresh_token: newRefreshToken,
            device_info: userAgent,
            ip_address: ipAddress,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            is_active: true
          }
        });
        
        // Update the refresh token for the response
        refreshToken = newRefreshToken;
      } else {
        throw error;
      }
    }

    // Set cookies
    const response = NextResponse.json(
      { success: true, token: accessToken, refreshToken: refreshToken, user: user },
      { status: 200 }
    );

    // Set access token cookie
    response.cookies.set('token', accessToken, {
      httpOnly: true,
      secure: process.env.APP_ENV === 'production' || process.env.APP_ENV === 'staging',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    // Set refresh token cookie
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.APP_ENV === 'production' || process.env.APP_ENV === 'staging',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 