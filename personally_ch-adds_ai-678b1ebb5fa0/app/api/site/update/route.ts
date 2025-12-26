import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { uploadToSpaces } from '@/lib/do-spaces';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // Extract all form data
    const siteId = formData.get('siteId')?.toString() || '';
    const domain = formData.get('domain')?.toString() || '';
    const siteName = formData.get('siteName')?.toString() || '';
    const tagline = formData.get('tagline')?.toString() || '';
    const company = formData.get('company')?.toString() || '';
    const companyName = formData.get('companyName')?.toString() || '';
    const phone = formData.get('phone')?.toString() || '';
    const email = formData.get('email')?.toString() || '';
    const address = formData.get('address')?.toString() || '';
    const logo = formData.get('logo') as File | null;
    const favicon = formData.get('favicon') as File | null;
    const accentColor = formData.get('accentColor')?.toString() || '';
    let logoUrl = formData.get('logoUrl')?.toString() || '';
    let faviconUrl = formData.get('faviconUrl')?.toString() || '';

    // Validate required fields early
    if (!siteId || !domain || !siteName || !tagline) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify JWT from cookie
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let userId = '';
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as { userId: string };
      userId = decoded.userId;
    } catch {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Validate site exists
    const existingSite = await prisma.site.findUnique({
      where: { domain, id: siteId },
    });

    if (!existingSite) {
      return NextResponse.json({ error: 'Site does not exist' }, { status: 400 });
    }

    // Upload logo to DigitalOcean Spaces
    if (logo && logo.size > 0) {
      const buffer = Buffer.from(await logo.arrayBuffer());
      const filename = `${Date.now()}-${logo.name}`;
      logoUrl = await uploadToSpaces(buffer, filename, 'logo', logo.type);
    }

    // Upload favicon
    if (favicon && favicon.size > 0) {
      const buffer = Buffer.from(await favicon.arrayBuffer());
      const filename = `${Date.now()}-${favicon.name}`;
      faviconUrl = await uploadToSpaces(buffer, filename, 'favicon', favicon.type);
    }

		// Delete the metadata
		await prisma.site.update({
			where: { id: siteId },
			data: {
				site_meta: {
					deleteMany: {
						meta_key: {
							in: ['tagline', 'company', 'phone', 'email', 'address', 'logo_url', 'favicon_url', 'accent_color'],
						},
					},
				},
			},
		});		

    // Update the site
    const updatedSite = await prisma.site.update({
      where: { domain, id: siteId },
      data: {
        site_name: siteName,
        site_meta: {
					create: [
						{ meta_key: 'tagline', meta_value: tagline },
						{ meta_key: 'company', meta_value: company || companyName },
						{ meta_key: 'phone', meta_value: phone },
						{ meta_key: 'email', meta_value: email },
						{ meta_key: 'address', meta_value: address },
						{ meta_key: 'logo_url', meta_value: logoUrl },
						{ meta_key: 'favicon_url', meta_value: faviconUrl },
						{ meta_key: 'accent_color', meta_value: accentColor },
					],
				},
      },
    });

    return NextResponse.json({
      success: true,
      siteId: updatedSite.id,
      message: 'Site updated successfully.',
    });

  } catch (err) {
    console.error('Update site error:', err);
    return NextResponse.json({
      error: 'Server error occurred while updating the site.',
    }, { status: 500 });
  }
}
