import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toolbar } from './toolbar';

describe('Toolbar', () => {
  it('renders a menu toggle button', () => {
    render(<Toolbar onMenuToggle={() => {}} />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('calls onMenuToggle when the button is clicked', async () => {
    const user = userEvent.setup();
    const onMenuToggle = vi.fn();
    render(<Toolbar onMenuToggle={onMenuToggle} />);
    await user.click(screen.getByRole('button'));
    expect(onMenuToggle).toHaveBeenCalledTimes(1);
  });
});
