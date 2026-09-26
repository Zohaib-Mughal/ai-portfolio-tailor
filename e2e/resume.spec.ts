import { expect, test } from "@playwright/test";

test("submits a job description without calling the real API", async ({ page }) => {
  await page.route("**/api/chat", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: "",
    });
  });

  await page.goto("/resume");

  await expect(
    page.getByRole("heading", { name: "Resume Tailoring Engine" }),
  ).toBeVisible();
  const sendButton = page.getByRole("button", { name: "Send" });
  await expect(sendButton).toBeDisabled();

  const jobDescription = "Frontend engineer with React experience";
  await page
    .getByPlaceholder(
      "Paste a job description or type 'Yes, generate the application package'...",
    )
    .fill(jobDescription);
  await sendButton.click();

  await expect(page.getByText(jobDescription)).toBeVisible();
});