import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Users } from 'lucide-react';
import { StatCard } from './stat-card';

describe('StatCard', () => {
  it('renders label and string value', () => {
    render(<StatCard icon={Users} label="Customers" value="42" />);
    expect(screen.getByText('Customers')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders numeric value', () => {
    render(<StatCard icon={Users} label="Customers" value={100} />);
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('renders icon', () => {
    const { container } = render(<StatCard icon={Users} label="Customers" value="1" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('uses default iconBg and iconColor when not provided', () => {
    const { container } = render(<StatCard icon={Users} label="Customers" value="1" />);
    const wrapper = container.querySelector('.bg-sr-primary\\/10');
    expect(wrapper).toBeInTheDocument();
  });

  it('uses custom iconBg and iconColor when provided', () => {
    const { container } = render(
      <StatCard
        icon={Users}
        label="Customers"
        value="1"
        iconBg="bg-red-100"
        iconColor="text-red-500"
      />,
    );
    const wrapper = container.querySelector('.bg-red-100');
    expect(wrapper).toBeInTheDocument();
  });
});
