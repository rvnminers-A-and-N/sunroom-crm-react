import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@shared/components/page-header';
import { EmptyState } from '@shared/components/empty-state';
import { ConfirmDialog } from '@shared/components/confirm-dialog';
import { ActivityIcon } from '@shared/components/activity-icon';
import { ActivityFormDialog } from './activity-form-dialog';
import {
  useActivities,
  useDeleteActivity,
} from '@core/hooks/use-activities';
import type { Activity, ActivityType } from '@core/models/activity';

const TYPES: ActivityType[] = ['Note', 'Call', 'Email', 'Meeting', 'Task'];

export default function ActivityListPage() {
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [editActivity, setEditActivity] = useState<Activity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null);

  const { data, isLoading } = useActivities({
    page,
    perPage,
    type: typeFilter || undefined,
  });
  const deleteActivity = useDeleteActivity();

  const activities = data?.data ?? [];
  const meta = data?.meta ?? {
    currentPage: 1,
    perPage: 10,
    total: 0,
    lastPage: 1,
  };

  function openCreate() {
    setEditActivity(null);
    setFormOpen(true);
  }

  function openEdit(activity: Activity, e: React.MouseEvent) {
    e.stopPropagation();
    setEditActivity(activity);
    setFormOpen(true);
  }

  function openDelete(activity: Activity, e: React.MouseEvent) {
    e.stopPropagation();
    setDeleteTarget(activity);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteActivity.mutate(deleteTarget.id, {
      onSuccess: () => toast.success('Activity deleted'),
    });
  }

  return (
    <div>
      <PageHeader
        title="Activities"
        subtitle={`${meta.total} total`}
        actionLabel="Log Activity"
        onAction={openCreate}
      />

      <div className="mb-4">
        <Select
          value={typeFilter || 'all'}
          onValueChange={(v) => {
            setTypeFilter(v === 'all' ? '' : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <ActivityTableSkeleton />
      ) : activities.length > 0 ? (
        <>
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Contact
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">Deal</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ActivityIcon type={activity.type} />
                        <span className="text-sm hidden sm:inline">
                          {activity.type}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium text-sm">
                          {activity.subject}
                        </span>
                        {activity.aiSummary && (
                          <Badge
                            variant="secondary"
                            className="ml-2 text-xs"
                          >
                            AI Summary
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {activity.contactId ? (
                        <Link
                          to={`/contacts/${activity.contactId}`}
                          className="text-sr-primary hover:underline text-sm"
                        >
                          {activity.contactName}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {activity.dealId ? (
                        <Link
                          to={`/deals/${activity.dealId}`}
                          className="text-sr-primary hover:underline text-sm"
                        >
                          {activity.dealTitle}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {new Date(activity.occurredAt).toLocaleDateString(
                        'en-US',
                        {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        },
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => openEdit(activity, e)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => openDelete(activity, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {meta.lastPage > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {(meta.currentPage - 1) * meta.perPage + 1}–
                {Math.min(meta.currentPage * meta.perPage, meta.total)} of{' '}
                {meta.total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.currentPage <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.currentPage >= meta.lastPage}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="No activities yet"
          message="Log your first activity to start tracking interactions."
          actionLabel="Log Activity"
          onAction={openCreate}
        />
      )}

      <ActivityFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        activity={editActivity}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Activity"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.subject}"?`
            : ''
        }
      />
    </div>
  );
}

function ActivityTableSkeleton() {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead className="hidden md:table-cell">Contact</TableHead>
            <TableHead className="hidden lg:table-cell">Deal</TableHead>
            <TableHead className="hidden sm:table-cell">Date</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-8 w-8 rounded-lg" /></TableCell>
              <TableCell><Skeleton className="h-5 w-40" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-28" /></TableCell>
              <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
              <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
