import {
  type APIRequestContext,
  expect,
  type Page,
  test,
} from "@playwright/test";

const upstreamUrl = "http://127.0.0.1:4100";

async function reset(request: APIRequestContext) {
  await request.post(`${upstreamUrl}/reset`);
}

async function login(page: Page, username = "synthetic-user") {
  await page.goto("/login");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill("synthetic-password");
  await page.getByRole("button", { name: "Sign in" }).click();
}

test.describe("Attendance visual regression @visual", () => {
  test.beforeEach(async ({ request }) => {
    await reset(request);
  });

  test("warning and terms-pending states", async ({ page }) => {
    await login(page, "synthetic-notice");
    await expect(page.getByRole("status")).toContainText(
      "Synthetic notice: review this message.",
    );
    await expect(page).toHaveScreenshot("login-warning-desktop.png", {
      fullPage: true,
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page).toHaveScreenshot("login-warning-mobile.png", {
      fullPage: true,
    });
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page).toHaveScreenshot("terms-banner-mobile.png", {
      fullPage: true,
    });

    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page).toHaveScreenshot("terms-banner-desktop.png", {
      fullPage: true,
    });
  });

  test("populated and empty attendance states", async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/attendance");
    await expect(
      page.getByText("Synthetic recorded absence", { exact: true }),
    ).toBeVisible();
    await expect(page).toHaveScreenshot("attendance-populated.png", {
      fullPage: true,
    });

    await page.goto("/attendance?student=student-two");
    await expect(page.getByText("No absences recorded.")).toBeVisible();
    await expect(page).toHaveScreenshot("attendance-empty.png", {
      fullPage: true,
    });
  });

  test("review and successful registration states", async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/attendance");
    await page
      .getByLabel("Class or date")
      .selectOption({ label: "2026-09-10 at 17:30" });
    await page.getByLabel("Reason").selectOption("Synthetic illness");
    await page.getByRole("button", { name: "Review absence" }).click();
    await expect(page).toHaveScreenshot("absence-review-desktop.png", {
      fullPage: true,
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page).toHaveScreenshot("absence-review-mobile.png", {
      fullPage: true,
    });
    await page.getByRole("button", { name: "Register absence" }).click();
    await expect(page.getByText("Absence registered.")).toBeVisible();
    await expect(page).toHaveScreenshot("absence-success-mobile.png", {
      fullPage: true,
    });

    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page).toHaveScreenshot("absence-success-desktop.png", {
      fullPage: true,
    });
  });
});
