import { expect, test } from "@playwright/test";

test("registers an eligible absence once and refreshes attendance", async ({
  page,
  request,
}) => {
  await request.post("http://127.0.0.1:4100/reset");
  await page.goto("/login");
  await page.getByLabel("Username").fill("synthetic-user");
  await page.getByLabel("Password").fill("synthetic-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/attendance");
  const reviewButton = page.getByRole("button", { name: "Review absence" });
  await expect(reviewButton).toBeDisabled();
  await page
    .getByLabel("Class or date")
    .selectOption({ label: "2026-09-10 at 17:30" });
  await page.getByLabel("Reason").selectOption("Synthetic illness");
  await expect(reviewButton).toBeEnabled();
  await reviewButton.click();

  const review = page.getByRole("heading", { name: "Review absence" });
  const reviewPanel = review.locator("..");
  await expect(review).toBeVisible();
  await expect(
    reviewPanel.getByText("Student One", { exact: true }),
  ).toBeVisible();
  await expect(
    reviewPanel.getByText("2026-09-10 at 17:30", { exact: true }),
  ).toBeVisible();
  await expect(
    reviewPanel.getByText("Synthetic illness", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText(
    "synthetic-browser-token",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("button", { name: "Register absence" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByLabel("Class or date")).toHaveValue("follow-up-one");
  await expect(page.getByLabel("Reason")).toHaveValue("Synthetic illness");
  await page.getByRole("button", { name: "Review absence" }).click();

  const registerButton = page.getByRole("button", { name: "Register absence" });
  const disabledWhilePending = await registerButton.evaluate(
    async (button: HTMLButtonElement) => {
      button.click();
      await new Promise(requestAnimationFrame);
      const disabled = button.disabled;
      button.click();
      return disabled;
    },
  );
  expect(disabledWhilePending).toBe(true);

  await expect(page.getByText("Absence registered.")).toBeVisible();
  await expect(
    page.getByText("Registered synthetic absence", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Class or date")).toHaveCount(0);
  await expect(
    page.getByText(
      "No sessions are currently available for absence registration.",
    ),
  ).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 720 });
  await expect(page.getByText("Absence registered.")).toBeVisible();
});
