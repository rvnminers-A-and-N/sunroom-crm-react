import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from './dialog';

describe('Dialog', () => {
  it('opens on trigger click and renders content', async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent className="dc-x">
          <DialogHeader className="hdr-x">
            <DialogTitle className="title-x">Title</DialogTitle>
            <DialogDescription className="desc-x">Description</DialogDescription>
          </DialogHeader>
          <div>Body</div>
          <DialogFooter className="ft-x">
            <button>Save</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.queryByText('Title')).not.toBeInTheDocument();
    await user.click(screen.getByText('Open'));
    expect(await screen.findByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    expect(document.querySelector('[data-slot="dialog-content"]')).toHaveClass('dc-x');
    expect(document.querySelector('[data-slot="dialog-header"]')).toHaveClass('hdr-x');
    expect(document.querySelector('[data-slot="dialog-title"]')).toHaveClass('title-x');
    expect(document.querySelector('[data-slot="dialog-description"]')).toHaveClass('desc-x');
    expect(document.querySelector('[data-slot="dialog-footer"]')).toHaveClass('ft-x');
  });

  it('hides close button when showCloseButton is false', async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogTitle>T</DialogTitle>
          <DialogDescription>D</DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    await user.click(screen.getByText('Open'));
    await screen.findByText('T');
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });

  it('renders DialogFooter with internal close button when showCloseButton', async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogTitle>T</DialogTitle>
          <DialogDescription>D</DialogDescription>
          <DialogFooter showCloseButton>
            <span>Slot</span>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    await user.click(screen.getByText('Open'));
    await screen.findByText('T');
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('closes via DialogClose', async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogTitle>T</DialogTitle>
          <DialogDescription>D</DialogDescription>
          <DialogClose>Done</DialogClose>
        </DialogContent>
      </Dialog>,
    );
    await user.click(screen.getByText('Open'));
    await screen.findByText('T');
    await user.click(screen.getByText('Done'));
    expect(screen.queryByText('T')).not.toBeInTheDocument();
  });

  it('exports DialogPortal and DialogOverlay', () => {
    expect(typeof DialogPortal).toBe('function');
    expect(typeof DialogOverlay).toBe('function');
  });

  it('renders DialogOverlay with custom className', async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogPortal>
          <DialogOverlay className="ov-x" />
          <DialogContent showCloseButton={false}>
            <DialogTitle>T</DialogTitle>
            <DialogDescription>D</DialogDescription>
          </DialogContent>
        </DialogPortal>
      </Dialog>,
    );
    await user.click(screen.getByText('Open'));
    await screen.findByText('T');
    expect(document.querySelector('[data-slot="dialog-overlay"].ov-x')).toBeInTheDocument();
  });
});
