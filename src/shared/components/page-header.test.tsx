import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PageHeader } from './page-header';

describe('PageHeader', () => {
  it('renders title only', () => {
    render(<PageHeader title="Hello" />);
    expect(screen.getByRole('heading', { name: 'Hello' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<PageHeader title="Hello" subtitle="Sub" />);
    expect(screen.getByText('Sub')).toBeInTheDocument();
  });

  it('does not render subtitle when omitted', () => {
    render(<PageHeader title="Hello" />);
    expect(screen.queryByText('Sub')).not.toBeInTheDocument();
  });

  it('renders action button when actionLabel provided and fires onAction', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<PageHeader title="Hello" actionLabel="Add" onAction={onAction} />);
    const btn = screen.getByRole('button', { name: /add/i });
    await user.click(btn);
    expect(onAction).toHaveBeenCalled();
  });

  it('does not render action button when actionLabel omitted', () => {
    render(<PageHeader title="Hello" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
