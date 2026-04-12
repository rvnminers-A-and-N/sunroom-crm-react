import { test, expect } from '@playwright/test';
import { mockApi, loginAs, sampleContacts } from './fixtures';

test.describe('Contacts', () => {
  test('lists contacts with their email and company', async ({ page }) => {
    await mockApi(page);
    await loginAs(page);

    await page.goto('/contacts');

    await expect(page.getByText('Jane Doe')).toBeVisible();
    await expect(page.getByText('jane@acme.test').first()).toBeVisible();
    await expect(page.getByText('John Smith')).toBeVisible();
  });

  test('opens the contact detail page when a row is clicked', async ({ page }) => {
    await mockApi(page);
    await loginAs(page);

    await page.goto('/contacts');
    await page.getByText('Jane Doe').click();

    await expect(page).toHaveURL(/\/contacts\/1$/);
    await expect(
      page.getByRole('heading', { name: /Jane Doe/ }),
    ).toBeVisible();
  });

  test('renders an empty state when there are no contacts', async ({ page }) => {
    await mockApi(page, { contacts: [] });
    await loginAs(page);

    await page.goto('/contacts');
    await expect(page.getByText(/No contacts/i)).toBeVisible();
  });

  test('filters contacts via the search input', async ({ page }) => {
    // Track the query the client sends to the API
    let lastQuery: string | null = null;
    await mockApi(page);
    await page.route('**/api/contacts*', async (route) => {
      const fullUrl = route.request().url();
      const u = new URL(fullUrl);
      lastQuery = u.searchParams.get('search');
      // Return only Jane when searching for "jane"
      const filtered = lastQuery
        ? sampleContacts.filter((c) =>
            `${c.firstName} ${c.lastName}`
              .toLowerCase()
              .includes(lastQuery!.toLowerCase()),
          )
        : sampleContacts;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: filtered,
          meta: {
            currentPage: 1,
            perPage: 20,
            total: filtered.length,
            lastPage: 1,
          },
        }),
      });
    });

    await loginAs(page);
    await page.goto('/contacts');

    await expect(page.getByText('Jane Doe')).toBeVisible();
    await expect(page.getByText('John Smith')).toBeVisible();

    await page.getByPlaceholder(/Search/i).fill('jane');

    await expect(page.getByText('John Smith')).toBeHidden();
    await expect(page.getByText('Jane Doe')).toBeVisible();
    expect(lastQuery).toBe('jane');
  });
});
