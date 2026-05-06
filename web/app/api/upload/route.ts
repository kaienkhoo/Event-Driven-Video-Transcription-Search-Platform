import { NextResponse } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { Pool } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from "@/app/generated/prisma/client";

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const bucket = process.env.AWS_BUCKET_NAME;

if (!accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be defined");
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error("DATABASE_URL must be defined in your .env file");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });


const s3Client = new S3Client({
    region: "ap-southeast-1",
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
});


export async function POST(request: Request) {
    try {
        const body = await request.json();
        const fileName = body.fileName || "unknown-video.mp4";
        const fileType = body.fileType || "video/mp4";

        const s3Key = `upload/${Date.now()}-${fileName.replace(/\s+/g, '-')}`;

        const newVideo = await prisma.video.create({
            data: {
                title: fileName,
                s3Key: s3Key,
                status: 'PROCESSING',
            }
        });

        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: s3Key,
            ContentType: fileType,
        });

        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

        return NextResponse.json({ uploadUrl: signedUrl, video: newVideo });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to generate URL" }, { status: 500 });
    }
}

export async function GET() {
    try {
        const allVideos = await prisma.video.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(allVideos);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch video" }, { status: 500 });
    }
}