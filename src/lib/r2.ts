import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

function required(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} in environment variables.`);
  }
  return value;
}

let cachedClient: S3Client | null = null;

export function buildImageProxyUrl(key: string) {
  const segments = key.split("/").filter(Boolean).map(encodeURIComponent);
  return `/api/image/${segments.join("/")}`;
}

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

export async function uploadToR2(params: {
  key: string;
  body: Buffer;
  contentType: string;
}) {
  const bucket = required("R2_BUCKET_NAME");

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
    }),
  );

  return buildImageProxyUrl(params.key);
}

export async function deleteFromR2(key: string) {
  const bucket = required("R2_BUCKET_NAME");

  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
}
