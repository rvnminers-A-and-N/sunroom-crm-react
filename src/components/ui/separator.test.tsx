import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Separator } from './separator';

describe('Separator', () => {
  it('renders with default horizontal orientation', () => {
    render(<Separator data-testid="sep" />);
    const sep = screen.getByTestId('sep');
    expect(sep).toHaveAttribute('data-slot', 'separator');
    expect(sep).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('renders with vertical orientation', () => {
    render(<Separator orientation="vertical" data-testid="sep" />);
    expect(screen.getByTestId('sep')).toHaveAttribute('data-orientation', 'vertical');
  });

  it('merges custom className', () => {
    render(<Separator className="custom-sep" data-testid="sep" />);
    expect(screen.getByTestId('sep')).toHaveClass('custom-sep');
  });

  it('respects decorative=false (renders as separator role)', () => {
    render(<Separator decorative={false} data-testid="sep" />);
    expect(screen.getByTestId('sep')).toHaveAttribute('role', 'separator');
  });
});
