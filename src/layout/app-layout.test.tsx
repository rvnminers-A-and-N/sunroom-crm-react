import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import AppLayout from './app-layout';
import { renderWithProviders } from '../../tests/utils/render';

// Stub the heavy children to keep this test focused on the layout composition.
vi.mock('./sidebar', () => ({
  Sidebar: () => <aside data-testid="sidebar-stub">sidebar</aside>,
}));

vi.mock('./mobile-sidebar', () => ({
  MobileSidebar: ({ open, onClose }: { open: boolean; onClose: () => void }) => (
    <div data-testid="mobile-sidebar-stub" data-open={String(open)}>
      <button type="button" onClick={onClose}>
        close-mobile
      </button>
    </div>
  ),
}));

vi.mock('./toolbar', () => ({
  Toolbar: ({ onMenuToggle }: { onMenuToggle: () => void }) => (
    <header data-testid="toolbar-stub">
      <button type="button" onClick={onMenuToggle}>
        toolbar-menu
      </button>
    </header>
  ),
}));

describe('AppLayout', () => {
  it('renders the sidebar, toolbar, and outlet content', () => {
    renderWithProviders(
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<div>page content</div>} />
        </Route>
      </Routes>,
    );

    expect(screen.getByTestId('sidebar-stub')).toBeInTheDocument();
    expect(screen.getByTestId('toolbar-stub')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-sidebar-stub')).toHaveAttribute(
      'data-open',
      'false',
    );
    expect(screen.getByText('page content')).toBeInTheDocument();
  });

  it('opens the mobile sidebar when the toolbar menu button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<div>page content</div>} />
        </Route>
      </Routes>,
    );

    expect(screen.getByTestId('mobile-sidebar-stub')).toHaveAttribute(
      'data-open',
      'false',
    );
    await user.click(screen.getByText('toolbar-menu'));
    expect(screen.getByTestId('mobile-sidebar-stub')).toHaveAttribute(
      'data-open',
      'true',
    );
  });

  it('closes the mobile sidebar when its onClose is invoked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<div>page content</div>} />
        </Route>
      </Routes>,
    );

    await user.click(screen.getByText('toolbar-menu'));
    expect(screen.getByTestId('mobile-sidebar-stub')).toHaveAttribute(
      'data-open',
      'true',
    );
    await user.click(screen.getByText('close-mobile'));
    expect(screen.getByTestId('mobile-sidebar-stub')).toHaveAttribute(
      'data-open',
      'false',
    );
  });
});
