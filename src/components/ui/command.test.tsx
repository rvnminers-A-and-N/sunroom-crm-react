import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from './command';

describe('Command', () => {
  it('renders Command with all sub-components', () => {
    render(
      <Command className="cmd-x">
        <CommandInput className="input-x" placeholder="Type a command" />
        <CommandList className="list-x">
          <CommandEmpty>No results</CommandEmpty>
          <CommandGroup className="group-x" heading="Suggestions">
            <CommandItem className="item-x">Calendar</CommandItem>
            <CommandItem>Search</CommandItem>
          </CommandGroup>
          <CommandSeparator className="sep-x" />
          <CommandGroup heading="More">
            <CommandItem>
              Settings
              <CommandShortcut className="shortcut-x">⌘,</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>,
    );

    expect(document.querySelector('[data-slot="command"]')).toHaveClass('cmd-x');
    expect(document.querySelector('[data-slot="command-input-wrapper"]')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="command-input"]')).toHaveClass('input-x');
    expect(document.querySelector('[data-slot="command-list"]')).toHaveClass('list-x');
    expect(document.querySelector('[data-slot="command-group"]')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="command-separator"]')).toHaveClass('sep-x');
    const items = document.querySelectorAll('[data-slot="command-item"]');
    expect(items.length).toBeGreaterThan(0);
    expect(document.querySelector('[data-slot="command-shortcut"]')).toHaveClass('shortcut-x');
  });

  it('filters items as user types and shows empty state', async () => {
    const user = userEvent.setup();
    render(
      <Command>
        <CommandInput placeholder="Search" />
        <CommandList>
          <CommandEmpty>No results</CommandEmpty>
          <CommandGroup heading="Items">
            <CommandItem>Apple</CommandItem>
            <CommandItem>Banana</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>,
    );

    await user.type(screen.getByPlaceholderText('Search'), 'zzz');
    expect(await screen.findByText('No results')).toBeInTheDocument();
  });

  it('renders CommandDialog when open', () => {
    render(
      <CommandDialog open onOpenChange={() => {}} className="cd-x">
        <CommandInput placeholder="Search" />
        <CommandList>
          <CommandEmpty>None</CommandEmpty>
          <CommandItem>One</CommandItem>
        </CommandList>
      </CommandDialog>,
    );
    expect(document.querySelector('[data-slot="dialog-content"]')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="command"]')).toBeInTheDocument();
  });

  it('renders CommandDialog with custom title and description', () => {
    render(
      <CommandDialog open onOpenChange={() => {}} title="Custom" description="Custom desc">
        <CommandInput placeholder="Search" />
        <CommandList>
          <CommandItem>One</CommandItem>
        </CommandList>
      </CommandDialog>,
    );
    expect(screen.getByText('Custom')).toBeInTheDocument();
    expect(screen.getByText('Custom desc')).toBeInTheDocument();
  });
});
