import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Skeleton } from './skeleton';

describe('Skeleton', () => {
  it('renders with data-slot', () => {
    render(<Skeleton data-testid="sk" />);
    expect(screen.getByTestId('sk')).toHaveAttribute('data-slot', 'skeleton');
  });

  it('merges custom className', () => {
    render(<Skeleton className="custom-sk" data-testid="sk" />);
    expect(screen.getByTestId('sk')).toHaveClass('custom-sk');
    expect(screen.getByTestId('sk')).toHaveClass('animate-pulse');
  });
});
