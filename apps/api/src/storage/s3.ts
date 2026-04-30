import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config.js';
import { randomUUID } from 'node:crypto';

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (_client) return _client;
  _client = new S3Client({
    endpoint: config.s3.endpoint,
    region: config.s3.region,
    credentials: { accessKeyId: config.s3.accessKey, secretAccessKey: config.s3.secretKey },
    forcePathStyle: config.s3.forcePathStyle,
  });
  return _client;
}

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  mimeType: string;
}

export async function uploadBuffer(
  tenantId: string | null,
  entityType: string,
  filename: string,
  mimeType: string,
  buffer: Buffer,
): Promise<UploadResult> {
  const client = getClient();
  const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
  const key = `${tenantId ?? 'public'}/${entityType}/${randomUUID()}-${cleanName}`;
  await client.send(
    new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    }),
  );
  // Para MinIO local con anonymous read habilitado en init, devolvemos URL directa
  const publicBase = config.s3.endpoint.replace(/\/$/, '');
  const url = `${publicBase}/${config.s3.bucket}/${key}`;
  return { key, url, size: buffer.length, mimeType };
}

export async function getDownloadUrl(key: string, expiresInSec = 3600): Promise<string> {
  const client = getClient();
  return getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: config.s3.bucket, Key: key }),
    { expiresIn: expiresInSec },
  );
}

export async function deleteObject(key: string): Promise<void> {
  const client = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: config.s3.bucket, Key: key }));
}
