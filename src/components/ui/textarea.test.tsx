import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Textarea } from './textarea';

describe('Textarea', () => {
  it('renders with data-slot', () => {
    render(<Textarea data-testid="ta" />);
    const ta = screen.getByTestId('ta');
    expect(ta).toHaveAttribute('data-slot', 'textarea');
    expect(ta.tagName).toBe('TEXTAREA');
  });

  it('merges custom className', () => {
    render(<Textarea className="custom-ta" data-testid="ta" />);
    expect(screen.getByTestId('ta')).toHaveClass('custom-ta');
  });

  it('handles user typing', async () => {
    const user = userEvent.setup();
    render(<Textarea data-testid="ta" />);
    const ta = screen.getByTestId('ta') as HTMLTextAreaElement;
    await user.type(ta, 'multi\nline');
    expect(ta).toHaveValue('multi\nline');
  });

  it('respects disabled prop', () => {
    render(<Textarea disabled data-testid="ta" />);
    expect(screen.getByTestId('ta')).toBeDisabled();
  });

  it('forwards placeholder', () => {
    render(<Textarea placeholder="enter" />);
    expect(screen.getByPlaceholderText('enter')).toBeInTheDocument();
  });
});
