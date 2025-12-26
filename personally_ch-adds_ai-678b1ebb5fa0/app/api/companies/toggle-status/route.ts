import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function PUT(req: NextRequest) {
	try {
		const body = await req.json();
		const { id, status } = body;

		if (!id) {
			return NextResponse.json({ 
				success: false, 
				error: 'Company ID is required' 
			}, { status: 400 });
		}

		if (typeof status !== 'boolean') {
			return NextResponse.json({ 
				success: false, 
				error: 'Status must be a boolean value' 
			}, { status: 400 });
		}

		// Get token from cookies for authorization
		const token = req.cookies.get('token')?.value;
		if (!token) {
			return NextResponse.json({ 
				success: false, 
				error: 'Unauthorized' 
			}, { status: 401 });
		}

		// Verify token and get user ID
		const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
		const userId = decoded.userId;

		// Check if company exists and user has permission
		const existingCompany = await prisma.company.findUnique({
			where: { id },
			include: { user: true }
		});

		if (!existingCompany) {
			return NextResponse.json({ 
				success: false, 
				error: 'Company not found' 
			}, { status: 404 });
		}

		// Check if user owns the company or is admin
		if (existingCompany.user_id !== userId) {
			const user = await prisma.user.findUnique({
				where: { id: userId },
				include: { role: true }
			});

			if (user?.role.name !== 'admin') {
				return NextResponse.json({ 
					success: false, 
					error: 'You do not have permission to update this company' 
				}, { status: 403 });
			}
		}

		// Check if company has any sites registered
		const companyWithSites = await prisma.company.findUnique({
			where: { id },
			include: {
				sites: {
					select: {
						id: true,
						domain: true,
						site_name: true,
						status: true,
					}
				}
			}
		});

		if (companyWithSites && companyWithSites.sites.length > 0) {
			return NextResponse.json({ 
				success: false, 
				error: `Cannot ${status ? 'enable' : 'disable'} company with ${companyWithSites.sites.length} site(s) registered. Please delete all sites first.` 
			}, { status: 400 });
		}

		// Update company status
		const updatedCompany = await prisma.company.update({
			where: { id },
			data: {
				status,
				updated_at: new Date(),
			},
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
			}
		});

		return NextResponse.json({
			success: true,
			data: updatedCompany,
			message: `Company ${status ? 'enabled' : 'disabled'} successfully`
		});

	} catch (error) {
		console.error('Error toggling company status:', error);
		return NextResponse.json(
			{ 
				success: false, 
				error: 'Failed to update company status' 
			}, 
			{ status: 500 }
		);
	} finally {
		await prisma.$disconnect();
	}
} 