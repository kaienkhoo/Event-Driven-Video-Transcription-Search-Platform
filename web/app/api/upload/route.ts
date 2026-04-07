import { NextResponse } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const bucket = process.env.AWS_BUCKET_NAME;

if (!accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be defined");
}

const s3Client = new S3Client({
    region: "ap-southeast-1",
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
});

async function getUploadUrl(fileName: string, fileType: string) {
    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: `upload/${Date.now()}-${fileName}`,
        ContentType: fileType,
    });

    return await getSignedUrl(s3Client, command, { expiresIn: 60 })
}

export async function GET() {
    try {
        const signedUrl = await getUploadUrl("test.mp4", "video.mp4");

        return NextResponse.json({ uploadUrl: signedUrl })
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to generate URL" }, { status: 500 })
    }
}