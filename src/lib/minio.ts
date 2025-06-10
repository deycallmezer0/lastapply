import { Client } from 'minio';

const minioClient = new Client({
  endPoint: 'localhost',
  port: 9000,
  useSSL: false,
  accessKey: 'lastapply',
  secretKey: 'lastapply123',
});

const BUCKET_NAME = 'resumes';

// Initialize bucket if it doesn't exist
export async function initializeBucket() {
  try {
    const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
    if (!bucketExists) {
      await minioClient.makeBucket(BUCKET_NAME);
      console.log(`Bucket ${BUCKET_NAME} created successfully`);
    }
  } catch (error) {
    console.error('Error initializing MinIO bucket:', error);
  }
}

export { minioClient, BUCKET_NAME };