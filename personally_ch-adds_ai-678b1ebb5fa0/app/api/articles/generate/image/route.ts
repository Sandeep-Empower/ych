import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import dummyImage from '../../../../assets/images/dummy/dummy-article.webp';
import { uploadToSpaces } from '@/lib/do-spaces';
import { prisma } from '@/lib/prisma';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
	try {
		const { imagePrompt, title, niche, articleId } = await req.json();
		let safePrompt = imagePrompt;

		if (!title) {
			return NextResponse.json({ error: 'title are required' }, { status: 400 });
		}

		// Dev fallback to dummy/generated
		if (process.env.APP_ENV !== 'production' && process.env.APP_ENV !== 'staging') {
			const generatedDir = path.join(process.cwd(), 'public', 'generated');
			const files = await fs.readdir(generatedDir);
			const imageFiles = files.filter(f => /\.(webp|png|jpg|jpeg)$/i.test(f));
			if (imageFiles.length > 0) {
				const randomFile = imageFiles[Math.floor(Math.random() * imageFiles.length)];
				return NextResponse.json({ imageUrl: `${process.env.API_URL}/generated/${randomFile}`, prompt: "Using dummy image from generated directory." }, { status: 200 });
			}
			return NextResponse.json({ imageUrl: dummyImage.src, prompt: "No image files found in generated directory." }, { status: 200 });
		}

		if (!imagePrompt || imagePrompt === '') {
			safePrompt = await generateSafePromptFromTitle(title);
		}

		// Try original prompt
		let imageUrl: string | null = null;
		try {
			imageUrl = await tryGenerateImage(safePrompt);
		} catch (error) {
			console.warn(`🛑 Original imagePrompt failed: "${safePrompt}"`);
		}

		// If it failed → regenerate a safe prompt
		if (!imageUrl) {
			try {
				const safePrompt = await generateSafePromptFromTitle(title);
				console.log(`Using safe regenerated prompt: ${safePrompt}`);
				imageUrl = await tryGenerateImage(safePrompt);
			} catch (error) {
				console.warn(`Safe fallback prompt failed. Returning dummy image.`);
				return NextResponse.json({ imageUrl: dummyImage.src, prompt: "Safe fallback prompt failed. Returning dummy image." }, { status: 200 });
			}
		}

		// If articleId is provided, update the article in the database
		if (articleId && imageUrl) {
			try {
				await prisma.article.update({
					where: { id: articleId },
					data: { image_url: imageUrl }
				});
			} catch (dbError) {
				console.error('Error updating article image in database:', dbError);
				// Don't fail the whole request if DB update fails, just log it
			}
		}

		return NextResponse.json({ imageUrl, prompt: safePrompt }, { status: 200 });
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
		model: "gpt-4-turbo-preview",
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
