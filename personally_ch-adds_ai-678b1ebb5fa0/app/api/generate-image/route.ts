import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import dummyImage from '../../assets/images/dummy/dummy-article.webp';
import { uploadToSpaces } from '@/lib/do-spaces';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * @swagger
 * /api/generate-image:
 *   post:
 *     summary: Generate image using AI
 *     description: Generate an image using OpenAI DALL-E based on a text prompt
 *     tags:
 *       - Utilities
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title or prompt for image generation
 *                 example: "A beautiful sunset over mountains"
 *     responses:
 *       200:
 *         description: Image generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 imageUrl:
 *                   type: string
 *                   description: URL of the generated image
 *                   example: "https://cdn.example.com/images/generated-image.png"
 *       400:
 *         description: Missing title parameter
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
export async function POST(req: NextRequest) {
	try {
		const { title } = await req.json();

		// Dev fallback to dummy/generated
		if (process.env.APP_ENV !== 'production' && process.env.APP_ENV !== 'staging') {
			const generatedDir = path.join(process.cwd(), 'public', 'generated');
			const files = await fs.readdir(generatedDir);
			const imageFiles = files.filter(f => /\.(webp|png|jpg|jpeg)$/i.test(f));
			if (imageFiles.length > 0) {
				const randomFile = imageFiles[Math.floor(Math.random() * imageFiles.length)];
				return NextResponse.json({ imageUrl: `${process.env.API_URL}/generated/${randomFile}`, imagePrompt: "Using dummy image from generated directory." }, { status: 200 });
			}
			return NextResponse.json({ imageUrl: dummyImage.src, imagePrompt: "No image files found in generated directory." }, { status: 200 });
		}

		const imagePrompt = await generateSafePromptFromTitle(title);
		console.log(`Using safe regenerated prompt: ${imagePrompt}`);
		let imageUrl = await tryGenerateImage(imagePrompt);

		// If it failed → regenerate a safe prompt
		if (!imageUrl) {
			try {
				const safePrompt = await generateSafePromptFromTitle(title);
				console.log(`Using safe regenerated prompt: ${safePrompt}`);
				imageUrl = await tryGenerateImage(safePrompt);
			} catch (error) {
				console.warn(`Safe fallback prompt failed. Returning dummy image.`);
				return NextResponse.json({ imageUrl: dummyImage.src, imagePrompt: "Safe fallback prompt failed. Returning dummy image." }, { status: 200 });
			}
		}

		return NextResponse.json({ imageUrl, imagePrompt }, { status: 200 });
	} catch (error) {
		console.error('Error generating image:', error);
		return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
	}
}

async function tryGenerateImage(prompt: string): Promise<string> {
	const imageResponse = await openai.images.generate({
		model: "dall-e-3",
		prompt,
		n: 1,
		size: '1792x1024',
		quality: "hd",
		style: "natural"
	});

	const remoteUrl = imageResponse.data?.[0]?.url;
	if (!remoteUrl) throw new Error("No image URL returned from OpenAI");

	const res = await fetch(remoteUrl);
	const arrayBuffer = await res.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);

	const slug = prompt.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 50);
	const filename = `${slug}-${uuidv4().slice(0, 8)}.webp`;

	let quality = 90;
	let compressedBuffer = await sharp(buffer)
		.resize({ width: 1024, height: 1024, fit: 'cover' })
		.webp({ quality })
		.toBuffer();

	while (compressedBuffer.length > 1024 * 1024 && quality > 50) {
		quality -= 10;
		compressedBuffer = await sharp(buffer)
			.resize({ width: 1024, height: 1024, fit: 'cover' })
			.webp({ quality })
			.toBuffer();
	}

	const imageUrl = await uploadToSpaces(compressedBuffer, filename, "generated", "image/webp");
	return imageUrl;
}

async function generateSafePromptFromTitle(title: string): Promise<string> {
	const systemPrompt = `You are a creative visual designer. Generate a vivid, family-friendly, content-policy-compliant image prompt for an AI image generator.
It should NOT contain people, faces, brands, violence, politics, drugs, or any controversial topics. Focus on abstract, nature, objects, or concept art.`;
	
	const userPrompt = `Create a safe image prompt for the article title: "${title}"`;

	const completion = await openai.chat.completions.create({
		model: "gpt-4o-mini",
		messages: [
			{ role: "system", content: systemPrompt },
			{ role: "user", content: userPrompt }                                                                                                                    
		],
		temperature: 0.7
	});

	const response = completion.choices?.[0]?.message?.content?.trim();
	if (!response) throw new Error("No prompt returned from OpenAI");

	return response;
}
