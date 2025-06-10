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
    responsibilities?: string[];
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
        console.error('❌ OPENAI_ASSISTANT_ID not configured');
        throw new Error('OPENAI_ASSISTANT_ID not configured');
      }
  
      console.log('🚀 Starting AI job info generation...');
      console.log('📝 Input data:', { jobTitle, company, location, requirementsLength: requirements.length });
  
      // Create Thread
      const thread = await openai.beta.threads.create();
      console.log('🧵 Thread created:', thread.id);
  
      // Add Message
      const message = await openai.beta.threads.messages.create(
        thread.id,
        {
          role: "user",
          content: `Job Title: ${jobTitle}\nCompany: ${company}\nLocation: ${location}\nRequirements: ${requirements}${user ? `\nUser: ${user}` : ''}`,
        }
      );
      console.log('💬 Message created:', message.id);
  
      // Get Response
      const run = await openai.beta.threads.runs.createAndPoll(
        thread.id,
        {
          assistant_id: assistantId,
        }
      );
  
      console.log('🏃 Run status:', run.status);
  
      if (run.status === 'completed') {
        const messages = await openai.beta.threads.messages.list(thread.id);
        const aiResponse = messages.data[0].content[0];
        
        if (aiResponse.type === 'text') {
          const responseText = aiResponse.text.value;
          console.log('🤖 Full AI response:', responseText);
          
          // Extract the JSON part from the AI response
          const start = responseText.indexOf("{");
          const end = responseText.lastIndexOf("}") + 1;
          
          if (start === -1 || end === 0) {
            console.error('❌ No JSON found in AI response');
            console.error('Response text:', responseText);
            return null;
          }
          
          const jsonData = responseText.substring(start, end);
          console.log('📄 Extracted JSON:', jsonData);
          
          try {
            const refinedJobInfo = JSON.parse(jsonData) as JobInfo;
            console.log('✅ Successfully parsed job info:', refinedJobInfo);
            return refinedJobInfo;
          } catch (parseError) {
            console.error('❌ Failed to parse JSON:', parseError);
            console.error('Raw JSON data:', jsonData);
            return null;
          }
        } else {
          console.error('❌ AI response is not text type:', aiResponse.type);
        }
      } else {
        console.error('❌ OpenAI run failed with status:', run.status);
        if (run.last_error) {
          console.error('Last error:', run.last_error);
        }
        return null;
      }
  
      return null;
    } catch (error) {
      console.error('❌ Error in generateJobInfo:', error);
      return null;
    }
  }