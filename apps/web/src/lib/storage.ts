/**
 * MinIO(S3 호환) 파일 스토리지 헬퍼.
 * docker-compose 의 minio 서비스 + .env 의 S3_* 변수 사용.
 *
 * ⚠️ dev 전제: 버킷을 public-read 로 설정해 저장된 전체 URL 로 바로 열람.
 *   운영에서는 private 버킷 + presigned GET 또는 인증 프록시 라우트로 전환 필요.
 */
import {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
} from "@aws-sdk/client-s3";

const ENDPOINT = process.env.S3_ENDPOINT ?? "http://localhost:9000";
const BUCKET = process.env.S3_BUCKET ?? "teamlet";
const ACCESS_KEY = process.env.S3_ACCESS_KEY ?? "minioadmin";
const SECRET_KEY = process.env.S3_SECRET_KEY ?? "minioadmin";

let _client: S3Client | null = null;
let _bucketReady = false;

function client(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: "us-east-1", // MinIO 무관 더미 region
      endpoint: ENDPOINT,
      forcePathStyle: true, // MinIO 는 path-style 필수
      credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
    });
  }
  return _client;
}

/** 버킷 존재 보장 + dev public-read 정책 (멱등). */
async function ensureBucket(): Promise<void> {
  if (_bucketReady) return;
  const c = client();
  try {
    await c.send(new HeadBucketCommand({ Bucket: BUCKET }));
  } catch {
    await c.send(new CreateBucketCommand({ Bucket: BUCKET }));
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${BUCKET}/*`],
        },
      ],
    };
    await c.send(
      new PutBucketPolicyCommand({ Bucket: BUCKET, Policy: JSON.stringify(policy) }),
    );
  }
  _bucketReady = true;
}

/** 파일명 안전화 — 경로·공백·특수문자 제거. */
export function sanitizeFilename(name: string): string {
  return name.replace(/[^\w.\-가-힣]/g, "_").slice(0, 120);
}

/**
 * 객체 업로드 후 공개 URL 반환.
 * @param key 버킷 내 객체 키 (예: "company-documents/{companyId}/{uuid}-{name}")
 */
export async function uploadObject(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<string> {
  await ensureBucket();
  await client().send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return `${ENDPOINT}/${BUCKET}/${key}`;
}
