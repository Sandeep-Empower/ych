import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { otpStore } from "@/lib/otpStore";

// Validation function
function validateRegistrationData(data: any) {
  const errors: string[] = [];

  // Required fields
  const requiredFields = [
    "email",
    "password",
    "username",
    "first_name",
    "last_name",
    "account_type",
    "company",
    "phone",
  ];
  requiredFields.forEach((field) => {
    if (!data[field] || data[field].trim() === "") {
      errors.push(`${field.replace("_", " ")} is required`);
    }
  });

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (data.email && !emailRegex.test(data.email)) {
    errors.push("Invalid email format");
  }

  // Password validation
  if (data.password) {
    if (data.password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.password)) {
      errors.push(
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      );
    }
  }

  // Phone validation
  const phoneRegex = /^[\+]?[0-9][\d]{0,15}$/;
  if (data.phone && !phoneRegex.test(data.phone.replace(/\s/g, ""))) {
    errors.push("Invalid phone number format");
  }

  return errors;
}

// Helper function to create user meta data
async function createUserMeta(
  tx: any,
  userId: string,
  metaData: Record<string, string>
) {
  const metaEntries = Object.entries(metaData).map(([key, value]) => ({
    user_id: userId,
    meta_key: key,
    meta_value: value || "",
  }));

  return await tx.userMeta.createMany({
    data: metaEntries,
  });
}

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: User registration
 *     description: Register a new user with company information
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - username
 *               - first_name
 *               - last_name
 *               - account_type
 *               - company
 *               - phone
 *               - address
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: User password (min 8 chars, must contain uppercase, lowercase, and number)
 *                 example: Password123
 *               username:
 *                 type: string
 *                 description: User display name
 *                 example: johndoe
 *               first_name:
 *                 type: string
 *                 description: User first name
 *                 example: John
 *               last_name:
 *                 type: string
 *                 description: User last name
 *                 example: Doe
 *               account_type:
 *                 type: string
 *                 description: Type of account
 *                 example: business
 *               company:
 *                 type: string
 *                 description: Company name
 *                 example: Acme Corp
 *               phone:
 *                 type: string
 *                 description: Phone number
 *                 example: +1234567890
 *               address:
 *                 type: string
 *                 description: Address
 *                 example: 123 Main St
 *               teams:
 *                 type: string
 *                 description: Teams information
 *                 example: Development
 *               linkedin:
 *                 type: string
 *                 description: LinkedIn profile URL
 *                 example: https://linkedin.com/in/johndoe
 *               country:
 *                 type: string
 *                 description: Country
 *                 example: USA
 *               state:
 *                 type: string
 *                 description: State/Province
 *                 example: California
 *               city:
 *                 type: string
 *                 description: City
 *                 example: San Francisco
 *               zip:
 *                 type: string
 *                 description: ZIP/Postal code
 *                 example: 94105
 *               vat:
 *                 type: string
 *                 description: VAT number
 *                 example: VAT123456
 *               accept_terms:
 *                 type: boolean
 *                 description: Terms acceptance
 *                 example: true
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     nicename:
 *                       type: string
 *                     role:
 *                       type: string
 *                     status:
 *                       type: boolean
 *                 company:
 *                   $ref: '#/components/schemas/Company'
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Validation failed
 *                 details:
 *                   type: array
 *                   items:
 *                     type: string
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: User with this email already exists
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Internal server error. Please try again later.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      password,
      username,
      first_name,
      last_name,
      account_type,
      teams,
      linkedin,
      country,
      state,
      city,
      zip,
      address,
      accept_terms,
      company,
      phone,
      vat,
    } = body;

    // Validate input data
    const validationErrors = validateRegistrationData(body);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validationErrors,
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "User with this email already exists",
        },
        { status: 409 }
      );
    }

    // Check if company name already exists for this user (if they have other accounts)
    const existingCompany = await prisma.company.findFirst({
      where: {
        name: { equals: company, mode: "insensitive" },
        user: { email: email.toLowerCase().trim() },
      },
    });

    if (existingCompany) {
      return NextResponse.json(
        {
          success: false,
          error: "Company with this name already exists for this user",
        },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Use transaction for data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Find or create a default 'User' role
      const defaultRole = await tx.role.upsert({
        where: { name: "User" },
        update: {},
        create: {
          name: "User",
          status: true,
        },
      });

      // Create user
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          nicename: username.trim(),
          status: true,
          role: {
            connect: { id: defaultRole.id },
          },
        },
        include: {
          role: true,
        },
      });

      // Prepare user meta data
      const userMetaData = {
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        account_type: account_type.trim(),
        teams: teams?.trim() || "",
        linkedin: linkedin?.trim() || "",
        country: country?.trim() || "",
        state: state?.trim() || "",
        city: city?.trim() || "",
        zip: zip?.trim() || "",
        address: address.trim(),
        accept_terms: accept_terms || "false",
      };

      // Create user meta data
      await createUserMeta(tx, user.id, userMetaData);

      // Create company
      const companyRecord = await tx.company.create({
        data: {
          name: company.trim(),
          phone: phone.trim(),
          email: email.toLowerCase().trim(),
          address: `${address.trim()}, ${city.trim()}, ${state.trim()}, ${zip.trim()}`,
          vat: vat?.trim() || "",
          user_id: user.id,
          status: true,
        },
      });

      return { user, company: companyRecord };
    });

    // Clean up registration OTP after successful registration
    const otpKey = `registration_${email.toLowerCase().trim()}`;
    otpStore.delete(otpKey);
    console.log(`Cleaned up registration OTP for ${email}`);

    // Set HTTP-only cookie
    return NextResponse.json(
      {
        success: true,
        message: "User registered successfully",
        user: {
          id: result.user.id,
          email: result.user.email,
          nicename: result.user.nicename,
          role: result.user.role.name,
          status: result.user.status,
        },
        company: {
          id: result.company.id,
          name: result.company.name,
          status: result.company.status,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);

    // Handle specific Prisma errors
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          error: "A user with this email already exists",
        },
        { status: 409 }
      );
    }

    if (error.code === "P2003") {
      return NextResponse.json(
        {
          success: false,
          error: "Database constraint violation. Please check your input data.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error. Please try again later.",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
