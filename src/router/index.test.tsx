import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Stub every lazy-loaded feature module so the lazy() factories in router/index.tsx
// can be invoked safely under jsdom without dragging in real feature dependencies.
vi.mock('@layout/app-layout', () => ({ default: () => <div>app-layout-stub</div> }));
vi.mock('@features/auth/login-page', () => ({ default: () => <div>login-stub</div> }));
vi.mock('@features/auth/register-page', () => ({
  default: () => <div>register-stub</div>,
}));
vi.mock('@features/dashboard/dashboard-page', () => ({
  default: () => <div>dashboard-stub</div>,
}));
vi.mock('@features/contacts/contact-list-page', () => ({
  default: () => <div>contact-list-stub</div>,
}));
vi.mock('@features/contacts/contact-detail-page', () => ({
  default: () => <div>contact-detail-stub</div>,
}));
vi.mock('@features/companies/company-list-page', () => ({
  default: () => <div>company-list-stub</div>,
}));
vi.mock('@features/companies/company-detail-page', () => ({
  default: () => <div>company-detail-stub</div>,
}));
vi.mock('@features/deals/deal-list-page', () => ({
  default: () => <div>deal-list-stub</div>,
}));
vi.mock('@features/deals/deal-pipeline-page', () => ({
  default: () => <div>deal-pipeline-stub</div>,
}));
vi.mock('@features/deals/deal-detail-page', () => ({
  default: () => <div>deal-detail-stub</div>,
}));
vi.mock('@features/activities/activity-list-page', () => ({
  default: () => <div>activity-list-stub</div>,
}));
vi.mock('@features/ai/ai-panel-page', () => ({
  default: () => <div>ai-panel-stub</div>,
}));
vi.mock('@features/settings/profile-page', () => ({
  default: () => <div>profile-stub</div>,
}));
vi.mock('@features/admin/user-management-page', () => ({
  default: () => <div>admin-stub</div>,
}));

import { router } from './index';
import { useAuthStore } from '@core/stores/auth-store';
import { resetAuthStore } from '../../tests/utils/store';
import { makeUser, makeAdmin } from '../../tests/msw/data/factories';

interface RouteLike {
  path?: string;
  index?: boolean;
  loader?: (...args: unknown[]) => unknown;
  element?: { type: (props: { children: React.ReactNode }) => React.ReactElement };
  children?: RouteLike[];
}

function getRoutes(): RouteLike[] {
  return router.routes as unknown as RouteLike[];
}

function findTopLevel(predicate: (r: RouteLike) => boolean): RouteLike {
  const route = getRoutes().find(predicate);
  if (!route) throw new Error('route not found');
  return route;
}

function findChild(parent: RouteLike, predicate: (r: RouteLike) => boolean): RouteLike {
  const child = parent.children?.find(predicate);
  if (!child) throw new Error('child route not found');
  return child;
}

async function callLoader(loader: RouteLike['loader']): Promise<Response | null> {
  if (!loader) throw new Error('route has no loader');
  const result = await loader({
    request: new Request('http://localhost/'),
    params: {},
    context: undefined,
  });
  return result as Response | null;
}

