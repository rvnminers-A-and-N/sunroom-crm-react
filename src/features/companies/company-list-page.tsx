import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
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
import { CompanyFormDialog } from './company-form-dialog';
import { useCompanies, useDeleteCompany } from '@core/hooks/use-companies';
import { useDebounce } from '@core/hooks/use-debounce';
import type { Company } from '@core/models/company';

export default function CompanyListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useCompanies({
    page,
    perPage,
    search: debouncedSearch || undefined,
  });
  const deleteCompany = useDeleteCompany();

  const companies = data?.data ?? [];
  const meta = data?.meta ?? {
    currentPage: 1,
    perPage: 10,
    total: 0,
    lastPage: 1,
  };

  const handleRowClick = useCallback(
    (company: Company) => navigate(`/companies/${company.id}`),
    [navigate],
  );

  function openCreate() {
    setEditCompany(null);
    setFormOpen(true);
  }

  function openEdit(company: Company, e: React.MouseEvent) {
    e.stopPropagation();
    setEditCompany(company);
    setFormOpen(true);
  }

  function openDelete(company: Company, e: React.MouseEvent) {
    e.stopPropagation();
    setDeleteTarget(company);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteCompany.mutate(deleteTarget.id, {
      onSuccess: () => toast.success('Company deleted'),
    });
  }

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  return (
    <div>
      <PageHeader
        title="Companies"
        subtitle={`${meta.total} total`}
        actionLabel="Add Company"
        onAction={openCreate}
      />

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <CompanyTableSkeleton />
      ) : companies.length > 0 ? (
        <>
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Industry
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Location
                  </TableHead>
                  <TableHead className="hidden sm:table-cell text-center">
                    Contacts
                  </TableHead>
                  <TableHead className="hidden sm:table-cell text-center">
                    Deals
                  </TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow
                    key={company.id}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(company)}
                  >
                    <TableCell className="font-medium">
                      {company.name}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {company.industry || '—'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {company.city || company.state
                        ? `${company.city ?? ''}${company.city && company.state ? ', ' : ''}${company.state ?? ''}`
                        : '—'}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-center">
                      {company.contactCount}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-center">
                      {company.dealCount}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => openEdit(company, e)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => openDelete(company, e)}
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
          icon={Building2}
          title="No companies yet"
          message="Add your first company to get started."
          actionLabel="Add Company"
          onAction={openCreate}
        />
      )}

      <CompanyFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        company={editCompany}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Company"
        message={
          deleteTarget
            ? `Are you sure you want to delete ${deleteTarget.name}?`
            : ''
        }
      />
    </div>
  );
}

function CompanyTableSkeleton() {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="hidden md:table-cell">Industry</TableHead>
            <TableHead className="hidden lg:table-cell">Location</TableHead>
            <TableHead className="hidden sm:table-cell text-center">Contacts</TableHead>
            <TableHead className="hidden sm:table-cell text-center">Deals</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-5 w-32" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
              <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-28" /></TableCell>
              <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-8 mx-auto" /></TableCell>
              <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-8 mx-auto" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
