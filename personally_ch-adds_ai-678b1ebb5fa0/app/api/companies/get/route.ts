import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
	try {
		// Get query parameters for pagination and search
		const { searchParams } = new URL(req.url);
		const page = parseInt(searchParams.get('page') || '1');
		const limit = parseInt(searchParams.get('limit') || '10');
		const search = searchParams.get('search') || '';
		const status = searchParams.get('status');

		// Calculate offset for pagination
		const offset = (page - 1) * limit;

		// Build where clause
		const where: any = {};
		
		if (search) {
			where.OR = [
				{ name: { contains: search, mode: 'insensitive' } },
				{ email: { contains: search, mode: 'insensitive' } },
				{ phone: { contains: search, mode: 'insensitive' } },
				{ address: { contains: search, mode: 'insensitive' } },
			];
		}

		if (status !== null && status !== undefined) {
			where.status = status === 'true';
		}

		// Fetch companies with pagination
		const [companies, totalCount] = await Promise.all([
			prisma.company.findMany({
				where,
				include: {
					user: {
						select: {
							id: true,
							email: true,
							nicename: true,
						}
					},
					sites: {
						select: {
							id: true,
							domain: true,
							site_name: true,
							status: true,
						}
					},
					_count: {
						select: {
							sites: true,
						}
					}
				},
				orderBy: [
					{
						sites: {
							_count: 'desc',
						},
					},
					{
						created_at: 'desc',
					},
				],
				skip: offset,
				take: limit,
			}),
			prisma.company.count({ where }),
		]);

		// Calculate pagination info
		const totalPages = Math.ceil(totalCount / limit);
		const hasNextPage = page < totalPages;
		const hasPrevPage = page > 1;

		return NextResponse.json({
			success: true,
			data: companies,
			pagination: {
				page,
				limit,
				totalCount,
				totalPages,
				hasNextPage,
				hasPrevPage,
			},
		});

	} catch (error) {
		console.error('Error fetching companies:', error);
		return NextResponse.json(
			{ 
				success: false, 
				error: 'Failed to fetch companies' 
			}, 
			{ status: 500 }
		);
	} finally {
		await prisma.$disconnect();
	}
} 