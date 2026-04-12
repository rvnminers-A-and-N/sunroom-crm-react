import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button, buttonVariants } from './button';

describe('Button', () => {
  const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const;
  const sizes = ['default', 'xs', 'sm', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'] as const;

  it.each(variants)('renders %s variant', (variant) => {
    render(
      <Button variant={variant} data-testid="btn">
        {variant}
      </Button>,
    );
    expect(screen.getByTestId('btn')).toHaveAttribute('data-variant', variant);
  });

  it.each(sizes)('renders %s size', (size) => {
    render(
      <Button size={size} data-testid="btn">
        {size}
      </Button>,
    );
    expect(screen.getByTestId('btn')).toHaveAttribute('data-size', size);
  });

  it('renders default variant and size when none specified', () => {
    render(<Button data-testid="btn">x</Button>);
    expect(screen.getByTestId('btn')).toHaveAttribute('data-variant', 'default');
    expect(screen.getByTestId('btn')).toHaveAttribute('data-size', 'default');
  });

  it('merges custom className', () => {
    render(
      <Button className="custom-btn" data-testid="btn">
        x
      </Button>,
    );
    expect(screen.getByTestId('btn')).toHaveClass('custom-btn');
  });

  it('renders as button by default', () => {
    render(<Button data-testid="btn">x</Button>);
    expect(screen.getByTestId('btn').tagName).toBe('BUTTON');
  });

  it('uses Slot.Root when asChild is true', () => {
    render(
      <Button asChild data-testid="btn">
        <a href="/x">link</a>
      </Button>,
    );
    const el = screen.getByTestId('btn');
    expect(el.tagName).toBe('A');
    expect(el).toHaveAttribute('data-slot', 'button');
  });

  it('handles click events', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>click</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'click' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('respects disabled prop', () => {
    render(<Button disabled>x</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('exports buttonVariants helper', () => {
    expect(typeof buttonVariants).toBe('function');
    expect(buttonVariants({ variant: 'destructive', size: 'lg' })).toContain('bg-destructive');
  });
});
