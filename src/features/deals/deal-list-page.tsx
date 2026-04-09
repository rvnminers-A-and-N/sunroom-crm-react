import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Handshake, Pencil, Trash2, List, Columns3 } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
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
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@shared/components/page-header';
import { EmptyState } from '@shared/components/empty-state';
import { ConfirmDialog } from '@shared/components/confirm-dialog';
import { DealFormDialog } from './deal-form-dialog';
import { useDeals, useDeleteDeal } from '@core/hooks/use-deals';
import { useDebounce } from '@core/hooks/use-debounce';
import { formatCurrencyShort } from '@shared/utils/format-currency';
import type { Deal, DealStage } from '@core/models/deal';

const STAGES: DealStage[] = [
  'Lead',
  'Qualified',
  'Proposal',
  'Negotiation',
  'Won',
  'Lost',
];

const stageColors: Record<string, string> = {
  Lead: 'bg-sr-gold/10 text-sr-gold',
  Qualified: 'bg-sr-orange/10 text-sr-orange',
  Proposal: 'bg-sr-coral/10 text-sr-coral',
  Negotiation: 'bg-sr-info/10 text-sr-info',
  Won: 'bg-sr-primary/10 text-sr-primary',
  Lost: 'bg-gray-100 text-gray-500',
};

export default function DealListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [editDeal, setEditDeal] = useState<Deal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Deal | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useDeals({
    page,
    perPage,
    search: debouncedSearch || undefined,
    stage: stageFilter || undefined,
  });
  const deleteDeal = useDeleteDeal();

  const deals = data?.data ?? [];
  const meta = data?.meta ?? {
    currentPage: 1,
    perPage: 10,
    total: 0,
    lastPage: 1,
  };

  const handleRowClick = useCallback(
    (deal: Deal) => navigate(`/deals/${deal.id}`),
    [navigate],
  );

  function openCreate() {
    setEditDeal(null);
    setFormOpen(true);
  }

  function openEdit(deal: Deal, e: React.MouseEvent) {
    e.stopPropagation();
    setEditDeal(deal);
    setFormOpen(true);
  }

  function openDelete(deal: Deal, e: React.MouseEvent) {
    e.stopPropagation();
    setDeleteTarget(deal);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteDeal.mutate(deleteTarget.id, {
      onSuccess: () => toast.success('Deal deleted'),
    });
  }

  return (
    <div>
      <PageHeader
        title="Deals"
        subtitle={`${meta.total} total`}
        actionLabel="Add Deal"
        onAction={openCreate}
      />

      {/* View Toggle */}
      <div className="flex gap-2 mb-4">
        <Button variant="default" size="sm" className="bg-sr-primary">
          <List className="h-4 w-4 mr-1" /> List
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to="/deals/pipeline">
            <Columns3 className="h-4 w-4 mr-1" /> Pipeline
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search deals..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={stageFilter || 'all'}
          onValueChange={(v) => {
            setStageFilter(v === 'all' ? '' : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {STAGES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <DealTableSkeleton />
      ) : deals.length > 0 ? (
        <>
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Contact
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Company
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Expected Close
                  </TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deals.map((deal) => (
                  <TableRow
                    key={deal.id}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(deal)}
                  >
                    <TableCell className="font-medium">{deal.title}</TableCell>
                    <TableCell>{formatCurrencyShort(deal.value)}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${stageColors[deal.stage] ?? 'bg-muted text-muted-foreground'}`}
                      >
                        {deal.stage}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {deal.contactName}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {deal.companyName || '—'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {deal.expectedCloseDate
                        ? new Date(deal.expectedCloseDate).toLocaleDateString(
                            'en-US',
                            {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            },
                          )
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => openEdit(deal, e)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => openDelete(deal, e)}
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
          icon={Handshake}
          title="No deals yet"
          message="Create your first deal to start tracking your pipeline."
          actionLabel="Add Deal"
          onAction={openCreate}
        />
      )}

      <DealFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        deal={editDeal}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Deal"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.title}"?`
            : ''
        }
      />
    </div>
  );
}

function DealTableSkeleton() {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead className="hidden md:table-cell">Contact</TableHead>
            <TableHead className="hidden lg:table-cell">Company</TableHead>
            <TableHead className="hidden lg:table-cell">Expected Close</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-5 w-32" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
              <TableCell><Skeleton className="h-5 w-20" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-28" /></TableCell>
              <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
              <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
