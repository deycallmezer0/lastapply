import { NextRequest, NextResponse } from 'next/server';
import { JSDOM } from 'jsdom';
import { db } from '@/lib/db';
import { applications } from '@/lib/db/schema';
import { generateJobInfo, JobInfo } from '@/lib/openai';

interface ScrapedData {
  title: string;
  company: string;
  location: string;
  salary: string;
  requirements: string;
}

export async function POST(req: NextRequest) {
  try {
    const { url, save } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // If save is true, we're saving a previously scraped job
    if (save) {
      // For now, we'll just return success since we don't have the job data
      // In a real implementation, you'd store the job data temporarily
      return NextResponse.json({ success: true });
    }

    console.log('Scraping URL:', url);

    // Fetch the page content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`);
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Extract job information from LinkedIn
    const scrapedData = extractLinkedInJobInfo(document);
    
    if (!scrapedData.title || !scrapedData.company) {
      return NextResponse.json({ 
        error: 'Could not extract job information from this page' 
      }, { status: 400 });
    }

    console.log('Scraped data:', scrapedData);

    // Use OpenAI to refine the job information
    let refinedJobInfo: JobInfo | null = null;
    
    try {
      // Try using the assistant first
      refinedJobInfo = await generateJobInfo(
        scrapedData.title,
        scrapedData.company,
        scrapedData.location,
        scrapedData.requirements
      );

     
    } catch (aiError) {
      console.error('AI processing failed:', aiError);
      // Fall back to scraped data if AI fails
    }

    // Use AI-refined data if available, otherwise use scraped data
    const finalJobInfo = refinedJobInfo ? {
      title: refinedJobInfo.title || scrapedData.title,
      company: refinedJobInfo.company || scrapedData.company,
      location: refinedJobInfo.location || scrapedData.location,
      pay: refinedJobInfo.salary || scrapedData.salary,
      requirements: refinedJobInfo.requirements || scrapedData.requirements,
      description: refinedJobInfo.description,
      benefits: refinedJobInfo.benefits,
      experience_level: refinedJobInfo.experience_level,
      employment_type: refinedJobInfo.employment_type,
      skills: refinedJobInfo.skills,
    } : {
      title: scrapedData.title,
      company: scrapedData.company,
      location: scrapedData.location,
      pay: scrapedData.salary,
      requirements: scrapedData.requirements,
    };

    // If this is a save request, save to database
    if (save) {
      await db.insert(applications).values({
        title: finalJobInfo.title,
        company: finalJobInfo.company,
        location: finalJobInfo.location,
        salary: finalJobInfo.pay,
        requirements: finalJobInfo.requirements,
        url: url,
        status: 'applied',
        notes: finalJobInfo.benefits ? `Benefits: ${finalJobInfo.benefits}` : undefined,
      });
    }

    return NextResponse.json({ 
      jobInfo: finalJobInfo,
      aiEnhanced: !!refinedJobInfo 
    });

  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json(
      { error: 'Failed to scrape job information' }, 
      { status: 500 }
    );
  }
}

function extractLinkedInJobInfo(document: Document): ScrapedData {
  const selectors = {
    title: [
      'h1[data-test-id="job-title"]',
      '.job-details-jobs-unified-top-card__job-title',
      '.top-card-layout__title',
      'h1.t-24',
      'h1'
    ],
    company: [
      'a[data-test-id="job-details-company-link"]',
      '.job-details-jobs-unified-top-card__company-name',
      '.top-card-layout__card .top-card-layout__second-subline',
      '.jobs-unified-top-card__company-name',
      '.job-details-jobs-unified-top-card__primary-description-container a'
    ],
    location: [
      '[data-test-id="job-details-location"]',
      '.job-details-jobs-unified-top-card__bullet',
      '.top-card-layout__card .top-card-layout__second-subline',
      '.jobs-unified-top-card__bullet'
    ],
    salary: [
      '[data-test-id="job-salary-info"]',
      '.job-details-jobs-unified-top-card__job-insight',
      '.jobs-unified-top-card__job-insight'
    ],
    requirements: [
      '[data-test-id="job-details-description"]',
      '.job-details-jobs-unified-top-card__job-description',
      '.jobs-description__container',
      '.show-more-less-html__markup',
      '#job-details'
    ]
  };

  const extractText = (selectors: string[]): string => {
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const text = element.textContent?.trim();
        if (text && text.length > 0) {
          return text;
        }
      }
    }
    return '';
  };

  const title = extractText(selectors.title);
  const company = extractText(selectors.company);
  const location = extractText(selectors.location);
  const salary = extractText(selectors.salary) || 'Not specified';
  const requirements = extractText(selectors.requirements);

  return {
    title,
    company,
    location,
    salary,
    requirements: requirements.length > 5000 ? requirements.substring(0, 5000) + '...' : requirements
  };
}