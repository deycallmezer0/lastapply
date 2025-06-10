import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { resumes } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const allResumes = await db
      .select()
      .from(resumes)
      .orderBy(desc(resumes.isDefault), desc(resumes.createdAt));

    return NextResponse.json({ resumes: allResumes });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resumes' }, 
      { status: 500 }
    );
  }
}