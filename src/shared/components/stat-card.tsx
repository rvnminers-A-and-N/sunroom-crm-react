import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  iconBg?: string;
  iconColor?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  iconBg = 'bg-sr-primary/10',
  iconColor = 'text-sr-primary',
}: StatCardProps) {
  return (
    <div className="bg-white border border-sr-border rounded-xl shadow-sm flex items-center gap-4 p-5">
      <div
        className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
          iconBg,
        )}
      >
        <Icon className={cn('h-5 w-5', iconColor)} />
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold text-sr-text leading-tight">
          {value}
        </span>
        <span className="text-[13px] text-gray-500 mt-0.5">{label}</span>
      </div>
    </div>
  );
}
