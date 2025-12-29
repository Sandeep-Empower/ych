import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendContactEmail } from '@/lib/email';


// Validation function
function validateContactData(data: any) {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Please provide a valid email address');
  }

  if (!data.subject || data.subject.trim().length < 1) {
    errors.push('Subject is required.');
  }

  if (!data.message || data.message.trim().length < 10) {
    errors.push('Message must be at least 10 characters long');
  }

  return errors;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message, siteId } = body;

    // Step 1: Validate input
    const validationErrors = validateContactData({ name, email, subject, message });
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, errors: validationErrors },
        { status: 400 }
      );
    }

    // Step 2: Sanitize input
    const sanitizedData = {
      name: name?.trim() || 'Anonymous',
      email: email?.trim().toLowerCase() || 'no-reply@example.com',
      subject: subject?.trim() || 'No subject',
      message: message?.trim() || '',
    };


    // Step 3: Save to DB
    const contact = await prisma.contact.create({
      data: {
        name: sanitizedData.name,
        email: sanitizedData.email,
        subject: sanitizedData.subject,
        message: sanitizedData.message,
        site_id: siteId,
        created_at: new Date(),
      },
    });

    // Step 5: Notify admin via email
    try {
      await sendContactEmail(sanitizedData);
    } catch (emailError) {
      console.error('SendGrid email failed:', emailError);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Contact form submitted successfully.',
        contactId: contact.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Contact form API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal Server Error. Please try again later.',
      },
      { status: 500 }
    );
  }
}