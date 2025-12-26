import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendContactEmail({
  name,
  email,
  subject,
  message,
}: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const msg = {
    to: process.env.ADMIN_EMAIL!, // admin receiver
    from: process.env.SENDGRID_FROM_EMAIL!, // verified sender
    subject: `New Contact Message: ${subject}`,
    text: `
You have received a new contact form message:

Name: ${name}
Email: ${email}
Subject: ${subject}
Message:
${message}
    `,
    html: `
      <h3>New Contact Form Submission</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `,
  };

  await sgMail.send(msg);
}
