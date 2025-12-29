import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

/**
 * @swagger
 * /api/auth/verify:
 *   post:
 *     summary: Verify JWT token
 *     description: Verify the validity of a JWT access token and return user information
 *     tags:
 *       - Authentication
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: true
 *                 decoded:
 *                   type: object
 *                   description: Decoded JWT payload
 *                   properties:
 *                     userId:
 *                       type: string
 *                       example: user-uuid-123
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *                     iat:
 *                       type: number
 *                       description: Issued at timestamp
 *                     exp:
 *                       type: number
 *                       description: Expiration timestamp
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   description: The verified token
 *       401:
 *         description: No token provided, token expired, or invalid token
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
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // SECURITY: Fail if JWT_SECRET is not configured
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET environment variable is not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userData = payload as { userId: string, email: string, iat: number, exp: number };

    if (userData.exp * 1000 < Date.now()) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userData.userId },
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

    return NextResponse.json({ valid: true, decoded: payload, user, token }, { status: 200 });
  } catch (error) {
    console.error('JWT verification failed:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
} 