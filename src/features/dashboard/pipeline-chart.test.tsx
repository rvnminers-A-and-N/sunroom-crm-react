import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PipelineChart } from './pipeline-chart';

// recharts is hard to render meaningfully under jsdom. Stub the bits we use so
// the inline tickFormatter / Tooltip formatter functions inside PipelineChart
// are actually invoked, giving us full coverage of those lines.
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    BarChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="bar-chart">{children}</div>
    ),
    Bar: ({ children }: { children?: React.ReactNode }) => (
      <div data-testid="bar">{children}</div>
    ),
    Cell: ({ fill }: { fill: string }) => <span data-fill={fill} />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: ({
      tickFormatter,
    }: {
      tickFormatter?: (v: number) => string;
    }) => (
      <div data-testid="y-axis">
        {tickFormatter ? tickFormatter(50000) : null}
      </div>
    ),
    Tooltip: ({
      formatter,
    }: {
      formatter?: (v: number) => [string, string];
    }) => (
      <div data-testid="tooltip">
        {formatter ? formatter(50000).join(' ') : null}
      </div>
    ),
  };
});

describe('PipelineChart', () => {
  const stages = [
    { stage: 'Lead', count: 3, totalValue: 30000 },
    { stage: 'Qualified', count: 2, totalValue: 20000 },
    { stage: 'Proposal', count: 1, totalValue: 10000 },
    { stage: 'Negotiation', count: 1, totalValue: 5000 },
    { stage: 'Won', count: 1, totalValue: 1000 },
    { stage: 'Lost', count: 0, totalValue: 0 },
    // 'Unknown' has no entry in STAGE_COLORS, exercising the `?? '#9CA3AF'` fallback.
    { stage: 'Unknown', count: 0, totalValue: 0 },
  ];

  it('renders the heading and a cell per stage', () => {
    const { container } = render(<PipelineChart stages={stages} />);
    expect(screen.getByText('Pipeline by Stage')).toBeInTheDocument();
    const cells = container.querySelectorAll('[data-fill]');
    expect(cells.length).toBe(stages.length);
    // The 'Unknown' stage should have used the gray fallback colour.
    const fills = Array.from(cells).map((c) => c.getAttribute('data-fill'));
    expect(fills).toContain('#9CA3AF');
  });

  it('formats Y-axis ticks and tooltip values as $K amounts', () => {
    render(<PipelineChart stages={stages} />);
    // Both formatters were invoked by the recharts mocks above and rendered 50.
    expect(screen.getByTestId('y-axis').textContent).toBe('$50K');
    expect(screen.getByTestId('tooltip').textContent).toBe('$50K Value');
  });

  it('renders without errors when given an empty stages array', () => {
    const { container } = render(<PipelineChart stages={[]} />);
    expect(container.firstChild).not.toBeNull();
    expect(screen.getByText('Pipeline by Stage')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-fill]').length).toBe(0);
  });
});
