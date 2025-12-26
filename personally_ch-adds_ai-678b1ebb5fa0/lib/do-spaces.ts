import {
	S3Client,
	PutObjectCommand,
	ObjectCannedACL,
	ListObjectsV2Command,
	DeleteObjectCommand
} from "@aws-sdk/client-s3";


const s3 = new S3Client({
	region: process.env.DO_SPACES_REGION,
	endpoint: process.env.DO_SPACES_ORIGIN_ENDPOINT,
	credentials: {
		accessKeyId: process.env.DO_SPACES_KEY!,
		secretAccessKey: process.env.DO_SPACES_SECRET!,
	},
});

export async function uploadToSpaces(
	body: Buffer<ArrayBufferLike>, 
	filename: string, 
	folder = "generated", 
	contentType: string
) {
	const uploadParams = {
		Bucket: process.env.DO_SPACES_BUCKET_NAME,
		Key: `${folder}/${filename}`,
		Body: body,
		ACL: ObjectCannedACL.public_read, // Make it publicly accessible
		ContentType: contentType,
	};

	await s3.send(new PutObjectCommand(uploadParams));

	return `${process.env.DO_SPACES_CDN_ENDPOINT}/${uploadParams.Key}`;
}

export async function deleteFilesFromSpaces(siteId: string) {
	const files = await s3.send(new ListObjectsV2Command({
		Bucket: process.env.DO_SPACES_BUCKET_NAME,
		Prefix: `${siteId}/`,
	}));

	for (const file of files.Contents || []) {
		await s3.send(new DeleteObjectCommand({
			Bucket: process.env.DO_SPACES_BUCKET_NAME,
			Key: file.Key,
		}));
	}
}