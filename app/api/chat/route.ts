import { streamText } from 'ai';
import { google } from '@ai-sdk/google';

export const maxDuration = 30; // Vercel timeout configuration

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: google('gemini-1.5-flash'),
    system: "You are an expert technical recruiter and resume writer. Help the user tailor their full-stack engineering resume to specific job descriptions.",
    messages,
  });

  // @ts-ignore
  return result.toDataStreamResponse();
}