import { NextRequest, NextResponse } from "next/server";
import {
  createCloudflareDNSRecord,
  getCloudflareDomainZoneID,
  removeCloudflareDNSRecord,
  getCloudflareDNSId,
} from "@/lib/cloudflare";
import {
  createLocalConfig,
  installSSLCertificate,
  removeFromHosts,
} from "@/lib/local";
import { uploadToSpaces } from "@/lib/do-spaces";
import { prisma } from "@/lib/prisma";
import sharp from "sharp";
import { requireAuth, validateDomain } from "@/lib/security";

// Helper function to check if DNS A record is propagated
async function checkDNSPropagation(
  domain: string,
  maxAttempts = 3
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(
        `Checking DNS propagation for ${domain} (attempt ${attempt}/${maxAttempts})`
      );

      // Use a public DNS resolver to check if A record exists
      const response = await fetch(
        `https://dns.google/resolve?name=${domain}&type=A`
      );
      const data = await response.json();

      if (data.Answer && data.Answer.length > 0) {
        console.log(`DNS A record found for ${domain}: ${data.Answer[0].data}`);
        return true;
      }

      // Wait before next attempt (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10 seconds
      console.log(`DNS A record not found, waiting ${delay}ms before retry...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    } catch (error) {
      console.error(
        `Error checking DNS propagation (attempt ${attempt}):`,
        error
      );
      if (attempt === maxAttempts) return false;

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  return false;
}

// Helper function to install SSL with DNS propagation check
async function installSSLWithRetry(
  domain: string,
): Promise<boolean> {
  try {
    return await installSSLCertificate(domain);
  } catch (error) {
    console.error(`Error in SSL installation with retry for ${domain}:`, error);
    return false;
  }
}

// Helper function for cleanup operations
async function cleanupOnFailure(
  domain: string,
  zoneID: string | false,
  dnsID: string | false | boolean,
  isCloudflare?: boolean
) {
  try {
    // Find and delete site from database
    const site = await prisma.site.findUnique({
      where: { domain },
    });

    if (site) {
      console.log(`Cleaning up site ${site.id} due to creation failure`);

      // Delete site meta records first (foreign key constraint)
      await prisma.siteMeta.deleteMany({
        where: { site_id: site.id },
      });

      // Delete the site
      await prisma.site.delete({
        where: { id: site.id },
      });

      console.log(`Successfully cleaned up site ${site.id}`);
    }

    // Clean up DNS records in production
    if (isCloudflare && zoneID && dnsID) {
      try {
        await removeCloudflareDNSRecord(zoneID, dnsID);
        console.log(`Cleaned up DNS record for ${domain}`);
      } catch (dnsError) {
        console.error(`Failed to cleanup DNS record for ${domain}:`, dnsError);
      }
    } else {
      // Remove from hosts file in development
      try {
        await removeFromHosts(domain);
        console.log(`Removed ${domain} from hosts file`);
      } catch (hostsError) {
        console.error(
          `Failed to remove ${domain} from hosts file:`,
          hostsError
        );
      }
    }
  } catch (cleanupError) {
    console.error("Error during cleanup process:", cleanupError);
  }
}

/**
 * @swagger
 * /api/site/create:
 *   post:
 *     summary: Create a new site
 *     description: Create a new website with domain configuration, SSL setup, and file uploads
 *     tags:
 *       - Site Management
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - domain
 *               - siteName
 *               - tagline
 *             properties:
 *               domain:
 *                 type: string
 *                 description: Domain name for the site
 *                 example: example.com
 *               siteName:
 *                 type: string
 *                 description: Display name for the site
 *                 example: My Awesome Site
 *               tagline:
 *                 type: string
 *                 description: Site tagline/description
 *                 example: The best site ever
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Logo image file
 *               favicon:
 *                 type: string
 *                 format: binary
 *                 description: Favicon image file
 *               logoUrl:
 *                 type: string
 *                 description: URL to logo image (alternative to file upload)
 *                 example: https://example.com/logo.png
 *               faviconUrl:
 *                 type: string
 *                 description: URL to favicon image (alternative to file upload)
 *                 example: https://example.com/favicon.png
 *               company:
 *                 type: string
 *                 description: Existing company ID
 *                 example: company-uuid-123
 *               companyName:
 *                 type: string
 *                 description: New company name (if creating new company)
 *                 example: Acme Corp
 *               phone:
 *                 type: string
 *                 description: Company phone number
 *                 example: +1234567890
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Company email
 *                 example: contact@example.com
 *               address:
 *                 type: string
 *                 description: Company address
 *                 example: 123 Main St, City, State
 *               accentColor:
 *                 type: string
 *                 description: Site accent color (hex code)
 *                 example: "#3B82F6"
 *               isCloudflare:
 *                 type: boolean
 *                 description: Whether to use Cloudflare DNS
 *                 example: true
 *     responses:
 *       200:
 *         description: Site created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 siteId:
 *                   type: string
 *                   description: Created site ID
 *                 domain:
 *                   type: string
 *                   description: Site domain
 *                 message:
 *                   type: string
 *                   description: Success message
 *       400:
 *         description: Validation error or domain already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     domain:
 *                       type: string
 *                       example: This domain example.com is already connected to another site.
 *                     siteName:
 *                       type: string
 *                       example: Missing site name
 *                     tagline:
 *                       type: string
 *                       example: Missing tagline
 *       401:
 *         description: Unauthorized - missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     unauthorized:
 *                       type: string
 *                       example: Unauthorized
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *                   properties:
 *                     unexpected:
 *                       type: string
 *                       example: An unexpected error occurred while creating the site.
 */
export async function POST(req: NextRequest) {
  try {
    // SECURITY: Require authentication
    const auth = requireAuth(req);
    if (auth instanceof NextResponse) {
      return auth;
    }
    const { userId } = auth;

    const formData = await req.formData();
    let domain = (formData.get("domain") as string)?.toLowerCase().trim();
    const siteName = formData.get("siteName") as string;
    const tagline = formData.get("tagline") as string;
    const logo = formData.get("logo") as File;
    const favicon = formData.get("favicon") as File;
    let logoUrl = formData.get("logoUrl") as string;
    let faviconUrl = formData.get("faviconUrl") as string;
    const companyId = formData.get("company") as string;
    const companyName = formData.get("companyName") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const address = formData.get("address") as string;
    const accentColor = formData.get("accentColor") as string;
    const cloudflareStatus = formData.get("isCloudflare") as string;
    const isCloudflare = cloudflareStatus === "true";

    // Validate required fields
    if (!domain) {
      return NextResponse.json(
        { error: { domain: "Missing domain" } },
        { status: 400 }
      );
    }

    // SECURITY: Validate domain format
    const domainValidation = validateDomain(domain);
    if (!domainValidation.isValid) {
      return NextResponse.json(
        { error: { domain: domainValidation.error } },
        { status: 400 }
      );
    }
    domain = domainValidation.sanitized!;

    if (process.env.APP_ENV === "staging") {
      domain = `dev.${domain}`;
    }

    if (!siteName) {
      return NextResponse.json(
        { error: { siteName: "Missing site name" } },
        { status: 400 }
      );
    }
    if (!tagline) {
      return NextResponse.json(
        { error: { tagline: "Missing tagline" } },
        { status: 400 }
      );
    }

    // Check if domain already exists
    const existingSite = await prisma.site.findUnique({
      where: { domain },
    });
    if (existingSite) {
      return NextResponse.json(
        {
          error: {
            domain: `This domain ${domain} is already connected to another site.`,
          },
        },
        { status: 400 }
      );
    }

    let zoneID: string | boolean = false;
    let dnsID: string | boolean = false;
    if (isCloudflare) {
      zoneID = await getCloudflareDomainZoneID(domain);
    }
    try {
      // Create nginx configuration for the domain
      if (
        process.env.APP_ENV !== "production" &&
        process.env.APP_ENV !== "staging"
      ) {
        // local config
        await createLocalConfig(domain);
      } else if (isCloudflare) { // Cloudflare config
        // Verify domain by Cloudflare API
        if (!zoneID) {
          return NextResponse.json(
            {
              error: {
                domain: `Your domain ${domain} does not exist in Cloudflare.`,
              },
            },
            { status: 400 }
          );
        }

        // Check if DNS record with same name already exists
        const domainIP = process.env.APP_IPv4;
        const existingDNSRecord = await getCloudflareDNSId(
          zoneID,
          domainIP || "",
          domain || ""
        );
        if (existingDNSRecord) {
          return NextResponse.json(
            {
              error: {
                domain: `DNS record with name ${domain} already exists.`,
              },
            },
            { status: 400 }
          );
        }

        const dnsRecord = await createCloudflareDNSRecord(zoneID);
        if (!dnsRecord.success) {
          return NextResponse.json(
            { error: { domain: `${dnsRecord.error} for ${domain}` } },
            { status: 400 }
          );
        }
        dnsID = dnsRecord.id;
      }

      // Install SSL certificate with DNS propagation check
      if (
        process.env.APP_ENV === "production" ||
        process.env.APP_ENV === "staging"
      ) {
        // Wait for DNS propagation before installing SSL
        // First, check if DNS A record is propagated
        const dnsPropagated = await checkDNSPropagation(domain);
        if (!dnsPropagated) {
          console.error(
            `DNS A record not propagated for ${domain} after maximum attempts`
          );
          return NextResponse.json(
            {
              error: {
                dns: `DNS A record not propagated for ${domain}. Please add ${process.env.NEXT_PUBLIC_APP_IPv4} to your DNS records.`,
              },
            },
            { status: 400 }
          );
        }

        // Now install SSL certificate
        console.log(`DNS propagated, installing SSL certificate for ${domain}`);

        const sslInstalled = await installSSLWithRetry(domain);
        if (!sslInstalled) {
          // Clean up DNS record if SSL installation fails
          try {
            if (isCloudflare) {
              await removeCloudflareDNSRecord(zoneID, dnsID);
            }
            console.log(
              `Cleaned up DNS record for ${domain} after SSL failure`
            );
          } catch (cleanupError) {
            console.error(
              `Failed to cleanup DNS record for ${domain}:`,
              cleanupError
            );
          }

          return NextResponse.json(
            {
              error: {
                ssl: `Failed to install SSL certificate for ${domain}. Please check your domain configuration and try again.`,
              },
            },
            { status: 400 }
          );
        }
        console.log(`SSL certificate installed successfully for ${domain}`);
      }

      let company;
      if (companyId) {
        company = await prisma.company.findUnique({
          where: { id: companyId },
        });
        if (!company) {
          return NextResponse.json(
            { error: { company: `Company with id ${companyId} not found` } },
            { status: 400 }
          );
        }
      } else {
        // Do not create company with same name
        const existingCompany = await prisma.company.findFirst({
          where: { name: companyName },
        });
        if (existingCompany) {
          return NextResponse.json(
            {
              error: {
                company: `Company with name ${companyName} already exists`,
              },
            },
            { status: 400 }
          );
        }

        company = await prisma.company.create({
          data: {
            name: companyName,
            user_id: userId,
            email: email,
            phone: phone,
            vat: "",
            address: address,
          },
        });
      }

      // Create site in database with transaction for data consistency
      const site = await prisma.$transaction(async (tx) => {
        const newSite = await tx.site.create({
          data: {
            domain,
            site_name: siteName,
            user_id: userId,
            company_id: company.id,
            // status: false,
            site_meta: {
              create: [
                { meta_key: "tagline", meta_value: tagline },
                { meta_key: "accent_color", meta_value: accentColor },
              ],
            },
          },
        });

        // Upload and store logo if provided
        let finalLogoUrl = logoUrl;
        if (logoUrl && logoUrl !== "") {
          try {
            const logoResponse = await fetch(finalLogoUrl);
            if (!logoResponse.ok) {
              throw new Error(
                `Failed to fetch logo: ${logoResponse.statusText}`
              );
            }

            const bytes = await logoResponse.arrayBuffer();
            const buffer = Buffer.from(bytes);
            // let compressedBuffer = await sharp(buffer)
            // 	.resize({ width: 400, height: 100, fit: 'cover' })
            // 	.png()
            // 	.toBuffer();

            const filename = `logo.png`;
            finalLogoUrl = await uploadToSpaces(
              buffer,
              filename,
              newSite.id,
              "image/png"
            );

            console.log(`Logo uploaded successfully for site ${newSite.id}`);
          } catch (uploadError) {
            console.error(
              `Failed to upload logo for site ${newSite.id}:`,
              uploadError
            );
            finalLogoUrl = ""; // Reset to empty if upload fails
          }
        } else {
          console.log("Uploading logo from file");
          // Upload logo from file
          if (logo) {
            try {
              const logoBuffer = await logo.arrayBuffer();
              const buffer = Buffer.from(logoBuffer);
              // let compressedBuffer = await sharp(buffer)
              // 	.resize({ width: 400, height: 100, fit: 'cover' })
              // 	.png()
              // 	.toBuffer();

              const filename = `logo.png`;
              finalLogoUrl = await uploadToSpaces(
                buffer,
                filename,
                newSite.id,
                "image/png"
              );
            } catch (uploadError) {
              console.error(
                `Failed to upload logo for site ${newSite.id}:`,
                uploadError
              );
              finalLogoUrl = ""; // Reset to empty if upload fails
            }
          }
        }

        // Upload and store favicon if provided
        let finalFaviconUrl = faviconUrl;
        if (faviconUrl && faviconUrl !== "") {
          try {
            const faviconResponse = await fetch(finalFaviconUrl);
            if (!faviconResponse.ok) {
              throw new Error(
                `Failed to fetch favicon: ${faviconResponse.statusText}`
              );
            }

            const bytes = await faviconResponse.arrayBuffer();
            const buffer = Buffer.from(bytes);
            let compressedBuffer = await sharp(buffer)
              .resize({ width: 32, height: 32, fit: "cover" })
              .png()
              .toBuffer();

            const filename = `favicon.png`;
            finalFaviconUrl = await uploadToSpaces(
              compressedBuffer,
              filename,
              newSite.id,
              "image/png"
            );

            console.log(`Favicon uploaded successfully for site ${newSite.id}`);
          } catch (uploadError) {
            console.error(
              `Failed to upload favicon for site ${newSite.id}:`,
              uploadError
            );
            finalFaviconUrl = ""; // Reset to empty if upload fails
          }
        } else {
          // Upload favicon from file
          if (favicon) {
            console.log("Uploading favicon from file");
            try {
              const faviconBuffer = await favicon.arrayBuffer();
              const buffer = Buffer.from(faviconBuffer);
              let compressedBuffer = await sharp(buffer)
                .resize({ width: 32, height: 32, fit: "cover" })
                .png()
                .toBuffer();

              const filename = `favicon.png`;
              finalFaviconUrl = await uploadToSpaces(
                compressedBuffer,
                filename,
                newSite.id,
                "image/png"
              );
            } catch (uploadError) {
              console.error(
                `Failed to upload favicon for site ${newSite.id}:`,
                uploadError
              );
              finalFaviconUrl = ""; // Reset to empty if upload fails
            }
          }
        }

        // Store logo and favicon URLs in site meta
        await tx.siteMeta.upsert({
          where: {
            site_id_meta_key: {
              site_id: newSite.id,
              meta_key: "logo_url",
            },
          },
          update: {
            meta_value: finalLogoUrl || "",
          },
          create: {
            site_id: newSite.id,
            meta_key: "logo_url",
            meta_value: finalLogoUrl || "",
          },
        });

        await tx.siteMeta.upsert({
          where: {
            site_id_meta_key: {
              site_id: newSite.id,
              meta_key: "favicon_url",
            },
          },
          update: {
            meta_value: finalFaviconUrl || "",
          },
          create: {
            site_id: newSite.id,
            meta_key: "favicon_url",
            meta_value: finalFaviconUrl || "",
          },
        });

        return newSite;
      });

      // Log successful site creation
      console.log(
        `Site "${siteName}" (${domain}) created successfully with ID: ${site.id}`
      );

      return NextResponse.json({
        success: true,
        siteId: site.id,
        domain: domain,
        message: `Site "${siteName}" created successfully${
          process.env.APP_ENV === "production" ||
          process.env.APP_ENV === "staging"
            ? " and SSL certificate installed"
            : ""
        } for ${domain}`,
      });
    } catch (error) {
      console.error("Error creating site configuration:", error);

      // Comprehensive cleanup on failure
      await cleanupOnFailure(domain, zoneID, dnsID, isCloudflare);

      // Determine error type and provide appropriate response
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      return NextResponse.json(
        {
          error: {
            unexpected: `Failed to create site configuration for ${domain}. ${errorMessage}. Please try again or contact support if the issue persists.`,
          },
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in site creation process:", error);

    return NextResponse.json(
      {
        error: {
          unexpected: `An unexpected error occurred while creating the site. Please try again or contact support if the issue persists.`,
        },
      },
      { status: 500 }
    );
  }
}
