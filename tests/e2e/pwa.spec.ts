import { test, expect } from "@playwright/test";

// ── 1. Public PWA assets (unauthenticated) ──────────────────────────

test.describe("PWA public assets", () => {
  // Override project-level storageState to run without authentication
  test.use({ storageState: { cookies: [], origins: [] } });

  test("manifest.webmanifest returns valid PWA manifest", async ({ page }) => {
    const resp = await page.request.get("/manifest.webmanifest");
    expect(resp.status()).toBe(200);
    const manifest = await resp.json();
    expect(manifest.name).toBe("재고관리");
    expect(manifest.short_name).toBe("재고관리");
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/");
    expect(manifest.lang).toBe("ko");
    expect(manifest.theme_color).toBe("#0f172a");
    expect(manifest.background_color).toBe("#f8fafc");
    expect(manifest.icons).toBeDefined();
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);

    // Check for 192 and 512 icons with any maskable purpose
    const icon192 = manifest.icons.find((i: any) => i.sizes === "192x192");
    const icon512 = manifest.icons.find((i: any) => i.sizes === "512x512");
    expect(icon192).toBeDefined();
    expect(icon512).toBeDefined();
  });

  test("PWA icon files are accessible", async ({ page }) => {
    for (const path of [
      "/icons/icon-192x192.png",
      "/icons/icon-512x512.png",
      "/apple-touch-icon.png",
    ]) {
      const resp = await page.request.get(path);
      expect(resp.status()).toBe(200);
      expect(resp.headers()["content-type"]).toContain("image/png");
    }
  });

  test("offline page is publicly accessible", async ({ page }) => {
    const resp = await page.request.get("/~offline");
    expect(resp.status()).toBe(200);

    // Navigate to verify Korean content
    await page.goto("/~offline");
    await expect(page.getByText("오프라인 상태입니다")).toBeVisible();
  });

  test("service worker file is publicly accessible", async ({ page }) => {
    const resp = await page.request.get("/sw.js");
    expect(resp.status()).toBe(200);
  });
});

// ── 2. Authenticated service worker registration ───────────────────

test.describe("PWA service worker", () => {
  test("service worker registers and activates", async ({ page }) => {
    await page.goto("/products");

    // Wait for SW to be ready and extract scope directly
    const scope = await page.waitForFunction(
      () =>
        navigator.serviceWorker.ready.then((reg) => {
          // Return a plain object so jsonValue() serializes correctly
          return { scope: reg.scope, active: !!reg.active };
        }),
      undefined,
      { timeout: 15000 },
    );
    const result = await scope.jsonValue();

    // Verify scope is root
    expect(result.scope).toBe("http://localhost:3000/");
    expect(result.active).toBe(true);
  });
});

// ── 3. Offline fallback ─────────────────────────────────────────────

test.describe("PWA offline behavior", () => {
  async function waitForSwControl(page: import("@playwright/test").Page) {
    await page.waitForFunction(
      () => navigator.serviceWorker.ready.then(() => true),
      undefined,
      { timeout: 15000 },
    );
    await page.waitForFunction(
      () => navigator.serviceWorker.controller !== null,
      undefined,
      { timeout: 10000 },
    );
  }

  test("offline page is precached by service worker", async ({ page }) => {
    await page.goto("/products");
    await waitForSwControl(page);

    // Verify the offline page is in the SW precache
    const hasOfflineInCache = await page.evaluate(async () => {
      const keys = await caches.keys();
      const precacheCache = keys.find((k) => k.includes("precache"));
      if (!precacheCache) return false;
      const cache = await caches.open(precacheCache);
      const requests = await cache.keys();
      return requests.some((r) => r.url.includes("/~offline"));
    });
    expect(hasOfflineInCache).toBe(true);
  });

  test("sw.js sets fallback config for document requests", async ({ page }) => {
    const resp = await page.request.get("/sw.js");
    expect(resp.status()).toBe(200);
    const swContent = await resp.text();

    // The SW source defines a fallback for document navigation to /~offline
    expect(swContent).toContain("fallbacks");
    expect(swContent).toContain("/~offline");
    expect(swContent).toContain("document");
  });

  test("API requests fail offline without stale cache", async ({
    page,
    context,
  }) => {
    await page.goto("/products");
    await waitForSwControl(page);

    // Confirm SW controls the page
    expect(
      await page.evaluate(() => navigator.serviceWorker.controller !== null),
    ).toBe(true);

    // Fetch products API while online to confirm it works
    const onlineResp = await page.evaluate(() =>
      fetch("/api/products?limit=1").then((r) => r.status),
    );
    expect(onlineResp).toBe(200);

    // Go offline and wait for propagation to SW network stack
    await context.setOffline(true);
    await page.waitForTimeout(1000);

    // Retry a few times — offline propagation can lag on some chromium builds
    const offlineResult = await page.evaluate(async () => {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const resp = await fetch("/api/products?limit=1");
          if (!resp.ok) {
            return { ok: resp.ok, status: resp.status };
          }
        } catch {
          return { ok: false, status: 0, error: true };
        }
        await new Promise((r) => setTimeout(r, 500));
      }
      // Last attempt: accept whatever happens, but expect NetworkOnly to fail
      try {
        const resp = await fetch("/api/products?limit=1");
        return { ok: resp.ok, status: resp.status };
      } catch {
        return { ok: false, status: 0, error: true };
      }
    });

    // NetworkOnly should fail when offline — no stale cache fallback
    expect(offlineResult.ok).toBeFalsy();

    await context.setOffline(false);
  });
});
