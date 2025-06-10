import { NextRequest, NextResponse } from 'next/server';
import { minioClient, BUCKET_NAME, initializeBucket } from '@/lib/minio';
import { db } from '@/lib/db';
import { resumes } from '@/lib/db/schema';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    await initializeBucket();

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const isDefault = formData.get('isDefault') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only PDF and Word documents are allowed' }, { status: 400 });
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const minioPath = `resumes/${uniqueFileName}`;

    // Upload to MinIO
    const buffer = Buffer.from(await file.arrayBuffer());
    await minioClient.putObject(BUCKET_NAME, minioPath, buffer, file.size, {
      'Content-Type': file.type,
    });

    // If this is set as default, unset other defaults
    if (isDefault) {
      await db.update(resumes).set({ isDefault: false });
    }

    // Save to database
    const [savedResume] = await db.insert(resumes).values({
      name: name || file.name,
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      fileType: file.type,
      minioPath,
      isDefault,
    }).returning();

    return NextResponse.json({ 
      success: true, 
      resume: savedResume 
    });

  } catch (error) {
    console.error('Resume upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload resume' }, 
      { status: 500 }
    );
  }
}