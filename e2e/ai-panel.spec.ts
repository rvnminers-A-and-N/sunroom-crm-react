import { test, expect } from '@playwright/test';
import { mockApi, loginAs } from './fixtures';

test.describe('AI Panel', () => {
  test('runs a smart search and streams the result', async ({ page }) => {
    await mockApi(page);
    await loginAs(page);

    await page.goto('/ai');
    await expect(page.getByRole('heading', { name: 'AI Assistant' })).toBeVisible();

    await page
      .getByPlaceholder(/Who did I talk to/)
      .fill('Find recent VIP contacts');
    await page.getByRole('button', { name: 'Search' }).click();

    // The streamed tokens accumulate into a single text block
    await expect(
      page.getByText('Based on your query, I found 2 relevant contacts who match your criteria.'),
    ).toBeVisible();
  });

  test('summarizes pasted text and streams the result', async ({ page }) => {
    await mockApi(page);
    await loginAs(page);

    await page.goto('/ai');
    await page.getByRole('tab', { name: /Summarize/ }).click();
    await page
      .getByPlaceholder(/Paste your meeting notes/)
      .fill('Long meeting transcript that needs to be summarized.');
    await page.getByRole('button', { name: 'Summarize' }).click();

    await expect(
      page.getByText('Here is a concise summary of the provided text.'),
    ).toBeVisible();
  });

  test('generates deal insights via streaming', async ({ page }) => {
    await mockApi(page);
    await loginAs(page);

    await page.goto('/ai');
    await page.getByRole('tab', { name: /Deal Insights/ }).click();
    await page.getByPlaceholder(/Enter deal ID/).fill('1');
    await page.getByRole('button', { name: 'Generate Insights' }).click();

    await expect(
      page.getByText('This deal shows strong potential with a high likelihood of closing.'),
    ).toBeVisible();
  });
});
