import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ResumeBuilder from "../app/resume/page";

const { mockUseChat } = vi.hoisted(() => ({ mockUseChat: vi.fn() }));

vi.mock("@ai-sdk/react", () => ({ useChat: mockUseChat }));

const sendMessage = vi.fn();
const stop = vi.fn();
const regenerate = vi.fn();

function setChatState(overrides: Record<string, unknown> = {}) {
  mockUseChat.mockReturnValue({
    messages: [],
    sendMessage,
    status: "ready",
    stop,
    error: undefined,
    regenerate,
    ...overrides,
  });
}

describe("ResumeBuilder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setChatState();
  });

  it("renders onboarding and sends a starter prompt", async () => {
    const user = userEvent.setup();
    render(<ResumeBuilder />);

    expect(
      screen.getByRole("heading", { name: "Resume Tailoring Engine" }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", {
        name: /High-Fit Role: Full Stack React & Node\.js Developer/,
      }),
    );

    expect(sendMessage).toHaveBeenCalledWith({
      text: "Evaluate my profile for a Full Stack Developer role requiring React.js, Node.js, Express, MongoDB, REST APIs, and AWS Docker.",
    });
  });

  it("validates input and clears it after submitting", async () => {
    const user = userEvent.setup();
    render(<ResumeBuilder />);
    const input = screen.getByPlaceholderText(
      "Paste a job description or type 'Yes, generate the application package'...",
    );
    const sendButton = screen.getByRole("button", { name: "Send" });

    expect(sendButton).toBeDisabled();
    await user.type(input, "   ");
    expect(sendButton).toBeDisabled();
    await user.clear(input);
    await user.type(input, "Frontend engineer with React experience");
    expect(sendButton).toBeEnabled();
    await user.click(sendButton);

    expect(sendMessage).toHaveBeenCalledWith({
      text: "Frontend engineer with React experience",
    });
    expect(input).toHaveValue("");
  });

  it("shows the streaming state and stops generation", async () => {
    const user = userEvent.setup();
    setChatState({ status: "streaming" });
    render(<ResumeBuilder />);

    expect(screen.getByText("Streaming...")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Stop" }));
    expect(stop).toHaveBeenCalledOnce();
  });

  it("renders user and assistant messages with the profile-read badge", () => {
    setChatState({
      messages: [
        {
          id: "user-1",
          role: "user",
          parts: [{ type: "text", text: "My job description" }],
        },
        {
          id: "assistant-1",
          role: "assistant",
          parts: [
            { type: "text", text: "I reviewed your profile." },
            {
              type: "tool-readMasterProfile",
              state: "output-available",
              output: { success: true, fileName: "master_profile.md" },
            },
          ],
        },
      ],
    });
    render(<ResumeBuilder />);

    expect(screen.getByText("My job description")).toBeInTheDocument();
    expect(screen.getByText("I reviewed your profile.")).toBeInTheDocument();
    expect(screen.getByText("Master profile read")).toBeInTheDocument();
  });

  it("renders the scoreResume pending state", () => {
    setChatState({
      messages: [
        {
          id: "assistant-1",
          role: "assistant",
          parts: [
            {
              type: "tool-scoreResume",
              state: "input-available",
              input: { score: 0, missingKeywords: [], actionPlan: "" },
            },
          ],
        },
      ],
    });
    render(<ResumeBuilder />);

    expect(
      screen.getByText("Executing resume evaluation model..."),
    ).toBeInTheDocument();
  });

  it("renders a completed scoreResume scorecard", () => {
    setChatState({
      messages: [
        {
          id: "assistant-1",
          role: "assistant",
          parts: [
            {
              type: "tool-scoreResume",
              state: "output-available",
              output: {
                score: 84,
                matchedProjects: ["BIIT Connect"],
                missingKeywords: ["AWS"],
                actionPlan: "Highlight deployment experience.",
              },
            },
          ],
        },
      ],
    });
    render(<ResumeBuilder />);

    expect(screen.getByText("84/100 Fit")).toBeInTheDocument();
    expect(screen.getByText("BIIT Connect")).toBeInTheDocument();
    expect(screen.getByText("AWS")).toBeInTheDocument();
    expect(
      screen.getByText("Highlight deployment experience."),
    ).toBeInTheDocument();
  });

  it("shows an error banner and retries generation", async () => {
    const user = userEvent.setup();
    setChatState({ error: new Error("Connection lost") });
    render(<ResumeBuilder />);

    expect(screen.getByText("Connection Interrupted")).toBeInTheDocument();
    expect(screen.getByText(/Connection lost/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry Generation" }));
    expect(regenerate).toHaveBeenCalledOnce();
  });
});