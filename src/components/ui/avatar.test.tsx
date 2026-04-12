import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from './avatar';

describe('Avatar', () => {
  it('renders with default size', () => {
    render(
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>,
    );
    const root = document.querySelector('[data-slot="avatar"]');
    expect(root).toHaveAttribute('data-size', 'default');
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders with sm size', () => {
    render(
      <Avatar size="sm" data-testid="av">
        <AvatarFallback>SM</AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByTestId('av')).toHaveAttribute('data-size', 'sm');
  });

  it('renders with lg size', () => {
    render(
      <Avatar size="lg" data-testid="av">
        <AvatarFallback>LG</AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByTestId('av')).toHaveAttribute('data-size', 'lg');
  });

  it('merges custom className on root', () => {
    render(
      <Avatar className="custom-avatar" data-testid="av">
        <AvatarFallback>X</AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByTestId('av')).toHaveClass('custom-avatar');
  });

  it('renders AvatarImage with className', () => {
    render(
      <Avatar>
        <AvatarImage src="https://example.com/a.png" alt="me" className="img-x" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>,
    );
    expect(document.querySelector('[data-slot="avatar-fallback"]')).toBeInTheDocument();
  });

  it('renders AvatarFallback with className', () => {
    render(
      <Avatar>
        <AvatarFallback className="fb-x">JD</AvatarFallback>
      </Avatar>,
    );
    const fb = document.querySelector('[data-slot="avatar-fallback"]');
    expect(fb).toHaveClass('fb-x');
  });

  it('renders AvatarBadge', () => {
    render(
      <Avatar>
        <AvatarFallback>X</AvatarFallback>
        <AvatarBadge className="badge-x" data-testid="badge" />
      </Avatar>,
    );
    expect(screen.getByTestId('badge')).toHaveAttribute('data-slot', 'avatar-badge');
    expect(screen.getByTestId('badge')).toHaveClass('badge-x');
  });

  it('renders AvatarGroup with custom className', () => {
    render(
      <AvatarGroup className="grp-x" data-testid="grp">
        <Avatar>
          <AvatarFallback>A</AvatarFallback>
        </Avatar>
      </AvatarGroup>,
    );
    expect(screen.getByTestId('grp')).toHaveAttribute('data-slot', 'avatar-group');
    expect(screen.getByTestId('grp')).toHaveClass('grp-x');
  });

  it('renders AvatarGroupCount with custom className', () => {
    render(<AvatarGroupCount className="ct-x" data-testid="ct">+3</AvatarGroupCount>);
    expect(screen.getByTestId('ct')).toHaveAttribute('data-slot', 'avatar-group-count');
    expect(screen.getByTestId('ct')).toHaveClass('ct-x');
    expect(screen.getByTestId('ct')).toHaveTextContent('+3');
  });
});
