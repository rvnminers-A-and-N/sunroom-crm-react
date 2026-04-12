import { test, expect } from '@playwright/test';
import { mockApi, loginAs, adminUser } from './fixtures';

test.describe('Authentication', () => {
  test('redirects unauthenticated users from / to /auth/login', async ({ page }) => {
    await mockApi(page);
    await page.goto('/');
    await expect(page).toHaveURL(/\/auth\/login$/);
    await expect(
      page.getByRole('heading', { name: /Welcome back/ }),
    ).toBeVisible();
  });

  test('logs in successfully and lands on the dashboard', async ({ page }) => {
    await mockApi(page);
    await page.goto('/auth/login');

    await page.getByLabel('Email').fill('admin@example.com');
    await page.getByLabel('Password').fill('correct-horse');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('shows an error message when login fails', async ({ page }) => {
    // Use 400 (not 401) so the global axios interceptor does not
    // hard-redirect to /auth/login and wipe React state.
    await mockApi(page, {
      loginResponse: {
        status: 400,
        body: { message: 'Invalid credentials' },
      },
    });

    await page.goto('/auth/login');
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByText('Invalid credentials')).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/login$/);
  });

  test('shows client-side validation when fields are empty', async ({ page }) => {
    await mockApi(page);
    await page.goto('/auth/login');

    // Click Sign In without filling anything. Since the inputs lack the
    // HTML5 "required" attribute, native validation does not fire and
    // the Zod resolver returns errors.
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('navigates to the register page from the login page', async ({ page }) => {
    await mockApi(page);
    await page.goto('/auth/login');

    await page.getByRole('link', { name: 'Register' }).click();
    await expect(page).toHaveURL(/\/auth\/register$/);
    await expect(
      page.getByRole('heading', { name: /Create an account|Sign up/i }),
    ).toBeVisible();
  });

  test('logs out and returns to the login page', async ({ page }) => {
    await mockApi(page);
    await loginAs(page, adminUser);

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard$/);

    // The sidebar exposes a Logout button via title attribute.
    await page.getByTitle('Logout').first().click();

    await expect(page).toHaveURL(/\/auth\/login$/);
  });
});
