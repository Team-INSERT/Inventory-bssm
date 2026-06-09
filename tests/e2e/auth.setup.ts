import { test as setup, expect } from "@playwright/test"

const authFile = ".omo/evidence/.auth/admin.json"

setup("authenticate as admin", async ({ page }) => {
  await page.goto("/login")

  // Switch to admin login tab
  await page.getByRole("button", { name: "관리자 로그인" }).click()

  // Fill in admin credentials
  await page.getByPlaceholder("admin@example.com").fill("admin@example.com")
  await page.getByPlaceholder("비밀번호").fill("admin123")

  // Submit the login form
  await page.getByRole("button", { name: /^로그인$/ }).click()

  // Wait for redirect to dashboard
  await page.waitForURL("/")
  await page.waitForLoadState("networkidle")
  // Verify we're on the dashboard by checking for the main content area
  await expect(page.locator("main")).toBeVisible({ timeout: 10000 })

  // Save authenticated state
  await page.context().storageState({ path: authFile })
})
