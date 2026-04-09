import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Globe,
  Phone,
  MapPin,
  Calendar,
  Pencil,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@shared/components/confirm-dialog';
import { CompanyFormDialog } from './company-form-dialog';
import { useCompany, useDeleteCompany } from '@core/hooks/use-companies';
import { formatCurrencyShort } from '@shared/utils/format-currency';

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const companyId = Number(id);
  const { data: company, isLoading } = useCompany(companyId);
  const deleteCompany = useDeleteCompany();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  function handleDelete() {
    deleteCompany.mutate(companyId, {
      onSuccess: () => {
        toast.success('Company deleted');
        navigate('/companies');
      },
    });
  }

  if (isLoading) return <CompanyDetailSkeleton />;
  if (!company) return null;

  const location = [company.address, company.city, company.state, company.zip]
    .filter(Boolean)
    .join(', ');

  return (
    <div>
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/companies')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-sr-text">{company.name}</h1>
          {company.industry && (
            <p className="text-sm text-muted-foreground mt-1">
              {company.industry}
            </p>
          )}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Card */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6 space-y-4">
            {company.website && (
              <div className="flex items-center gap-3 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sr-primary hover:underline truncate"
                >
                  {company.website}
                </a>
              </div>
            )}
            {company.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{company.phone}</span>
              </div>
            )}
            {location && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{location}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>
                Added{' '}
                {new Date(company.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            {company.notes && (
              <div className="pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Notes
                </p>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {company.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contacts & Deals Tables */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contacts Table */}
          <div className="rounded-lg border bg-card">
            <div className="px-4 py-3 border-b">
              <h3 className="font-semibold text-sm">
                Contacts ({company.contacts.length})
              </h3>
            </div>
            {company.contacts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Email
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Title
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {company.contacts.map((ct) => (
                    <TableRow key={ct.id}>
                      <TableCell>
                        <Link
                          to={`/contacts/${ct.id}`}
                          className="text-sr-primary hover:underline font-medium"
                        >
                          {ct.firstName} {ct.lastName}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {ct.email || '—'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {ct.title || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                No contacts at this company
              </p>
            )}
          </div>

          {/* Deals Table */}
          <div className="rounded-lg border bg-card">
            <div className="px-4 py-3 border-b">
              <h3 className="font-semibold text-sm">
                Deals ({company.deals.length})
              </h3>
            </div>
            {company.deals.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Stage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {company.deals.map((deal) => (
                    <TableRow key={deal.id}>
                      <TableCell>
                        <Link
                          to={`/deals/${deal.id}`}
                          className="text-sr-primary hover:underline font-medium"
                        >
                          {deal.title}
                        </Link>
                      </TableCell>
                      <TableCell>{formatCurrencyShort(deal.value)}</TableCell>
                      <TableCell>
                        <StageBadge stage={deal.stage} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                No deals with this company
              </p>
            )}
          </div>
        </div>
      </div>

      <CompanyFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        company={company as any}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Company"
        message={`Are you sure you want to delete ${company.name}? This will not delete associated contacts.`}
      />
    </div>
  );
}

const stageColors: Record<string, string> = {
  Lead: 'bg-sr-gold/10 text-sr-gold',
  Qualified: 'bg-sr-orange/10 text-sr-orange',
  Proposal: 'bg-sr-coral/10 text-sr-coral',
  Negotiation: 'bg-sr-info/10 text-sr-info',
  Won: 'bg-sr-primary/10 text-sr-primary',
  Lost: 'bg-gray-100 text-gray-500',
};

function StageBadge({ stage }: { stage: string }) {
  const color = stageColors[stage] ?? 'bg-muted text-muted-foreground';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}
    >
      {stage}
    </span>
  );
}

function CompanyDetailSkeleton() {
  return (
    <div>
      <div className="flex items-start gap-4 mb-6">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="flex-1">
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </CardContent>
        </Card>
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
