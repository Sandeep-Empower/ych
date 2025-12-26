import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from 'fs/promises';

/**
 * @swagger
 * /api/generate-logo-ai:
 *   post:
 *     summary: Generate logo using AI
 *     description: Generate a professional logo using Hugging Face AI models
 *     tags:
 *       - Utilities
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: Brand name or text for the logo
 *                 example: "Acme Corp"
 *               slogan:
 *                 type: string
 *                 description: Optional slogan to include
 *                 example: "Quality Products"
 *               color:
 *                 type: string
 *                 description: Preferred color scheme
 *                 example: "blue"
 *               style:
 *                 type: string
 *                 description: Logo style
 *                 default: "vintage"
 *                 example: "modern"
 *               generateFavicon:
 *                 type: boolean
 *                 description: Whether to also generate a favicon
 *                 default: false
 *                 example: false
 *     responses:
 *       200:
 *         description: Logo generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 logoUrl:
 *                   type: string
 *                   description: URL of the generated logo
 *                   example: "https://example.com/logo.png"
 *                 prompt:
 *                   type: string
 *                   description: The prompt used for generation
 *                   example: "Professional logo for Acme Corp"
 *                 faviconUrl:
 *                   type: string
 *                   description: URL of the generated favicon (if requested)
 *                   example: "https://example.com/favicon.png"
 *       400:
 *         description: Missing required text parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error or API key not configured
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(req: NextRequest) {
  try {
    const {
      text,
      slogan,
      color,
      style = "vintage",
      generateFavicon = false,
    } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    if(process.env.APP_ENV !== "production" && process.env.APP_ENV !== "staging") {
      const generatedDir = path.join(process.cwd(), 'public', 'dummy', 'logos');
			const files = await fs.readdir(generatedDir);
			const imageFiles = files.filter(f => /\.(webp|png|jpg|jpeg)$/i.test(f));
			if (imageFiles.length > 0) {
				const randomFile = imageFiles[Math.floor(Math.random() * imageFiles.length)];
				return NextResponse.json({ 
          success: true,
          logoUrl: `${process.env.API_URL}/dummy/logos/${randomFile}`, 
          prompt: "Using dummy image from generated directory.",
        }, { status: 200 });
			}
      return NextResponse.json({
        success: true,
        logoUrl: "https://placehold.co/600x200",
        prompt: "Using placeholder image from placeold.co.",
      });
    }

    if (!process.env.HUGGINGFACE_API_KEY) {
      return NextResponse.json(
        { error: "Hugging Face API key not configured" },
        { status: 500 }
      );
    }

    // Create the exact prompt you specified
    const cleanText = text.replace(/\.(com|net|org|co)$/i, "");

    const prompt = `Create a professional website header logo for the brand "${cleanText}", removing any domain extension like .com or .net. The logo must be strictly horizontal, with a clean, sharp icon on the left and the full brand name "${cleanText}" (in one word) on the right.

    Requirements:
    - Icon must use only the color ${color} (no gradients or color substitutions).
    - Background must be a flat, pure solid white (RGB(255,255,255)); absolutely no gradients, textures, shadows, borders, or effects.
    - Typography must be bold, modern, and highly legible with a retro-minimal style.
    - Do not include any taglines, slogans, domain extensions (.com, .net, etc.), or extra text.
    - The icon is always required and must be clearly aligned, visually polished, and left of the brand name.
    - Layout must be centered and balanced with clear separation between icon and brand name.
    - The final image must be exactly 600 X 200 pixels, export as PNG.
    - Strictly no noise, artifacts, missing letters, background tone variations, visual glitches, or layout issues.

    Negative prompt: no domain extensions, no orange (unless specified), no gradients, no effects, no taglines, no missing letters, no background noise, no artifacts, no layout glitches, no garbled text.

    Follow these requirements exactly.`;

    // Call Hugging Face router API with your exact body format
    const response = await fetch(
      "https://router.huggingface.co/nebius/v1/images/generations",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          prompt: prompt,
          // response_format: "base64",
          model: "black-forest-labs/flux-dev",
          width: 600,
          height: 200,
          // quality: "high",
          //num_images: 1,
          output_format: "png",
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Hugging Face API error:", response.status, errorText);
      return NextResponse.json(
        {
          error: `Hugging Face API error: ${response.status}`,
          details: errorText,
        },
        { status: 500 }
      );
    }

    const responseData = await response.json();

    // Handle the response and upload to DigitalOcean Spaces
    if (
      responseData &&
      responseData.data &&
      responseData.data[0] &&
      responseData.data[0].url
    ) {
      const logoUrl = responseData.data[0].url;

      return NextResponse.json({
        success: true,
        logoUrl,
        prompt: prompt,
      });
    } else {
      console.error("❌ Unexpected response format:", responseData);
      return NextResponse.json(
        {
          error: "Unexpected response format from Hugging Face API",
          responseData: responseData,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ Logo generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate logo",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
