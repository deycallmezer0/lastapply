import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface JobInfo {
  title: string;
  company: string;
  location: string;
  salary: string;
  requirements: string;
  description?: string;
  benefits?: string;
  experience_level?: string;
  employment_type?: string;
  skills?: string[];
}

export async function generateJobInfo(
  jobTitle: string,
  company: string,
  location: string,
  requirements: string,
  user?: string
): Promise<JobInfo | null> {
  try {
    const assistantId = process.env.OPENAI_ASSISTANT_ID;
    
    if (!assistantId) {
      throw new Error('OPENAI_ASSISTANT_ID not configured');
    }

    console.log('Generating job info for:', { jobTitle, company, location });

    // Create Thread
    const thread = await openai.beta.threads.create();

    // Add Message
    const message = await openai.beta.threads.messages.create(
      thread.id,
      {
        role: "user",
        content: `Job Title: ${jobTitle}\nCompany: ${company}\nLocation: ${location}\nRequirements: ${requirements}${user ? `\nUser: ${user}` : ''}`,
      }
    );

    console.log('Message created:', message.id);

    // Get Response
    const run = await openai.beta.threads.runs.createAndPoll(
      thread.id,
      {
        assistant_id: assistantId,
      }
    );

    if (run.status === 'completed') {
      const messages = await openai.beta.threads.messages.list(thread.id);
      const aiResponse = messages.data[0].content[0];
      
      if (aiResponse.type === 'text') {
        const responseText = aiResponse.text.value;
        
        // Extract the JSON part from the AI response
        const start = responseText.indexOf("{");
        const end = responseText.lastIndexOf("}") + 1;
        
        if (start === -1 || end === 0) {
          console.error('No JSON found in AI response:', responseText);
          return null;
        }
        
        const jsonData = responseText.substring(start, end);
        
        try {
          // Convert the JSON string to a dictionary
          const refinedJobInfo = JSON.parse(jsonData) as JobInfo;
          console.log('Refined job info:', refinedJobInfo);
          return refinedJobInfo;
        } catch (parseError) {
          console.error('Failed to parse JSON from AI response:', parseError);
          console.error('JSON data:', jsonData);
          return null;
        }
      }
    } else {
      console.error('OpenAI run failed with status:', run.status);
      return null;
    }

    return null;
  } catch (error) {
    console.error('Error generating job info:', error);
    return null;
  }
}

// Alternative simpler approach using chat completions (if you don't want to use assistants)
export async function generateJobInfoSimple(
  jobTitle: string,
  company: string,
  location: string,
  requirements: string
): Promise<JobInfo | null> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a job information processor. Given raw job posting data, clean and structure it into a proper JSON format. Return only valid JSON with these fields:
          {
            "title": "cleaned job title",
            "company": "company name",
            "location": "location",
            "salary": "salary range or 'Not specified'",
            "requirements": "cleaned and formatted requirements",
            "description": "job description if available",
            "benefits": "benefits if mentioned",
            "experience_level": "entry/mid/senior level",
            "employment_type": "full-time/part-time/contract",
            "skills": ["array", "of", "key", "skills"]
          }`
        },
        {
          role: "user",
          content: `Job Title: ${jobTitle}\nCompany: ${company}\nLocation: ${location}\nRequirements: ${requirements}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const response = completion.choices[0].message.content;
    if (!response) return null;

    // Try to extract JSON from the response
    const start = response.indexOf("{");
    const end = response.lastIndexOf("}") + 1;
    
    if (start === -1 || end === 0) {
      console.error('No JSON found in completion response:', response);
      return null;
    }
    
    const jsonData = response.substring(start, end);
    
    try {
      const jobInfo = JSON.parse(jsonData) as JobInfo;
      return jobInfo;
    } catch (parseError) {
      console.error('Failed to parse JSON from completion:', parseError);
      return null;
    }
  } catch (error) {
    console.error('Error with OpenAI completion:', error);
    return null;
  }
}