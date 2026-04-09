import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Building2,
  CalendarDays,
  CheckCircle,
  Calendar,
  Pencil,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ActivityIcon } from '@shared/components/activity-icon';
import { ConfirmDialog } from '@shared/components/confirm-dialog';
import { DealFormDialog } from './deal-form-dialog';
import { useDeal, useDeleteDeal } from '@core/hooks/use-deals';
import { formatRelativeTime } from '@shared/utils/format-relative-time';
import { formatCurrencyShort } from '@shared/utils/format-currency';
import type { DealStage } from '@core/models/deal';

const ALL_STAGES: DealStage[] = [
  'Lead',
  'Qualified',
  'Proposal',
  'Negotiation',
  'Won',
  'Lost',
];

const stageColors: Record<string, string> = {
  Lead: 'bg-sr-gold/10 text-sr-gold border-sr-gold',
  Qualified: 'bg-sr-orange/10 text-sr-orange border-sr-orange',
  Proposal: 'bg-sr-coral/10 text-sr-coral border-sr-coral',
  Negotiation: 'bg-sr-info/10 text-sr-info border-sr-info',
  Won: 'bg-sr-primary/10 text-sr-primary border-sr-primary',
  Lost: 'bg-gray-100 text-gray-500 border-gray-400',
};

export default function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dealId = Number(id);
  const { data: deal, isLoading } = useDeal(dealId);
  const deleteDeal = useDeleteDeal();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  function handleDelete() {
    deleteDeal.mutate(dealId, {
      onSuccess: () => {
        toast.success('Deal deleted');
        navigate('/deals');
      },
    });
  }

  if (isLoading) return <DealDetailSkeleton />;
  if (!deal) return null;

  const currentStageIndex = ALL_STAGES.indexOf(deal.stage as DealStage);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/deals')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-sr-text">{deal.title}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${stageColors[deal.stage] ?? 'bg-muted text-muted-foreground'}`}
            >
              {deal.stage}
            </span>
            <span className="text-lg font-semibold text-sr-text">
              {formatCurrencyShort(deal.value)}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setFormOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Stage Stepper */}
      <div className="rounded-lg border bg-card p-4 mb-6">
        <div className="flex items-center gap-1">
          {ALL_STAGES.map((stage, i) => (
            <div key={stage} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-full h-2 rounded-full ${
                    i <= currentStageIndex
                      ? stage === 'Lost'
                        ? 'bg-gray-400'
                        : 'bg-sr-primary'
                      : 'bg-muted'
                  }`}
                />
                <span
                  className={`text-xs mt-1 ${
                    i <= currentStageIndex
                      ? 'font-medium text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {stage}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Card */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <Link
                to={`/contacts/${deal.contactId}`}
                className="text-sr-primary hover:underline"
              >
                {deal.contactName}
              </Link>
            </div>
            {deal.companyName && (
              <div className="flex items-center gap-3 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <Link
                  to={`/companies/${deal.companyId}`}
                  className="text-sr-primary hover:underline"
                >
                  {deal.companyName}
                </Link>
              </div>
            )}
            {deal.expectedCloseDate && (
              <div className="flex items-center gap-3 text-sm">
                <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>
                  Expected close:{' '}
                  {new Date(deal.expectedCloseDate).toLocaleDateString(
                    'en-US',
                    { month: 'short', day: 'numeric', year: 'numeric' },
                  )}
                </span>
              </div>
            )}
            {deal.closedAt && (
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>
                  Closed:{' '}
                  {new Date(deal.closedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>
                Created{' '}
                {new Date(deal.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            {deal.notes && (
              <div className="pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Notes
                </p>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {deal.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activities & Insights */}
        <div className="lg:col-span-2 space-y-6">
          {/* Activities */}
          <div className="rounded-lg border bg-card">
            <div className="px-4 py-3 border-b">
              <h3 className="font-semibold text-sm">
                Activities ({deal.activities.length})
              </h3>
            </div>
            {deal.activities.length > 0 ? (
              <div className="p-4 space-y-3">
                {deal.activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3"
                  >
                    <ActivityIcon type={activity.type} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        {activity.subject}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(activity.occurredAt)}
                      </p>
                      {activity.body && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {activity.body}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                No activities recorded
              </p>
            )}
          </div>

          {/* AI Insights */}
          {deal.insights.length > 0 && (
            <div className="rounded-lg border bg-card">
              <div className="px-4 py-3 border-b flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-sr-gold" />
                <h3 className="font-semibold text-sm">AI Insights</h3>
              </div>
              <div className="p-4 space-y-3">
                {deal.insights.map((insight) => (
                  <div
                    key={insight.id}
                    className="rounded-lg bg-muted/50 p-3"
                  >
                    <p className="text-sm">{insight.insight}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(insight.generatedAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <DealFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        deal={deal as any}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Deal"
        message={`Are you sure you want to delete "${deal.title}"?`}
      />
    </div>
  );
}

function DealDetailSkeleton() {
  return (
    <div>
      <div className="flex items-start gap-4 mb-6">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="flex-1">
          <Skeleton className="h-7 w-48 mb-2" />
          <div className="flex gap-3">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <Skeleton className="h-16 w-full mb-6 rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </CardContent>
        </Card>
        <div className="lg:col-span-2">
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
