import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Input } from './input';

describe('Input', () => {
  it('renders with default type text', () => {
    render(<Input data-testid="i" />);
    const input = screen.getByTestId('i') as HTMLInputElement;
    expect(input).toHaveAttribute('data-slot', 'input');
    expect(input.tagName).toBe('INPUT');
  });

  it('respects type prop', () => {
    render(<Input type="email" data-testid="i" />);
    expect(screen.getByTestId('i')).toHaveAttribute('type', 'email');
  });

  it('merges custom className', () => {
    render(<Input className="custom-i" data-testid="i" />);
    expect(screen.getByTestId('i')).toHaveClass('custom-i');
  });

  it('handles user typing', async () => {
    const user = userEvent.setup();
    render(<Input data-testid="i" />);
    const input = screen.getByTestId('i') as HTMLInputElement;
    await user.type(input, 'hello');
    expect(input).toHaveValue('hello');
  });

  it('respects disabled prop', () => {
    render(<Input disabled data-testid="i" />);
    expect(screen.getByTestId('i')).toBeDisabled();
  });

  it('forwards placeholder', () => {
    render(<Input placeholder="enter" />);
    expect(screen.getByPlaceholderText('enter')).toBeInTheDocument();
  });
});
