import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MobileSidebar } from './mobile-sidebar';
import { renderWithProviders } from '../../tests/utils/render';
import { makeUser, makeAdmin } from '../../tests/msw/data/factories';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe('MobileSidebar', () => {
  beforeEach(() => {
    navigateMock.mockClear();
  });

  it('does not render content when closed', () => {
    renderWithProviders(<MobileSidebar open={false} onClose={() => {}} />);
    expect(screen.queryByText(/Sunroom/)).not.toBeInTheDocument();
  });

  it('renders the sheet header and nav links when open', () => {
    renderWithProviders(<MobileSidebar open={true} onClose={() => {}} />);
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
    renderWithProviders(<MobileSidebar open={true} onClose={() => {}} />, {
      initialAuth: { user: makeUser({ role: 'User' }) },
    });
    expect(screen.queryByText('Users')).not.toBeInTheDocument();
  });

  it('shows the admin link for admin users', () => {
    renderWithProviders(<MobileSidebar open={true} onClose={() => {}} />, {
      initialAuth: { user: makeAdmin() },
    });
    expect(screen.getByText('Users')).toBeInTheDocument();
  });

  it('renders the user footer when authenticated', () => {
    renderWithProviders(<MobileSidebar open={true} onClose={() => {}} />, {
      initialAuth: { user: makeUser({ name: 'Jane Doe', role: 'User' }) },
    });
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByTitle('Logout')).toBeInTheDocument();
  });

  it('does not render the user footer when not authenticated', () => {
    renderWithProviders(<MobileSidebar open={true} onClose={() => {}} />);
    expect(screen.queryByTitle('Logout')).not.toBeInTheDocument();
  });

  it('calls onClose when a nav link is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(<MobileSidebar open={true} onClose={onClose} />);
    await user.click(screen.getByText('Dashboard'));
    expect(onClose).toHaveBeenCalled();
  });

  it('logs out and navigates to /auth/login when the logout button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(<MobileSidebar open={true} onClose={onClose} />, {
      initialAuth: { user: makeUser() },
    });
    await user.click(screen.getByTitle('Logout'));
    expect(onClose).toHaveBeenCalled();
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/auth/login');
    });
  });

  it('calls onClose when the sheet is dismissed', async () => {
    const onClose = vi.fn();
    const { rerender } = renderWithProviders(
      <MobileSidebar open={true} onClose={onClose} />,
    );
    // Press Escape to dismiss
    const user = userEvent.setup();
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
    rerender(<MobileSidebar open={false} onClose={onClose} />);
  });
});
