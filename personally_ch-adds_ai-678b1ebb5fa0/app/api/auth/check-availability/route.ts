import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const username = searchParams.get('username');
    const company = searchParams.get('company');

    if (!email && !username && !company) {
      return NextResponse.json({ error: 'Email, username or is required' }, { status: 400 });
    }

    let emailAvailable = undefined;
    let usernameAvailable = undefined;
    let companyAvailable = undefined;

    if (email) {
      const user = await prisma.user.findUnique({ where: { email } });
      emailAvailable = !user;
    }

    if (username) {
      const user = await prisma.user.findFirst({ where: { nicename: username } });
      usernameAvailable = !user;
    }

    if (company) {
      // Check if any user has a meta with key 'company' and value equal to the provided company name
      const user = await prisma.user.findFirst({
        where: {
          metas: {
            some: {
              meta_key: 'company',
              meta_value: company,
            },
          },
        },
      });
      companyAvailable = !user;
    }

    return NextResponse.json({
      emailAvailable,
      usernameAvailable,
      companyAvailable
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json({ error: 'Failed to check availability' }, { status: 500 });
  }
} 