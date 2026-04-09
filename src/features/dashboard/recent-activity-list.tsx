import type { RecentActivity } from '@core/models/dashboard';
import { ActivityIcon } from '@shared/components/activity-icon';
import { formatRelativeTime } from '@shared/utils/format-relative-time';

interface RecentActivityListProps {
  activities: RecentActivity[];
}

export function RecentActivityList({ activities }: RecentActivityListProps) {
  return (
    <div className="bg-white border border-sr-border rounded-xl shadow-sm p-5">
      <h3 className="text-base font-semibold text-sr-text mb-4">
        Recent Activity
      </h3>
      {activities.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-6">
          No recent activity
        </p>
      ) : (
        <div className="divide-y divide-gray-100">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center gap-3 py-2.5"
            >
              <ActivityIcon type={activity.type} />
              <div className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-sr-text truncate">
                  {activity.subject}
                </span>
                <span className="block text-xs text-gray-400">
                  {activity.userName}
                  {activity.contactName && ` · ${activity.contactName}`}
                </span>
              </div>
              <span className="text-xs text-gray-400 shrink-0">
                {formatRelativeTime(activity.occurredAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
