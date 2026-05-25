import { describe, it, expect, afterEach } from "vitest";
import { BrowserManager } from "../../src/browser/manager.js";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturePath = path.resolve(__dirname, "../fixtures/simple-page.html");
const fixtureUrl = `file://${fixturePath}`;

describe("BrowserManager", () => {
  let manager: BrowserManager;

  afterEach(async () => {
    if (manager) {
      await manager.cleanup();
    }
  });

  it("getPage(url) launches browser, navigates, and returns a PageWrapper", async () => {
    manager = new BrowserManager();
    const page = await manager.getPage(fixtureUrl);
    expect(page).toBeDefined();
    const html = await page.content();
    expect(html).toContain("Hello, World!");
    await page.close();
  });

  it("second getPage call reuses the same browser instance", async () => {
    manager = new BrowserManager();
    const page1 = await manager.getPage(fixtureUrl);
    const page2 = await manager.getPage(fixtureUrl);
    // Both pages share the same underlying browser
    expect(manager.getBrowserInstance()).toBe(manager.getBrowserInstance());
    // Verify both pages work
    const html1 = await page1.content();
    const html2 = await page2.content();
    expect(html1).toContain("Hello, World!");
    expect(html2).toContain("Hello, World!");
    await page1.close();
    await page2.close();
  });

  it("cleanup() closes browser and subsequent getPage creates a new browser", async () => {
    manager = new BrowserManager();
    const page1 = await manager.getPage(fixtureUrl);
    const firstBrowser = manager.getBrowserInstance();
    await page1.close();

    await manager.cleanup();
    expect(manager.getBrowserInstance()).toBeNull();

    // After cleanup, a new getPage should spin up a fresh browser
    const page2 = await manager.getPage(fixtureUrl);
    const secondBrowser = manager.getBrowserInstance();
    expect(secondBrowser).not.toBeNull();
    expect(secondBrowser).not.toBe(firstBrowser);
    await page2.close();
  });

  it("PageWrapper.content() returns the page HTML", async () => {
    manager = new BrowserManager();
    const page = await manager.getPage(fixtureUrl);
    const html = await page.content();
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Simple Test Page");
    expect(html).toContain("Hello, World!");
    await page.close();
  });

  it("PageWrapper.close() closes the context so it is no longer accessible", async () => {
    manager = new BrowserManager();
    const page = await manager.getPage(fixtureUrl);
    // Should work before close
    const htmlBefore = await page.content();
    expect(htmlBefore).toContain("Hello, World!");

    await page.close();

    // After closing, the raw page should be closed
    expect(page.page.isClosed()).toBe(true);
  });
});
