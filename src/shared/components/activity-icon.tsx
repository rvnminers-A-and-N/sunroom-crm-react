import {
  StickyNote,
  Phone,
  Mail,
  CalendarDays,
  CheckSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<
  string,
  { icon: React.ElementType; bg: string; color: string }
> = {
  Note: { icon: StickyNote, bg: 'bg-sr-info/10', color: 'text-sr-info' },
  Call: { icon: Phone, bg: 'bg-sr-primary/10', color: 'text-sr-primary' },
  Email: { icon: Mail, bg: 'bg-sr-orange/10', color: 'text-sr-orange' },
  Meeting: {
    icon: CalendarDays,
    bg: 'bg-sr-coral/10',
    color: 'text-sr-coral',
  },
  Task: { icon: CheckSquare, bg: 'bg-sr-gold/10', color: 'text-sr-gold' },
};

interface ActivityIconProps {
  type: string;
  className?: string;
}

export function ActivityIcon({ type, className }: ActivityIconProps) {
  const config = iconMap[type] ?? iconMap.Note;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
        config.bg,
        className,
      )}
    >
      <Icon className={cn('h-4 w-4', config.color)} />
    </div>
  );
}
