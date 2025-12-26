import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function PUT(req: NextRequest) {
	try {
		const body = await req.json();
		const { id, name, phone, email, address, vat, status } = body;

		// Validate required fields
		if (!id) {
			return NextResponse.json({ 
				success: false, 
				error: 'Company ID is required' 
			}, { status: 400 });
		}

		if (!name || !phone || !email || !address) {
			return NextResponse.json({ 
				success: false, 
				error: 'Name, phone, email, and address are required' 
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
			// Check if user is admin (you might want to add role checking here)
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

		// Update the company
		const updatedCompany = await prisma.company.update({
			where: { id },
			data: {
				name,
				phone,
				email,
				address,
				vat,
				status: status !== undefined ? status : existingCompany.status,
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
			message: 'Company updated successfully'
		});

	} catch (error) {
		console.error('Error updating company:', error);
		return NextResponse.json(
			{ 
				success: false, 
				error: 'Failed to update company' 
			}, 
			{ status: 500 }
		);
	} finally {
		await prisma.$disconnect();
	}
} 