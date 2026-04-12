import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecentActivityList } from './recent-activity-list';

describe('RecentActivityList', () => {
  it('renders the heading and an empty message when there are no activities', () => {
    render(<RecentActivityList activities={[]} />);
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('No recent activity')).toBeInTheDocument();
  });

  it('renders each activity with subject, user, contact and relative time', () => {
    render(
      <RecentActivityList
        activities={[
          {
            id: 1,
            type: 'Call',
            subject: 'Followed up with Jane',
            contactName: 'Jane Doe',
            userName: 'Test User',
            occurredAt: new Date(Date.now() - 60 * 1000).toISOString(),
          },
          {
            id: 2,
            type: 'Note',
            subject: 'Internal note',
            contactName: null,
            userName: 'Other User',
            occurredAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          },
        ]}
      />,
    );
    expect(screen.getByText('Followed up with Jane')).toBeInTheDocument();
    expect(screen.getByText(/Test User/)).toBeInTheDocument();
    expect(screen.getByText(/Jane Doe/)).toBeInTheDocument();
    expect(screen.getByText('Internal note')).toBeInTheDocument();
    expect(screen.getByText(/Other User/)).toBeInTheDocument();
    // contactName falsy branch: the second activity should not render a contact name
    const otherUserCell = screen.getByText(/Other User/);
    expect(otherUserCell.textContent).not.toContain('·');
  });
});
