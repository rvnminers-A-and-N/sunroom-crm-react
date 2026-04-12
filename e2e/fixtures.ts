import type { Page, Route } from '@playwright/test';

/**
 * E2E test fixtures and helpers.
 *
 * The tests run against the real Vite dev server but intercept all
 * `/api/**` requests via `page.route()` so they are deterministic and
 * never need a backend running.
 */

export const API_BASE = '**/api';

// ----- Default mock entities -----

export const adminUser = {
  id: 99,
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'Admin',
  avatarUrl: null,
  createdAt: '2024-01-01T00:00:00Z',
};

export const regularUser = {
  id: 1,
  name: 'Regular User',
  email: 'user@example.com',
  role: 'User',
  avatarUrl: null,
  createdAt: '2024-02-01T00:00:00Z',
};

export const sampleContacts = [
  {
    id: 1,
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@acme.test',
    phone: '555-1111',
    title: 'CEO',
    companyName: 'Acme Inc',
    companyId: 1,
    lastContactedAt: '2024-06-01T00:00:00Z',
    tags: [],
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    firstName: 'John',
    lastName: 'Smith',
    email: 'john@globex.test',
    phone: '555-2222',
    title: 'CTO',
    companyName: 'Globex',
    companyId: 2,
    lastContactedAt: '2024-06-02T00:00:00Z',
    tags: [],
    createdAt: '2024-01-02T00:00:00Z',
  },
];

export const sampleCompanies = [
  {
    id: 1,
    name: 'Acme Inc',
    industry: 'Technology',
    website: 'https://acme.test',
    phone: '555-9999',
    city: 'San Francisco',
    state: 'CA',
    contactCount: 3,
    dealCount: 2,
    createdAt: '2024-01-01T00:00:00Z',
  },
];

export const sampleDeals = [
  {
    id: 1,
    title: 'Enterprise Deal',
    value: 50000,
    stage: 'Lead',
    contactName: 'Jane Doe',
    contactId: 1,
    companyName: 'Acme Inc',
    companyId: 1,
    expectedCloseDate: '2024-12-31',
    closedAt: null,
    createdAt: '2024-01-01T00:00:00Z',
  },
];

export const samplePipeline = {
  stages: [
    { stage: 'Lead', count: 1, totalValue: 50000, deals: [sampleDeals[0]] },
    { stage: 'Qualified', count: 0, totalValue: 0, deals: [] },
    { stage: 'Proposal', count: 0, totalValue: 0, deals: [] },
    { stage: 'Negotiation', count: 0, totalValue: 0, deals: [] },
    { stage: 'Won', count: 0, totalValue: 0, deals: [] },
    { stage: 'Lost', count: 0, totalValue: 0, deals: [] },
  ],
};

export const sampleActivities = [
  {
    id: 1,
    type: 'Call',
    subject: 'Quarterly check-in',
    body: 'Discussed expansion plans',
    aiSummary: null,
    contactId: 1,
    contactName: 'Jane Doe',
    dealId: null,
    dealTitle: null,
    userName: 'Admin User',
    occurredAt: '2024-06-01T10:00:00Z',
    createdAt: '2024-06-01T10:00:00Z',
  },
];

export const sampleDashboard = {
  totalContacts: 12,
  totalCompanies: 5,
  totalDeals: 7,
  totalPipelineValue: 250000,
  wonRevenue: 100000,
  dealsByStage: [
    { stage: 'Lead', count: 3, totalValue: 30000 },
    { stage: 'Qualified', count: 2, totalValue: 20000 },
    { stage: 'Won', count: 1, totalValue: 10000 },
  ],
  recentActivities: [
    {
      id: 1,
      type: 'Call',
      subject: 'Quarterly check-in',
      contactName: 'Jane Doe',
      userName: 'Admin User',
      occurredAt: '2024-06-01T10:00:00Z',
    },
  ],
};

// ----- Route helpers -----

interface ApiOverrides {
  loginResponse?: { status: number; body: unknown };
  registerResponse?: { status: number; body: unknown };
  meResponse?: { status: number; body: unknown };
  contacts?: typeof sampleContacts;
  companies?: typeof sampleCompanies;
  deals?: typeof sampleDeals;
  pipeline?: typeof samplePipeline;
  activities?: typeof sampleActivities;
  dashboard?: typeof sampleDashboard;
  users?: typeof regularUser[];
  tags?: { id: number; name: string; color: string; createdAt: string }[];
}

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

/**
 * Sets up route interception for ALL backend endpoints used by the SPA.
 * Call this once per test, before any navigation.
 */
