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
