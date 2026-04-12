import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './select';

describe('Select', () => {
  it('opens on trigger click and renders items (popper position)', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Select onValueChange={onValueChange}>
        <SelectTrigger className="st-x" data-testid="trigger">
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent position="popper" className="sc-x">
          <SelectGroup>
            <SelectLabel className="sl-x">Group</SelectLabel>
            <SelectItem className="si-x" value="a">
              Apple
            </SelectItem>
            <SelectItem value="b">Banana</SelectItem>
            <SelectSeparator className="sp-x" />
            <SelectItem value="c">Cherry</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>,
    );

    await user.click(screen.getByTestId('trigger'));
    expect(await screen.findByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Group')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="select-trigger"]')).toHaveClass('st-x');
    expect(document.querySelector('[data-slot="select-content"]')).toHaveClass('sc-x');
    expect(document.querySelector('[data-slot="select-label"]')).toHaveClass('sl-x');
    expect(document.querySelector('[data-slot="select-separator"]')).toHaveClass('sp-x');

    await user.click(screen.getByText('Apple'));
    expect(onValueChange).toHaveBeenCalledWith('a');
  });

  it('renders item-aligned position by default', async () => {
    const user = userEvent.setup();
    render(
      <Select>
        <SelectTrigger size="sm" data-testid="trigger">
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Apple</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByTestId('trigger')).toHaveAttribute('data-size', 'sm');
    await user.click(screen.getByTestId('trigger'));
    expect(await screen.findByText('Apple')).toBeInTheDocument();
  });

  it('renders default size when no size specified', () => {
    render(
      <Select>
        <SelectTrigger data-testid="trigger">
          <SelectValue placeholder="Pick" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Apple</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByTestId('trigger')).toHaveAttribute('data-size', 'default');
  });

  it('exports SelectScrollUpButton and SelectScrollDownButton', () => {
    expect(typeof SelectScrollUpButton).toBe('function');
    expect(typeof SelectScrollDownButton).toBe('function');
  });
});
