import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ActivityIcon } from './activity-icon';

describe('ActivityIcon', () => {
  const types = ['Note', 'Call', 'Email', 'Meeting', 'Task'];

  it.each(types)('renders %s icon', (type) => {
    const { container } = render(<ActivityIcon type={type} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('falls back to Note icon for unknown type', () => {
    const { container } = render(<ActivityIcon type="Unknown" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('applies custom className to wrapper', () => {
    const { container } = render(<ActivityIcon type="Note" className="custom-x" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-x');
  });
});
