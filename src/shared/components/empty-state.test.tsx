import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Mail } from 'lucide-react';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  it('renders default title and message when no props passed', () => {
    render(<EmptyState />);
    expect(screen.getByText('No data')).toBeInTheDocument();
    expect(screen.getByText('Nothing to show here yet.')).toBeInTheDocument();
  });

  it('renders custom title and message', () => {
    render(<EmptyState title="Empty inbox" message="No items here" />);
    expect(screen.getByText('Empty inbox')).toBeInTheDocument();
    expect(screen.getByText('No items here')).toBeInTheDocument();
  });

  it('renders custom icon when provided', () => {
    const { container } = render(<EmptyState icon={Mail} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('does not render action button when actionLabel is not provided', () => {
    render(<EmptyState />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders action button and triggers onAction when actionLabel provided', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<EmptyState actionLabel="Add item" onAction={onAction} />);
    const btn = screen.getByRole('button', { name: 'Add item' });
    expect(btn).toBeInTheDocument();
    await user.click(btn);
    expect(onAction).toHaveBeenCalled();
  });
});
