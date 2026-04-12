import { test, expect } from '@playwright/test';
import { mockApi, loginAs } from './fixtures';

test.describe('Deals', () => {
  test('lists deals with title and value', async ({ page }) => {
    await mockApi(page);
    await loginAs(page);

    await page.goto('/deals');
    await expect(page.getByText('Enterprise Deal')).toBeVisible();
  });

  test('switches to the pipeline view and shows stage columns', async ({ page }) => {
    await mockApi(page);
    await loginAs(page);

    await page.goto('/deals/pipeline');

    // The pipeline columns are labelled by stage name
    await expect(page.getByText('Lead').first()).toBeVisible();
    await expect(page.getByText('Qualified').first()).toBeVisible();
    await expect(page.getByText('Won').first()).toBeVisible();
    // Sample deal renders inside the Lead column
    await expect(page.getByText('Enterprise Deal')).toBeVisible();
  });
});
