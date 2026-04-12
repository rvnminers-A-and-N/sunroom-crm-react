import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from './popover';

describe('Popover', () => {
  it('opens on trigger and renders content', async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent className="pc-x">
          <PopoverHeader className="ph-x">
            <PopoverTitle className="pt-x">Title</PopoverTitle>
            <PopoverDescription className="pd-x">Desc</PopoverDescription>
          </PopoverHeader>
          <div>Body</div>
        </PopoverContent>
      </Popover>,
    );

    expect(screen.queryByText('Title')).not.toBeInTheDocument();
    await user.click(screen.getByText('Open'));
    expect(await screen.findByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Desc')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="popover-content"]')).toHaveClass('pc-x');
    expect(document.querySelector('[data-slot="popover-header"]')).toHaveClass('ph-x');
    expect(document.querySelector('[data-slot="popover-title"]')).toHaveClass('pt-x');
    expect(document.querySelector('[data-slot="popover-description"]')).toHaveClass('pd-x');
  });

  it('renders PopoverAnchor', () => {
    render(
      <Popover>
        <PopoverAnchor>
          <span>anchor</span>
        </PopoverAnchor>
        <PopoverTrigger>Open</PopoverTrigger>
      </Popover>,
    );
    expect(document.querySelector('[data-slot="popover-anchor"]')).toBeInTheDocument();
  });

  it('renders header/title/description without classes', () => {
    render(
      <>
        <PopoverHeader>
          <PopoverTitle>T</PopoverTitle>
          <PopoverDescription>D</PopoverDescription>
        </PopoverHeader>
      </>,
    );
    expect(document.querySelector('[data-slot="popover-header"]')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="popover-title"]')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="popover-description"]')).toBeInTheDocument();
  });
});
