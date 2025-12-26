import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve user profile information including personal details and company information
 *     tags:
 *       - Profile
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to retrieve profile for
 *         example: user-uuid-123
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                   description: User display name
 *                   example: johndoe
 *                 email:
 *                   type: string
 *                   format: email
 *                   description: User email address
 *                   example: john@example.com
 *                 personalInfo:
 *                   type: object
 *                   properties:
 *                     firstName:
 *                       type: string
 *                       example: John
 *                     lastName:
 *                       type: string
 *                       example: Doe
 *                     phone:
 *                       type: string
 *                       example: +1234567890
 *                     country:
 *                       type: string
 *                       example: USA
 *                     state:
 *                       type: string
 *                       example: California
 *                     city:
 *                       type: string
 *                       example: San Francisco
 *                     zip:
 *                       type: string
 *                       example: 94105
 *                     address:
 *                       type: string
 *                       example: 123 Main St
 *                 companyInfo:
 *                   type: object
 *                   properties:
 *                     companyName:
 *                       type: string
 *                       example: Acme Corp
 *                     companyPhone:
 *                       type: string
 *                       example: +1234567890
 *                     companyEmail:
 *                       type: string
 *                       example: contact@acme.com
 *                     companyAddress:
 *                       type: string
 *                       example: 456 Business Ave
 *                     companyVat:
 *                       type: string
 *                       example: VAT123456
 *       400:
 *         description: Missing userId parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
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
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams?.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { metas: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      username: user.nicename,
      email: user.email,
      personalInfo: {
        firstName: user.metas.find((meta) => meta.meta_key == "first_name")
          ?.meta_value,
        lastName: user.metas.find((meta) => meta.meta_key == "last_name")
          ?.meta_value,
        phone: user.metas.find((meta) => meta.meta_key == "phone")?.meta_value,
        teamsUsername: user.metas.find((meta) => meta.meta_key == "teams")
          ?.meta_value,
        linkedin: user.metas.find((meta) => meta.meta_key == "linkedin")
          ?.meta_value,
        type: user.metas.find((meta) => meta.meta_key == "account_type")
          ?.meta_value,
        userID: user.metas.find((meta) => meta.meta_key == "user_id")
          ?.meta_value,
      },
      companyInfo: user.metas
        ? {
            company: user.metas.find((meta) => meta.meta_key == "company")
              ?.meta_value,
            vat: user.metas.find((meta) => meta.meta_key == "vat")?.meta_value,
            country: user.metas.find((meta) => meta.meta_key == "country")
              ?.meta_value,
            state: user.metas.find((meta) => meta.meta_key == "state")
              ?.meta_value,
            city: user.metas.find((meta) => meta.meta_key == "city")
              ?.meta_value,
            postcode: user.metas.find((meta) => meta.meta_key == "zip")
              ?.meta_value,
            address: user.metas.find((meta) => meta.meta_key == "address")
              ?.meta_value,
          }
        : null,
    });
  } catch (error) {
    console.error("Profile API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { userId, personalInfo, companyInfo } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    if (!personalInfo && !companyInfo) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const metaEntries: Record<string, string | undefined> = {};

    // Collect personal info if present
    if (personalInfo) {
      metaEntries.first_name = personalInfo.firstName;
      metaEntries.last_name = personalInfo.lastName;
      metaEntries.phone = personalInfo.phone;
      metaEntries.teams = personalInfo.teamsUsername;
      metaEntries.linkedin = personalInfo.linkedin;
      metaEntries.account_type = personalInfo.type;
    }

    // Collect company info if present
    if (companyInfo) {
      metaEntries.company = companyInfo.company;
      metaEntries.vat = companyInfo.vat;
      metaEntries.country = companyInfo.country;
      metaEntries.state = companyInfo.state;
      metaEntries.city = companyInfo.city;
      metaEntries.zip = companyInfo.postcode;
      metaEntries.address = companyInfo.address;
    }

    for (const [key, value] of Object.entries(metaEntries)) {
      if (value === undefined) continue;

      await prisma.userMeta.upsert({
        where: {
          user_id_meta_key: {
            user_id: userId,
            meta_key: key,
          },
        },
        update: {
          meta_value: String(value),
        },
        create: {
          user_id: userId,
          meta_key: key,
          meta_value: String(value),
        },
      });
    }

    return NextResponse.json({ message: "✅ Profile updated successfully" });
  } catch (error) {
    console.error("❌ PATCH /api/profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
