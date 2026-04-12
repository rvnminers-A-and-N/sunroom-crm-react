import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Tabs, TabsContent, TabsList, TabsTrigger, tabsListVariants } from './tabs';

describe('Tabs', () => {
  it('renders default variant horizontal and switches active tab', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="a" className="tabs-x">
        <TabsList className="tl-x">
          <TabsTrigger className="tt-x" value="a">
            A
          </TabsTrigger>
          <TabsTrigger value="b">B</TabsTrigger>
        </TabsList>
        <TabsContent className="tc-x" value="a">
          A content
        </TabsContent>
        <TabsContent value="b">B content</TabsContent>
      </Tabs>,
    );

    expect(screen.getByText('A content')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="tabs"]')).toHaveAttribute('data-orientation', 'horizontal');
    expect(document.querySelector('[data-slot="tabs-list"]')).toHaveAttribute('data-variant', 'default');

    await user.click(screen.getByText('B'));
    expect(screen.getByText('B content')).toBeInTheDocument();
  });

  it('renders line variant and vertical orientation', () => {
    render(
      <Tabs defaultValue="a" orientation="vertical">
        <TabsList variant="line">
          <TabsTrigger value="a">A</TabsTrigger>
        </TabsList>
        <TabsContent value="a">A</TabsContent>
      </Tabs>,
    );
    expect(document.querySelector('[data-slot="tabs"]')).toHaveAttribute('data-orientation', 'vertical');
    expect(document.querySelector('[data-slot="tabs-list"]')).toHaveAttribute('data-variant', 'line');
  });

  it('exports tabsListVariants helper', () => {
    expect(typeof tabsListVariants).toBe('function');
    expect(tabsListVariants({ variant: 'line' })).toContain('gap-1');
  });
});
