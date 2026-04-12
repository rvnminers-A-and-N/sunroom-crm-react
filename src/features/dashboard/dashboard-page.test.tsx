import { describe, it, expect, vi } from 'vitest';
import { http, HttpResponse, delay } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import DashboardPage from './dashboard-page';
import { renderWithProviders } from '../../../tests/utils/render';
import { server } from '../../../tests/msw/server';
import { makeDashboard } from '../../../tests/msw/data/factories';

// Stub recharts ResponsiveContainer (jsdom has no real layout) and the chart so
// the dashboard renders without measuring elements.
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 600, height: 280 }}>{children}</div>
    ),
  };
});

describe('DashboardPage', () => {
  it('shows the loading skeleton while data is loading', async () => {
    server.use(
      http.get('http://localhost:5236/api/dashboard', async () => {
        await delay(50);
        return HttpResponse.json(makeDashboard());
      }),
    );
    const { container } = renderWithProviders(<DashboardPage />);
    // Initial render shows skeletons before the query resolves
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(
      0,
    );
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('renders the stat cards, pipeline chart, and recent activity list once data loads', async () => {
    renderWithProviders(<DashboardPage />);
    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Total Contacts')).toBeInTheDocument();
    expect(screen.getByText('Total Companies')).toBeInTheDocument();
    expect(screen.getByText('Active Deals')).toBeInTheDocument();
    expect(screen.getByText('Pipeline Value')).toBeInTheDocument();
    expect(screen.getByText('Won Revenue')).toBeInTheDocument();
    expect(screen.getByText('Pipeline by Stage')).toBeInTheDocument();
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });

  it('renders nothing when the request returns null data', async () => {
    server.use(
      http.get('http://localhost:5236/api/dashboard', () =>
        HttpResponse.json(null),
      ),
    );
    const { container } = renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      // Skeletons go away when isLoading becomes false. With null data, the
      // component returns null so the rendered tree is empty.
      expect(
        container.querySelectorAll('[data-slot="skeleton"]').length,
      ).toBe(0);
    });
    expect(container.textContent).toBe('');
  });
});
