import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

describe('Tooltip', () => {
  it('opens on focus and renders content', async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Trigger</TooltipTrigger>
          <TooltipContent className="tc-x">Hello</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    expect(screen.queryAllByText('Hello')).toHaveLength(0);
    await user.click(screen.getByText('Trigger'));
    await user.tab();
    await user.tab({ shift: true });
    // Use keyboard focus to open
    screen.getByText('Trigger').focus();
    const tip = await screen.findAllByText('Hello');
    expect(tip.length).toBeGreaterThan(0);
    expect(document.querySelector('[data-slot="tooltip-content"]')).toHaveClass('tc-x');
  });

  it('renders TooltipProvider with custom delay', () => {
    render(
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger>x</TooltipTrigger>
          <TooltipContent>tip</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    expect(document.querySelector('[data-slot="tooltip-trigger"]')).toBeInTheDocument();
  });
});
