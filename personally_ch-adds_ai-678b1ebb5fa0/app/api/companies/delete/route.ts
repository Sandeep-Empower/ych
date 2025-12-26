import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function DELETE(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const id = searchParams.get('id');

		if (!id) {
			return NextResponse.json({ 
				success: false, 
				error: 'Company ID is required' 
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
			include: { 
				user: true,
				sites: {
					include: {
						articles: true,
						static_pages: true,
						contacts: true,
						site_meta: true,
					}
				}
			}
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
					error: 'You do not have permission to delete this company' 
				}, { status: 403 });
			}
		}

		// Check if company has any sites (active or inactive)
		if (existingCompany.sites.length > 0) {
			return NextResponse.json({ 
				success: false, 
				error: `Cannot delete company with ${existingCompany.sites.length} site(s) registered. Please delete all sites first.` 
			}, { status: 400 });
		}

		// Delete company and all related data in a transaction
		await prisma.$transaction(async (tx) => {
			// Delete all site-related data first
			for (const site of existingCompany.sites) {
				// Delete site meta
				await tx.siteMeta.deleteMany({
					where: { site_id: site.id }
				});

				// Delete contacts
				await tx.contact.deleteMany({
					where: { site_id: site.id }
				});

				// Delete static pages
				await tx.staticPage.deleteMany({
					where: { site_id: site.id }
				});

				// Delete articles and their tags
				for (const article of site.articles) {
					await tx.articleTag.deleteMany({
						where: { article_id: article.id }
					});
				}

				// Delete articles
				await tx.article.deleteMany({
					where: { site_id: site.id }
				});

				// Delete the site
				await tx.site.delete({
					where: { id: site.id }
				});
			}

			// Finally delete the company
			await tx.company.delete({
				where: { id }
			});
		});

		return NextResponse.json({
			success: true,
			message: 'Company and all associated data deleted successfully'
		});

	} catch (error) {
		console.error('Error deleting company:', error);
		return NextResponse.json(
			{ 
				success: false, 
				error: 'Failed to delete company' 
			}, 
			{ status: 500 }
		);
	} finally {
		await prisma.$disconnect();
	}
} 