import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './sheet';

describe('Sheet', () => {
  const sides = ['top', 'right', 'bottom', 'left'] as const;

  it.each(sides)('opens with %s side', async (side) => {
    const user = userEvent.setup();
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent side={side} className="sc-x">
          <SheetHeader className="sh-x">
            <SheetTitle className="st-x">Title-{side}</SheetTitle>
            <SheetDescription className="sd-x">Desc</SheetDescription>
          </SheetHeader>
          <div>Body</div>
          <SheetFooter className="sf-x">
            <button>Save</button>
          </SheetFooter>
        </SheetContent>
      </Sheet>,
    );

    await user.click(screen.getByText('Open'));
    expect(await screen.findByText(`Title-${side}`)).toBeInTheDocument();
    expect(screen.getByText('Desc')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('hides close button when showCloseButton=false', async () => {
    const user = userEvent.setup();
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent showCloseButton={false}>
          <SheetTitle>T</SheetTitle>
          <SheetDescription>D</SheetDescription>
        </SheetContent>
      </Sheet>,
    );
    await user.click(screen.getByText('Open'));
    await screen.findByText('T');
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });

  it('closes via SheetClose', async () => {
    const user = userEvent.setup();
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent showCloseButton={false}>
          <SheetTitle>T</SheetTitle>
          <SheetDescription>D</SheetDescription>
          <SheetClose>Done</SheetClose>
        </SheetContent>
      </Sheet>,
    );
    await user.click(screen.getByText('Open'));
    await screen.findByText('T');
    await user.click(screen.getByText('Done'));
    expect(screen.queryByText('T')).not.toBeInTheDocument();
  });
});
