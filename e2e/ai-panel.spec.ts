import { test, expect } from '@playwright/test';
import { mockApi, loginAs } from './fixtures';

test.describe('AI Panel', () => {
  test('runs an AI search and renders the interpretation and result counts', async ({
    page,
  }) => {
    await mockApi(page);
    await loginAs(page);

    await page.goto('/ai');
    await expect(page.getByRole('heading', { name: 'AI Assistant' })).toBeVisible();

    await page
      .getByPlaceholder(/Who did I talk to/)
      .fill('Find recent VIP contacts');
    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page.getByText('Found matching results')).toBeVisible();
    await expect(page.getByText(/Contacts \(2\)/)).toBeVisible();
    await expect(page.getByText(/Activities \(1\)/)).toBeVisible();
  });

  test('summarizes pasted text and shows the resulting card', async ({ page }) => {
    await mockApi(page);
    await loginAs(page);

    await page.goto('/ai');
    await page.getByRole('tab', { name: /Summarize/ }).click();
    await page
      .getByPlaceholder(/Paste your meeting notes/)
      .fill('Long meeting transcript that needs to be summarized.');
    await page.getByRole('button', { name: 'Summarize' }).click();

    await expect(page.getByText('Concise summary of the input.')).toBeVisible();
  });
});
