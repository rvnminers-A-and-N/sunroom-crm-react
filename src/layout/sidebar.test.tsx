import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from './sidebar';
import { renderWithProviders } from '../../tests/utils/render';
import { makeUser, makeAdmin } from '../../tests/msw/data/factories';
import { useUiStore } from '@core/stores/ui-store';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe('Sidebar', () => {
  beforeEach(() => {
    navigateMock.mockClear();
  });

  it('renders the brand and all default nav items when expanded', () => {
    renderWithProviders(<Sidebar />);
    expect(screen.getByText(/Sunroom/)).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Contacts')).toBeInTheDocument();
    expect(screen.getByText('Companies')).toBeInTheDocument();
    expect(screen.getByText('Deals')).toBeInTheDocument();
    expect(screen.getByText('Activities')).toBeInTheDocument();
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('hides the admin link for non-admin users', () => {
    renderWithProviders(<Sidebar />, {
      initialAuth: { user: makeUser({ role: 'User' }) },
    });
    expect(screen.queryByText('Users')).not.toBeInTheDocument();
  });

  it('shows the admin link for admin users', () => {
    renderWithProviders(<Sidebar />, {
      initialAuth: { user: makeAdmin() },
    });
    expect(screen.getByText('Users')).toBeInTheDocument();
  });

  it('shows the user footer when authenticated', () => {
    renderWithProviders(<Sidebar />, {
      initialAuth: { user: makeUser({ name: 'Jane Doe', role: 'User' }) },
    });
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByTitle('Logout')).toBeInTheDocument();
  });

  it('does not render the user footer when not authenticated', () => {
    renderWithProviders(<Sidebar />);
    expect(screen.queryByTitle('Logout')).not.toBeInTheDocument();
  });

  it('toggles collapsed state when the toggle button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Sidebar />);
    expect(useUiStore.getState().sidebarCollapsed).toBe(false);
    // The toggle button is the only button when not authenticated
    const buttons = screen.getAllByRole('button');
    await user.click(buttons[0]);
    expect(useUiStore.getState().sidebarCollapsed).toBe(true);
  });

  it('hides labels and the brand text when collapsed', () => {
    useUiStore.setState({ sidebarCollapsed: true });
    renderWithProviders(<Sidebar />, {
      initialAuth: { user: makeUser({ name: 'Jane Doe' }) },
    });
    // Brand text only renders when expanded
    expect(screen.queryByText(/Sunroom/)).not.toBeInTheDocument();
    // Nav labels are inside spans that only render when expanded
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    // Nav items still render as links via tooltip triggers
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(7);
    // User footer name/role hidden when collapsed
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Logout')).not.toBeInTheDocument();
  });

  it('logs out and navigates to /auth/login when the logout button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Sidebar />, {
      initialAuth: { user: makeUser() },
    });
    await user.click(screen.getByTitle('Logout'));
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/auth/login');
    });
  });

  it('marks the active nav link with the active classes', () => {
    renderWithProviders(<Sidebar />, { route: '/dashboard' });
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).not.toBeNull();
    expect(dashboardLink?.className).toContain('text-sr-primary');
  });
});
