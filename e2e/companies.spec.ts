import { test, expect } from '@playwright/test';
import { mockApi, loginAs } from './fixtures';

test.describe('Companies', () => {
  test('lists companies with name, industry, and location', async ({ page }) => {
    await mockApi(page);
    await loginAs(page);

    await page.goto('/companies');

    await expect(page.getByText('Acme Inc')).toBeVisible();
    await expect(page.getByText('Technology')).toBeVisible();
    await expect(page.getByText('San Francisco, CA')).toBeVisible();
  });

  test('opens the company detail page when a row is clicked', async ({ page }) => {
    await mockApi(page);
    await loginAs(page);

    await page.goto('/companies');
    await page.getByText('Acme Inc').click();

    await expect(page).toHaveURL(/\/companies\/1$/);
    await expect(
      page.getByRole('heading', { name: 'Acme Inc' }),
    ).toBeVisible();
  });

  test('renders an empty state when there are no companies', async ({ page }) => {
    await mockApi(page, { companies: [] });
    await loginAs(page);

    await page.goto('/companies');
    await expect(page.getByText(/No companies/i)).toBeVisible();
  });

  test('shows company details with contact and deal sections', async ({ page }) => {
    await mockApi(page);
    await loginAs(page);

    await page.goto('/companies/1');

    await expect(
      page.getByRole('heading', { name: 'Acme Inc' }),
    ).toBeVisible();
    await expect(page.getByText('Technology')).toBeVisible();
    await expect(page.getByText('https://acme.test')).toBeVisible();
    await expect(page.getByText('555-9999')).toBeVisible();
  });
});
