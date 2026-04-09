import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon = Inbox,
  title = 'No data',
  message = 'Nothing to show here yet.',
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <Icon className="h-12 w-12 text-gray-300 mb-4" />
      <h3 className="text-lg font-semibold text-sr-text mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-[400px]">{message}</p>
      {actionLabel && (
        <Button
          onClick={onAction}
          className="bg-sr-primary hover:bg-sr-primary-dark"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
