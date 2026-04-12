import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card';

describe('Card', () => {
  it('renders all sub-components with merged classes', () => {
    render(
      <Card className="card-x" data-testid="card">
        <CardHeader className="hdr-x" data-testid="hdr">
          <CardTitle className="title-x" data-testid="title">
            Title
          </CardTitle>
          <CardDescription className="desc-x" data-testid="desc">
            Desc
          </CardDescription>
          <CardAction className="action-x" data-testid="action">
            <button>X</button>
          </CardAction>
        </CardHeader>
        <CardContent className="content-x" data-testid="content">
          Body
        </CardContent>
        <CardFooter className="footer-x" data-testid="footer">
          Foot
        </CardFooter>
      </Card>,
    );

    expect(screen.getByTestId('card')).toHaveAttribute('data-slot', 'card');
    expect(screen.getByTestId('card')).toHaveClass('card-x');
    expect(screen.getByTestId('hdr')).toHaveAttribute('data-slot', 'card-header');
    expect(screen.getByTestId('hdr')).toHaveClass('hdr-x');
    expect(screen.getByTestId('title')).toHaveAttribute('data-slot', 'card-title');
    expect(screen.getByTestId('title')).toHaveClass('title-x');
    expect(screen.getByTestId('desc')).toHaveAttribute('data-slot', 'card-description');
    expect(screen.getByTestId('desc')).toHaveClass('desc-x');
    expect(screen.getByTestId('action')).toHaveAttribute('data-slot', 'card-action');
    expect(screen.getByTestId('action')).toHaveClass('action-x');
    expect(screen.getByTestId('content')).toHaveAttribute('data-slot', 'card-content');
    expect(screen.getByTestId('content')).toHaveClass('content-x');
    expect(screen.getByTestId('footer')).toHaveAttribute('data-slot', 'card-footer');
    expect(screen.getByTestId('footer')).toHaveClass('footer-x');
  });

  it('renders without optional className', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>T</CardTitle>
          <CardDescription>D</CardDescription>
        </CardHeader>
        <CardContent>C</CardContent>
        <CardFooter>F</CardFooter>
      </Card>,
    );
    expect(document.querySelector('[data-slot="card"]')).toBeInTheDocument();
  });
});
