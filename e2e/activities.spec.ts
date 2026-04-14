import { test, expect } from '@playwright/test';
import { mockApi, loginAs, sampleActivities } from './fixtures';

test.describe('Activities', () => {
  test('lists activities with type, subject, and contact name', async ({ page }) => {
    await mockApi(page);
    await loginAs(page);

    await page.goto('/activities');

    await expect(page.getByText('Quarterly check-in')).toBeVisible();
    await expect(page.getByText('Jane Doe').first()).toBeVisible();
  });

  test('renders an empty state when there are no activities', async ({ page }) => {
    await mockApi(page, { activities: [] });
    await loginAs(page);

    await page.goto('/activities');
    await expect(page.getByText(/No activities/i)).toBeVisible();
  });

  test('filters activities by type using the dropdown', async ({ page }) => {
    await mockApi(page);

    // Override the activities route to respect the type query param
    await page.route('**/api/activities*', async (route) => {
      const url = new URL(route.request().url());
      const type = url.searchParams.get('type');
      const filtered = type
        ? sampleActivities.filter((a) => a.type === type)
        : sampleActivities;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: filtered,
          meta: { currentPage: 1, perPage: 20, total: filtered.length, lastPage: 1 },
        }),
      });
    });

    await loginAs(page);
    await page.goto('/activities');
    await expect(page.getByText('Quarterly check-in')).toBeVisible();

    // Select "Email" — our sample activity is a "Call" so it should disappear
    const filter = page.getByRole('combobox');
    await filter.click();
    await page.getByRole('option', { name: 'Email' }).click();

    await expect(page.getByText('Quarterly check-in')).toBeHidden();
  });
});
