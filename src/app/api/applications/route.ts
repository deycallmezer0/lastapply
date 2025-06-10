import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { applications } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const allApplications = await db
      .select()
      .from(applications)
      .orderBy(desc(applications.createdAt));

    return NextResponse.json({ applications: allApplications });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' }, 
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const [savedApplication] = await db.insert(applications).values({
      title: body.title,
      company: body.company,
      location: body.location,
      salary: body.salary,
      requirements: body.requirements,
      url: body.url,
      status: body.status || 'applied',
      notes: body.notes,
    }).returning();

    return NextResponse.json({ 
      success: true, 
      application: savedApplication 
    });

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to save application' }, 
      { status: 500 }
    );
  }
}