export async function mockApi(page: Page, overrides: ApiOverrides = {}) {
  const contacts = overrides.contacts ?? sampleContacts;
  const companies = overrides.companies ?? sampleCompanies;
  const deals = overrides.deals ?? sampleDeals;
  const pipeline = overrides.pipeline ?? samplePipeline;
  const activities = overrides.activities ?? sampleActivities;
  const dashboard = overrides.dashboard ?? sampleDashboard;
  const users = overrides.users ?? [adminUser];
  const tags = overrides.tags ?? [];

  await page.route(`${API_BASE}/**`, async (route) => {
    const req = route.request();
    const fullUrl = req.url();
    const path = fullUrl.split('/api')[1]?.split('?')[0] ?? '';
    const method = req.method();

    // ----- Auth -----
    if (path === '/auth/login' && method === 'POST') {
      if (overrides.loginResponse) {
        return json(
          route,
          overrides.loginResponse.body,
          overrides.loginResponse.status,
        );
      }
      return json(route, { user: adminUser, token: 'fake-token' });
    }
    if (path === '/auth/register' && method === 'POST') {
      if (overrides.registerResponse) {
        return json(
          route,
          overrides.registerResponse.body,
          overrides.registerResponse.status,
        );
      }
      return json(route, { user: adminUser, token: 'fake-token' });
    }
    if (path === '/auth/me' && method === 'GET') {
      if (overrides.meResponse) {
        return json(route, overrides.meResponse.body, overrides.meResponse.status);
      }
      return json(route, adminUser);
    }
    if (path === '/auth/logout' && method === 'POST') {
      return json(route, { ok: true });
    }

    // ----- Dashboard -----
    if (path === '/dashboard' && method === 'GET') {
      return json(route, dashboard);
    }

    // ----- Contacts -----
    if (path === '/contacts' && method === 'GET') {
      return json(route, {
        data: contacts,
        meta: {
          currentPage: 1,
          perPage: 20,
          total: contacts.length,
          lastPage: 1,
        },
      });
    }
    if (/^\/contacts\/\d+$/.test(path) && method === 'GET') {
      const id = Number(path.split('/')[2]);
      const c = contacts.find((x) => x.id === id) ?? contacts[0];
      return json(route, {
        ...c,
        notes: 'E2E test contact',
        updatedAt: '2024-06-02T00:00:00Z',
        company: null,
        deals: [],
        activities: [],
      });
    }
    if (path === '/contacts' && method === 'POST') {
      return json(route, { ...contacts[0], id: 999 });
    }
    if (/^\/contacts\/\d+$/.test(path) && method === 'PUT') {
      return json(route, contacts[0]);
    }
    if (/^\/contacts\/\d+$/.test(path) && method === 'DELETE') {
      return route.fulfill({ status: 204, body: '' });
    }

    // ----- Companies -----
    if (path === '/companies' && method === 'GET') {
      return json(route, {
        data: companies,
        meta: {
          currentPage: 1,
          perPage: 20,
          total: companies.length,
          lastPage: 1,
        },
      });
    }
    if (/^\/companies\/\d+$/.test(path) && method === 'GET') {
      const id = Number(path.split('/')[2]);
      const c = companies.find((x) => x.id === id) ?? companies[0];
      return json(route, {
        ...c,
        address: '123 Market St',
        zip: '94105',
        notes: null,
        updatedAt: '2024-06-02T00:00:00Z',
        contacts: [],
        deals: [],
      });
    }
    if (path === '/companies' && method === 'POST') {
      return json(route, { ...companies[0], id: 998 });
    }

    // ----- Deals -----
    if (path === '/deals' && method === 'GET') {
      return json(route, {
        data: deals,
        meta: {
          currentPage: 1,
          perPage: 20,
          total: deals.length,
          lastPage: 1,
        },
      });
    }
    if (path === '/deals/pipeline' && method === 'GET') {
      return json(route, pipeline);
    }
    if (/^\/deals\/\d+$/.test(path) && method === 'GET') {
      const id = Number(path.split('/')[2]);
      const d = deals.find((x) => x.id === id) ?? deals[0];
      return json(route, {
        ...d,
        notes: null,
        updatedAt: '2024-06-02T00:00:00Z',
        activities: [],
        insights: [],
      });
    }
    if (path === '/deals' && method === 'POST') {
      return json(route, { ...deals[0], id: 997 });
    }

    // ----- Activities -----
    if (path === '/activities' && method === 'GET') {
      return json(route, {
        data: activities,
        meta: {
          currentPage: 1,
          perPage: 20,
          total: activities.length,
          lastPage: 1,
        },
      });
    }
    if (path === '/activities' && method === 'POST') {
      return json(route, { ...activities[0], id: 996 });
    }

    // ----- Tags -----
    if (path === '/tags' && method === 'GET') {
      return json(route, tags);
    }
    if (path === '/tags' && method === 'POST') {
      return json(route, {
        id: 1,
        name: 'New',
        color: '#02795f',
        createdAt: '2024-01-01T00:00:00Z',
      });
    }

    // ----- Users -----
    if (path === '/users' && method === 'GET') {
      return json(route, users);
    }

    // ----- AI -----
    if (path === '/ai/search' && method === 'POST') {
      return json(route, {
        interpretation: 'Found matching results',
        contacts,
        activities,
      });
    }
    if (path === '/ai/summarize' && method === 'POST') {
      return json(route, { summary: 'Concise summary of the input.' });
    }

    // Anything else: empty success
    return json(route, {});
  });
}

/**
 * Pre-seeds the persisted Zustand auth store so the app boots in an
 * authenticated state. Must be called BEFORE the first navigation.
 */
export async function loginAs(
  page: Page,
  user: typeof adminUser | typeof regularUser = adminUser,
) {
  await page.addInitScript(
    ({ user, token }) => {
      window.localStorage.setItem(
        'sunroom_auth',
        JSON.stringify({
          state: { user, token, isAuthenticated: true },
          version: 0,
        }),
      );
    },
    { user, token: 'e2e-token' },
  );
}
