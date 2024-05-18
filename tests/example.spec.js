// @ts-check
import { test, expect } from "@playwright/test";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupMockApis(context) {
  async function getMockResponse(filePath) {
    try {
      const data = await fs.readFile(filePath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading mock file: ${filePath}`, error);
      return null;
    }
  }

  async function handleRoute(route) {
    const url = new URL(route.request().url());
    const pathname = url.pathname;

    const mockFilePath = path.join(__dirname, "mocks", pathname + ".json");
    console.log(`Attempting to read mock file: ${mockFilePath}`); // Log the file path

    const mockResponse = await getMockResponse(mockFilePath);

    if (mockResponse) {
      console.log(`Mock response found for ${pathname}`); // Log if mock response is found
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockResponse),
      });
    } else {
      console.log(`No mock response found for ${pathname}`); // Log if no mock response is found
      route.continue();
    }
  }

  await context.route("**", handleRoute);
}

test.beforeEach(async ({ context }) => {
  await setupMockApis(context);
});

test("has title", async ({ page }) => {
  const data = await page.evaluate(async () => {
    const response = await fetch(
      "https://jsonplaceholder.typicode.com/todos/1"
    );
    const data = await response.json();
    return data;
  });

  expect(data.userId).toEqual(1);
});
