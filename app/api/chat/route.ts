import { streamText, tool } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: google('gemini-1.5-flash'),
    system: "You are an expert technical recruiter and resume writer. When a user asks to evaluate a resume against a job description, or asks for feedback on their skills, always use the scoreResume tool.",
    messages,
    tools: {
      scoreResume: tool({
        description: 'Evaluate a resume against a job description and return a structured analysis.',
        parameters: z.object({
          score: z.number().describe('Match score from 0 to 100'),
          missingKeywords: z.array(z.string()).describe('Keywords in the job description missing from the resume'),
          actionPlan: z.string().describe('One concrete step to improve the resume match'),
        }),
        execute: async (args) => {
          // Simulate an external backend process (e.g., PDF parsing) to ensure loading states are visible
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Simulate an error state if the LLM hallucinates a negative score
          if (args.score < 0) {
            throw new Error("Invalid score calculation.");
          }
          
          return { success: true, ...args };
        },
      }),
    },
  });

  // @ts-ignore
  return result.toDataStreamResponse();
}