import { google } from "@ai-sdk/google";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";

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

  const { messages } = (await req.json()) as { messages: UIMessage[] };

  // Extract latest user text for sabotage testing
  const lastMsg = messages[messages.length - 1];
  const lastText =
    lastMsg?.parts
      .flatMap((part) => (part.type === "text" ? [part.text] : []))
      .join(" ") || "";

  // Failure State 1 Trigger: Mid-stream / API Error
  if (lastText.includes("SABOTAGE_STREAM")) {
    return Response.json(
      { error: "Simulated 429 Too Many Requests: Model overloaded." },
      { status: 429 },
    );
  }

  const modelMessages = await convertToModelMessages(messages);
  let profileContent: string;
  try {
    const filePath = path.join(process.cwd(), "data", "master_profile.md");
    profileContent = await fs.readFile(filePath, "utf8");
  } catch {
    profileContent =
      "Zohaib Munir — BSCS (BIIT, 3.27 CGPA). Web Dev Intern at Mercurial Minds. Stack: JS, React, Next.js, React Native, Node.js, Express, MongoDB, SQL Server, Socket.io, Tailwind CSS. Projects: BIIT Connect (React Native, Socket.io, SQL Server), Full-Stack Expense Tracker (React, Node, MongoDB), User & Task Management System.";
  }

  const result = streamText({
    model: google("gemini-3.8-flash"),
    maxRetries: 0,
    maxOutputTokens: 1200,
    providerOptions: {
      google: {
        thinkingConfig: { thinkingLevel: "low" },
      },
    },
    stopWhen: stepCountIs(2),
    system: `You are the Personal Career & Resume Tailoring Agent for Zohaib Munir.
When a user asks to evaluate a job description or score their fit:
1. Call 'scoreResume' to score the match based strictly on the verified master profile below.
2. Explain which of his real projects fit best, and ask for confirmation before calling 'draftApplicationPackage'.
3. ONLY call 'draftApplicationPackage' after the user confirms they want the tailored bullets and cover letter.
Never invent skills not found in the profile; place missing skills in missingKeywords.

Verified master profile:
${profileContent}`,
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
          matchedProjects: z
            .array(z.string())
            .optional()
            .describe("Names of Zohaib's real projects matching this role"),
          missingKeywords: z
            .array(z.string())
            .describe("Keywords in the job description missing from the resume"),
          actionPlan: z
            .string()
            .describe("One concrete step to improve the resume match"),
        }),
        execute: async (input) => {
          await new Promise((resolve) => setTimeout(resolve, 1200));

          // Failure State 2 Trigger: Tool Error UI
          if (lastText.includes("SABOTAGE_TOOL") || input.score < 0) {
            return {
              error: true,
              message: "Failed to parse resume keywords against target schema.",
            };
          }

          return { success: true, ...input };
        },
      }),

      draftApplicationPackage: tool({
        description:
          "Generate tailored resume bullets and a concise cover letter ONLY after user confirmation.",
        inputSchema: z.object({
          companyOrRole: z.string().describe("Target role or company title"),
          tailoredBullets: z
            .array(z.string())
            .describe("3-4 rewritten resume bullets grounded in Zohaib's real projects"),
          coverLetter: z
            .string()
            .describe("Concise cover letter under 250 words"),
        }),
        execute: async (input) => {
          await new Promise((resolve) => setTimeout(resolve, 1200));
          const markdownContent = `# Application Package: ${input.companyOrRole}\n\n## Tailored Resume Bullets\n${input.tailoredBullets
            .map((b) => `- ${b}`)
            .join("\n")}\n\n## Tailored Cover Letter\n${input.coverLetter}\n`;

          return {
            success: true,
            fileName: `${input.companyOrRole
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")}-package.md`,
            markdownContent,
            ...input,
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse({
    onError: (error) => {
      const message = error instanceof Error ? error.message : String(error);
      if (/429|quota|rate limit/i.test(message)) {
        return "Gemini API quota reached. Wait briefly before retrying, or check your Google AI Studio quota and billing.";
      }
      return "The generative model failed to complete the response. Check the server logs for details.";
    },
  });
}