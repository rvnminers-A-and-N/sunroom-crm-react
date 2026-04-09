import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  Handshake,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { useDashboard } from '@core/hooks/use-dashboard';
import { formatCurrencyShort } from '@shared/utils/format-currency';
import { StatCard } from '@shared/components/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { PipelineChart } from './pipeline-chart';
import { RecentActivityList } from './recent-activity-list';

function DashboardSkeleton() {
  return (
    <div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-[340px] rounded-xl" />
        <Skeleton className="h-[340px] rounded-xl" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();

  if (isLoading) return <DashboardSkeleton />;

  if (!data) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-sr-text mb-6">Dashboard</h1>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4 mb-6">
        <Link
          to="/contacts"
          className="no-underline text-inherit transition-transform hover:-translate-y-0.5"
        >
          <StatCard
            icon={Users}
            label="Total Contacts"
            value={data.totalContacts}
          />
        </Link>
        <Link
          to="/companies"
          className="no-underline text-inherit transition-transform hover:-translate-y-0.5"
        >
          <StatCard
            icon={Building2}
            label="Total Companies"
            value={data.totalCompanies}
            iconBg="bg-sr-info/10"
            iconColor="text-sr-info"
          />
        </Link>
        <Link
          to="/deals"
          className="no-underline text-inherit transition-transform hover:-translate-y-0.5"
        >
          <StatCard
            icon={Handshake}
            label="Active Deals"
            value={data.totalDeals}
            iconBg="bg-sr-orange/10"
            iconColor="text-sr-orange"
          />
        </Link>
        <StatCard
          icon={TrendingUp}
          label="Pipeline Value"
          value={formatCurrencyShort(data.totalPipelineValue)}
          iconBg="bg-sr-gold/10"
          iconColor="text-sr-gold"
        />
        <StatCard
          icon={Trophy}
          label="Won Revenue"
          value={formatCurrencyShort(data.wonRevenue)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PipelineChart stages={data.dealsByStage} />
        <RecentActivityList activities={data.recentActivities} />
      </div>
    </div>
  );
}
