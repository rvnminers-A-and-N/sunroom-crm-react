import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge, badgeVariants } from './badge';

describe('Badge', () => {
  const variants = ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'] as const;

  it.each(variants)('renders %s variant', (variant) => {
    render(
      <Badge variant={variant} data-testid="badge">
        {variant}
      </Badge>,
    );
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveAttribute('data-slot', 'badge');
    expect(badge).toHaveAttribute('data-variant', variant);
  });

  it('renders default variant when no variant specified', () => {
    render(<Badge data-testid="b">x</Badge>);
    expect(screen.getByTestId('b')).toHaveAttribute('data-variant', 'default');
  });

  it('merges custom className', () => {
    render(<Badge className="custom-badge" data-testid="b">x</Badge>);
    expect(screen.getByTestId('b')).toHaveClass('custom-badge');
  });

  it('renders as span by default', () => {
    render(<Badge data-testid="b">x</Badge>);
    expect(screen.getByTestId('b').tagName).toBe('SPAN');
  });

  it('uses Slot.Root when asChild is true', () => {
    render(
      <Badge asChild data-testid="b">
        <a href="/x">link</a>
      </Badge>,
    );
    const el = screen.getByTestId('b');
    expect(el.tagName).toBe('A');
    expect(el).toHaveAttribute('data-slot', 'badge');
  });

  it('exports badgeVariants helper', () => {
    expect(typeof badgeVariants).toBe('function');
    expect(badgeVariants({ variant: 'secondary' })).toContain('bg-secondary');
  });
});
