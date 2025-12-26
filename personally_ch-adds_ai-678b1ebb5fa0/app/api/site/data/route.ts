import { NextRequest, NextResponse } from 'next/server'
import { getDummyArticles } from '../../articles/dummyData';
import { prisma } from '@/lib/prisma';

/**
 * @swagger
 * /api/site/data:
 *   get:
 *     summary: Get site data by domain
 *     description: Retrieve comprehensive site information including articles, meta data, and company details
 *     tags:
 *       - Site Management
 *     parameters:
 *       - in: query
 *         name: domain
 *         required: true
 *         schema:
 *           type: string
 *         description: Site domain name
 *         example: example.com
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for article pagination
 *         example: 1
 *     responses:
 *       200:
 *         description: Site data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Site ID
 *                 domain:
 *                   type: string
 *                   description: Site domain
 *                 site_name:
 *                   type: string
 *                   description: Site name
 *                 site_meta:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       meta_key:
 *                         type: string
 *                       meta_value:
 *                         type: string
 *                 company:
 *                   $ref: '#/components/schemas/Company'
 *                 articles:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Article'
 *       400:
 *         description: Missing domain parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Site not found
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
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = (searchParams.get('domain') as string).toLowerCase().trim();
    const page = searchParams.get('page') || 1
    const take = 12
    const skip = (Number(page) -1) * take

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain parameter is required' },
        { status: 400 }
      )
    }

    // Query the database for site data
    const site = await prisma.site.findUnique({
      where: { domain },
      include: {
        site_meta: true,
        company: true,
        articles: {
          skip: skip,
          take: take,
          include: {
            article_tags: {
              include: {
                tag: {
                  select: {
                    name: true,
                    slug: true,
                  }
                }
              }
            }
          },

        }
      }
    });

    if (!site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      )
    }

    const articlesCount = await prisma.article.count({
      where: { site_id: site?.id },
    });
    let data = { ...site, articlesCount };
  
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error fetching site data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 