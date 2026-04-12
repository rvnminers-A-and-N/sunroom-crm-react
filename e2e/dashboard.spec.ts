import { test, expect } from '@playwright/test';
import { mockApi, loginAs } from './fixtures';

test.describe('Dashboard', () => {
  test('shows aggregated KPIs and recent activity', async ({ page }) => {
    await mockApi(page);
    await loginAs(page);

    await page.goto('/dashboard');

    // KPI counts from sampleDashboard
    await expect(page.getByText('12').first()).toBeVisible();
    await expect(page.getByText('5').first()).toBeVisible();
    await expect(page.getByText('7').first()).toBeVisible();

    // Recent activity entry
    await expect(page.getByText('Quarterly check-in')).toBeVisible();
  });
});
