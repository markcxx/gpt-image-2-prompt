import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

function required(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} in environment variables.`);
  }
  return value;
}

let cachedClient: S3Client | null = null;

function getR2Client() {
  if (cachedClient) {
    return cachedClient;
  }
  cachedClient = new S3Client({
    region: "auto",
    endpoint: required("R2_ENDPOINT"),
    credentials: {
      accessKeyId: required("R2_ACCESS_KEY_ID"),
      secretAccessKey: required("R2_SECRET_ACCESS_KEY"),
    },
  });
  return cachedClient;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ key: string[] }> },
) {
  const { key } = await context.params;
  const objectKey = key.map(decodeURIComponent).join("/");
  if (!objectKey) {
    return NextResponse.json({ message: "缺少图片 key" }, { status: 400 });
  }

  const bucket = required("R2_BUCKET_NAME");
  const object = await getR2Client()
    .send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: objectKey,
      }),
    )
    .catch(() => null);

  if (!object) {
    return NextResponse.json({ message: "图片不存在" }, { status: 404 });
  }

  if (!object.Body) {
    return NextResponse.json({ message: "图片不存在" }, { status: 404 });
  }

  return new NextResponse(object.Body.transformToWebStream(), {
    headers: {
      "Content-Type": object.ContentType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
