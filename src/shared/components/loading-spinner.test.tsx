import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoadingSpinner } from './loading-spinner';

describe('LoadingSpinner', () => {
  it('renders without className', () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('merges custom className on inner spinner', () => {
    const { container } = render(<LoadingSpinner className="custom-x" />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toHaveClass('custom-x');
  });
});
