import { google } from "@ai-sdk/google";
import { convertToModelMessages, streamText, tool } from "ai";
import { z } from "zod";

export const maxDuration = 30;

export async function POST(req: Request) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return Response.json(
      {
        error:
          "Missing GOOGLE_GENERATIVE_AI_API_KEY. Add it to .env.local and restart the development server.",
      },
      { status: 500 },
    );
  }

  const { messages } = await req.json();
  const modelMessages = await convertToModelMessages(messages);

  const result = await streamText({
    model: google("gemini-3.8-flash"),
    maxOutputTokens: 800,
    providerOptions: {
      google: {
        thinkingConfig: { thinkingLevel: "low" },
      },
    },
    system:
      "You are an expert technical recruiter and resume writer. When a user asks to evaluate a resume against a job description, or asks for feedback on their skills, always use the scoreResume tool. Base the score on evidence in the user's message, keep missingKeywords specific and useful, and make actionPlan concise but actionable.",
    messages: modelMessages,
    tools: {
      scoreResume: tool({
        description:
          "Evaluate a resume against a job description and return a structured analysis.",
        inputSchema: z.object({
          score: z
            .number()
            .min(0)
            .max(100)
            .describe("Match score from 0 to 100"),
          missingKeywords: z
            .array(z.string())
            .describe("Keywords in the job description missing from the resume"),
          actionPlan: z
            .string()
            .describe("One concrete step to improve the resume match"),
        }),
        execute: async (input) => {
          return { success: true, ...input };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}