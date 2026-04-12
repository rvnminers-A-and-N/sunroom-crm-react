import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Label } from './label';

describe('Label', () => {
  it('renders text content', () => {
    render(<Label>Name</Label>);
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('has data-slot attribute', () => {
    render(<Label data-testid="lbl">x</Label>);
    expect(screen.getByTestId('lbl')).toHaveAttribute('data-slot', 'label');
  });

  it('merges custom className', () => {
    render(
      <Label className="custom-lbl" data-testid="lbl">
        x
      </Label>,
    );
    expect(screen.getByTestId('lbl')).toHaveClass('custom-lbl');
  });

  it('associates with htmlFor', () => {
    render(
      <>
        <Label htmlFor="email">Email</Label>
        <input id="email" />
      </>,
    );
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });
});
