import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './dropdown-menu';

describe('DropdownMenu', () => {
  it('opens and renders all sub-components', async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent className="dc-x">
          <DropdownMenuLabel className="lbl-x" inset>
            Label
          </DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem className="item-x" inset>
              Item One
              <DropdownMenuShortcut className="sc-x">⌘1</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator className="sep-x" />
          <DropdownMenuCheckboxItem className="ck-x" checked>
            Check
          </DropdownMenuCheckboxItem>
          <DropdownMenuRadioGroup value="a">
            <DropdownMenuRadioItem className="rd-x" value="a">
              A
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="b">B</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="sub-x" inset>
              More
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="subc-x">
              <DropdownMenuItem>Nested</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await user.click(screen.getByText('Open'));
    expect(await screen.findByText('Item One')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Check')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('More')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="dropdown-menu-content"]')).toHaveClass('dc-x');
    expect(document.querySelector('[data-slot="dropdown-menu-label"]')).toHaveClass('lbl-x');
    expect(document.querySelector('[data-slot="dropdown-menu-separator"]')).toHaveClass('sep-x');
    expect(document.querySelector('[data-slot="dropdown-menu-shortcut"]')).toHaveClass('sc-x');
    expect(document.querySelector('[data-slot="dropdown-menu-item"]')).toHaveClass('item-x');
  });

  it('triggers item onSelect handler', async () => {
    const user = userEvent.setup();
    const fn = vi.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={fn}>Pick</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await user.click(screen.getByText('Open'));
    await user.click(await screen.findByText('Pick'));
    expect(fn).toHaveBeenCalled();
  });

  it('renders DropdownMenuPortal', async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent>
            <DropdownMenuItem>Inside Portal</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>,
    );
    await user.click(screen.getByText('Open'));
    expect(await screen.findByText('Inside Portal')).toBeInTheDocument();
  });
});