describe('router/index', () => {
  beforeEach(() => {
    resetAuthStore();
  });

  it('exports a router with the expected top-level routes', () => {
    expect(router).toBeDefined();
    expect(Array.isArray(getRoutes())).toBe(true);
    expect(findTopLevel((r) => r.path === 'auth')).toBeDefined();
    expect(findTopLevel((r) => r.path === '/')).toBeDefined();
    expect(findTopLevel((r) => r.path === '*')).toBeDefined();
  });

  describe('catch-all loader', () => {
    it('redirects to /', async () => {
      const route = findTopLevel((r) => r.path === '*');
      const response = await callLoader(route.loader);
      expect(response).toBeInstanceOf(Response);
      expect(response?.status).toBe(302);
      expect(response?.headers.get('Location')).toBe('/');
    });
  });

  describe('auth index loader', () => {
    it('redirects to login', async () => {
      const authRoute = findTopLevel((r) => r.path === 'auth');
      const indexRoute = findChild(authRoute, (c) => Boolean(c.index));
      const response = await callLoader(indexRoute.loader);
      expect(response?.headers.get('Location')).toBe('login');
    });
  });

  describe('home index loader', () => {
    it('redirects to dashboard', async () => {
      const homeRoute = findTopLevel((r) => r.path === '/');
      const indexRoute = findChild(homeRoute, (c) => Boolean(c.index));
      const response = await callLoader(indexRoute.loader);
      expect(response?.headers.get('Location')).toBe('dashboard');
    });
  });

  describe('requireAuth (root loader)', () => {
    it('redirects to /auth/login when not authenticated', async () => {
      const homeRoute = findTopLevel((r) => r.path === '/');
      const response = await callLoader(homeRoute.loader);
      expect(response).toBeInstanceOf(Response);
      expect(response?.headers.get('Location')).toBe('/auth/login');
    });

    it('returns null when authenticated', async () => {
      useAuthStore.setState({
        user: makeUser(),
        token: 'test-token',
        isAuthenticated: true,
      });
      const homeRoute = findTopLevel((r) => r.path === '/');
      const response = await callLoader(homeRoute.loader);
      expect(response).toBeNull();
    });
  });

  describe('requireAdmin (admin loader)', () => {
    function getAdminRoute(): RouteLike {
      const homeRoute = findTopLevel((r) => r.path === '/');
      return findChild(homeRoute, (c) => c.path === 'admin');
    }

    it('redirects to /auth/login when not authenticated', async () => {
      const adminRoute = getAdminRoute();
      const response = await callLoader(adminRoute.loader);
      expect(response?.headers.get('Location')).toBe('/auth/login');
    });

    it('redirects to /dashboard when authenticated but not admin', async () => {
      useAuthStore.setState({
        user: makeUser({ role: 'User' }),
        token: 'test-token',
        isAuthenticated: true,
      });
      const adminRoute = getAdminRoute();
      const response = await callLoader(adminRoute.loader);
      expect(response?.headers.get('Location')).toBe('/dashboard');
    });

    it('returns null when authenticated as an admin', async () => {
      useAuthStore.setState({
        user: makeAdmin(),
        token: 'test-token',
        isAuthenticated: true,
      });
      const adminRoute = getAdminRoute();
      const response = await callLoader(adminRoute.loader);
      expect(response).toBeNull();
    });
  });

  describe('SuspenseWrapper', () => {
    it('renders its children inside a Suspense boundary with a spinner fallback', () => {
      // The home route's element is `<SuspenseWrapper><AppLayout /></SuspenseWrapper>`,
      // so element.type is the SuspenseWrapper function. Render it directly with
      // a non-suspending child so the function body executes and the fallback JSX
      // is created (but not displayed).
      const homeRoute = findTopLevel((r) => r.path === '/');
      const Wrapper = homeRoute.element!.type;
      const { container } = render(
        <MemoryRouter>
          <Wrapper>
            <div>child content</div>
          </Wrapper>
        </MemoryRouter>,
      );
      expect(screen.getByText('child content')).toBeInTheDocument();
      // Sanity-check the rendered tree is non-empty
      expect(container.firstChild).not.toBeNull();
    });
  });

  describe('lazy route elements', () => {
    // Render every route element so each lazy() factory is invoked at least once.
    // Each element is `<SuspenseWrapper><LazyXxxPage /></SuspenseWrapper>`. With the
    // feature modules mocked above, the lazy components resolve to lightweight stubs.
    function collectRoutes(routes: RouteLike[]): RouteLike[] {
      const result: RouteLike[] = [];
      for (const route of routes) {
        result.push(route);
        if (route.children) result.push(...collectRoutes(route.children));
      }
      return result;
    }

    it('invokes every lazy factory by rendering each route element', async () => {
      const routesWithElement = collectRoutes(getRoutes()).filter((r) => r.element);
      // Sanity-check we found every lazy route. AppLayout + 14 inner pages = 15.
      expect(routesWithElement.length).toBe(15);

      for (const route of routesWithElement) {
        const { unmount, container } = render(
          <MemoryRouter>{route.element as unknown as React.ReactNode}</MemoryRouter>,
        );
        // Wait for the lazy stub to resolve and replace the Suspense fallback.
        await waitFor(() => {
          expect(container.textContent).toMatch(/-stub$/);
        });
        unmount();
      }
    });
  });
});
