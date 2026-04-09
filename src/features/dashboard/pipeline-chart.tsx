import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { DealStageCount } from '@core/models/dashboard';

const STAGE_COLORS: Record<string, string> = {
  Lead: '#F4C95D',
  Qualified: '#F9A66C',
  Proposal: '#F76C6C',
  Negotiation: '#3B82F6',
  Won: '#02795F',
  Lost: '#9CA3AF',
};

interface PipelineChartProps {
  stages: DealStageCount[];
}

export function PipelineChart({ stages }: PipelineChartProps) {
  return (
    <div className="bg-white border border-sr-border rounded-xl shadow-sm p-5">
      <h3 className="text-base font-semibold text-sr-text mb-4">
        Pipeline by Stage
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={stages}>
          <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
          <YAxis
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(v) => [`$${(Number(v) / 1000).toFixed(0)}K`, 'Value']}
          />
          <Bar dataKey="totalValue" radius={[6, 6, 0, 0]} barSize={32}>
            {stages.map((s) => (
              <Cell
                key={s.stage}
                fill={STAGE_COLORS[s.stage] ?? '#9CA3AF'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
