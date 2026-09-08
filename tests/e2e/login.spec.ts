import { expect, test } from "@playwright/test";

test("logs in and switches students", async ({ page, context }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel("Username").fill("synthetic-user");
  await page.getByLabel("Password").fill("synthetic-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Student One",
  );

  const sessionCookie = (await context.cookies()).find(
    (cookie) => cookie.name === "mykids_session",
  );
  expect(sessionCookie).toBeDefined();
  expect(sessionCookie?.httpOnly).toBe(true);
  expect(sessionCookie?.sameSite).toBe("Lax");

  await page.getByLabel("Select student").selectOption("student-two");
  await expect(page).toHaveURL(/\/dashboard\?student=student-two$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Student Two",
  );

  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Student Two",
  );
});

test("acknowledges a safe warning and shows read-only terms state", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Username").fill("synthetic-notice");
  await page.getByLabel("Password").fill("synthetic-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  const warning = page.getByRole("status");
  await expect(page).toHaveURL(/\/login$/);
  await expect(warning).toContainText("Synthetic notice: review this message.");
  await expect(warning.locator("b")).toHaveCount(0);
  await expect(page.getByLabel("Password")).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();

  await page.keyboard.press("Tab");
  const continueButton = page.getByRole("button", { name: "Continue" });
  await expect(continueButton).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Student One",
  );
  await expect(page.getByRole("status")).toContainText(
    "Okapi remains read-only until you accept the current terms in the official Kids&Us app.",
  );
  await page.setViewportSize({ width: 1280, height: 720 });
  await expect(page.getByRole("status")).toBeVisible();
});

test("renders normalized PascalCase attendance states", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Username").fill("synthetic-user");
  await page.getByLabel("Password").fill("synthetic-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/attendance");
  await expect(
    page.getByText("Synthetic recorded absence", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/2026-09-08.*Synthetic illness/)).toBeVisible();
  await expect(page.locator("body")).not.toContainText(
    "synthetic-browser-token",
  );
  await page.goto("/attendance?student=student-two");
  await expect(page.getByText("No absences recorded.")).toBeVisible();
  await expect(page.locator("body")).not.toContainText(
    "synthetic-browser-token",
  );
});
