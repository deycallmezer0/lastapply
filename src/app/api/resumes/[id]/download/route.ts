import { NextRequest, NextResponse } from 'next/server';
import { minioClient, BUCKET_NAME } from '@/lib/minio';
import { db } from '@/lib/db';
import { resumes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resumeId = parseInt(params.id);
    
    // Get resume info from database
    const [resume] = await db
      .select()
      .from(resumes)
      .where(eq(resumes.id, resumeId));

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    // Get file from MinIO
    const stream = await minioClient.getObject(BUCKET_NAME, resume.minioPath);
    
    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Return file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': resume.fileType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${resume.fileName}"`,
      },
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to download resume' }, 
      { status: 500 }
    );
  }
}