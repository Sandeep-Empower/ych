import { NextRequest, NextResponse } from 'next/server';
import { swaggerSpec } from '@/lib/swagger';

/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: Get Swagger API documentation
 *     description: Returns the OpenAPI specification for the Adds AI API
 *     tags:
 *       - Documentation
 *     responses:
 *       200:
 *         description: OpenAPI specification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
export async function GET(req: NextRequest) {
  return NextResponse.json(swaggerSpec);
}
