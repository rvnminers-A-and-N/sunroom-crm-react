import { test, expect } from '@playwright/test';
import { mockApi, loginAs, adminUser, regularUser } from './fixtures';

test.describe('Navigation', () => {
  test('navigates between the main sections via the sidebar', async ({ page }) => {
    await mockApi(page);
    await loginAs(page);
    await page.goto('/dashboard');

    // Scope clicks to the sidebar nav to avoid ambiguity with
    // dashboard stat card links that share the same href.
    const sidebar = page.locator('aside');

    await sidebar.getByRole('link', { name: 'Contacts' }).click();
    await expect(page).toHaveURL(/\/contacts$/);
    await expect(
      page.getByRole('heading', { name: 'Contacts' }),
    ).toBeVisible();

    await sidebar.getByRole('link', { name: 'Companies' }).click();
    await expect(page).toHaveURL(/\/companies$/);
    await expect(
      page.getByRole('heading', { name: 'Companies' }),
    ).toBeVisible();

    await sidebar.getByRole('link', { name: 'Deals', exact: true }).click();
    await expect(page).toHaveURL(/\/deals$/);

    await sidebar.getByRole('link', { name: 'Activities' }).click();
    await expect(page).toHaveURL(/\/activities$/);

    await sidebar.getByRole('link', { name: 'AI Assistant' }).click();
    await expect(page).toHaveURL(/\/ai$/);
    await expect(page.getByText('AI Assistant')).toBeVisible();

    await sidebar.getByRole('link', { name: 'Settings' }).click();
    await expect(page).toHaveURL(/\/settings$/);
  });

  test('shows the admin Users link for admin users', async ({ page }) => {
    await mockApi(page);
    await loginAs(page, adminUser);
    await page.goto('/dashboard');

    const usersLink = page.getByRole('link', { name: 'Users' });
    await expect(usersLink).toBeVisible();
    await usersLink.click();
    await expect(page).toHaveURL(/\/admin$/);
  });

  test('hides the admin Users link for regular users', async ({ page }) => {
    await mockApi(page, { meResponse: { status: 200, body: regularUser } });
    await loginAs(page, regularUser);
    await page.goto('/dashboard');

    await expect(page.getByRole('link', { name: 'Users' })).toHaveCount(0);
  });

  test('redirects regular users away from /admin to /dashboard', async ({ page }) => {
    await mockApi(page, { meResponse: { status: 200, body: regularUser } });
    await loginAs(page, regularUser);

    await page.goto('/admin');
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('redirects unknown routes to /', async ({ page }) => {
    await mockApi(page);
    await loginAs(page);

    await page.goto('/this-route-does-not-exist');
    // / redirects to /dashboard for authed users
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
