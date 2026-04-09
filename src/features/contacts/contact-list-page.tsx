import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Pencil, Trash2 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@shared/components/page-header';
import { EmptyState } from '@shared/components/empty-state';
import { ConfirmDialog } from '@shared/components/confirm-dialog';
import { ContactFormDialog } from './contact-form-dialog';
import { useContacts, useDeleteContact } from '@core/hooks/use-contacts';
import { useTags } from '@core/hooks/use-tags';
import { useDebounce } from '@core/hooks/use-debounce';
import type { Contact } from '@core/models/contact';

export default function ContactListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [formOpen, setFormOpen] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useContacts({
    page,
    perPage,
    search: debouncedSearch || undefined,
    tagId: tagFilter ?? undefined,
  });
  const { data: tags } = useTags();
  const deleteContact = useDeleteContact();

  const contacts = data?.data ?? [];
  const meta = data?.meta ?? { currentPage: 1, perPage: 10, total: 0, lastPage: 1 };

  const handleRowClick = useCallback(
    (contact: Contact) => navigate(`/contacts/${contact.id}`),
    [navigate],
  );

  function openCreate() {
    setEditContact(null);
    setFormOpen(true);
  }

  function openEdit(contact: Contact, e: React.MouseEvent) {
    e.stopPropagation();
    setEditContact(contact);
    setFormOpen(true);
  }

  function openDelete(contact: Contact, e: React.MouseEvent) {
    e.stopPropagation();
    setDeleteTarget(contact);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteContact.mutate(deleteTarget.id, {
      onSuccess: () => toast.success('Contact deleted'),
    });
  }

  function handleTagFilter(value: string) {
    setTagFilter(value === 'all' ? null : Number(value));
    setPage(1);
  }

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  return (
    <div>
      <PageHeader
        title="Contacts"
        subtitle={`${meta.total} total`}
        actionLabel="Add Contact"
        onAction={openCreate}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={tagFilter?.toString() ?? 'all'}
          onValueChange={handleTagFilter}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tags</SelectItem>
            {tags?.map((tag) => (
              <SelectItem key={tag.id} value={tag.id.toString()}>
                {tag.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <ContactTableSkeleton />
      ) : contacts.length > 0 ? (
        <>
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden lg:table-cell">Phone</TableHead>
                  <TableHead className="hidden md:table-cell">Company</TableHead>
                  <TableHead className="hidden lg:table-cell">Tags</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow
                    key={contact.id}
                    className="cursor-pointer"
                    onClick={() => handleRowClick(contact)}
                  >
                    <TableCell>
                      <div>
                        <span className="font-medium">
                          {contact.firstName} {contact.lastName}
                        </span>
                        {contact.title && (
                          <span className="block text-xs text-muted-foreground">
                            {contact.title}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {contact.email || '—'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {contact.phone || '—'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {contact.companyName || '—'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex gap-1 flex-wrap">
                        {contact.tags.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => openEdit(contact, e)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => openDelete(contact, e)}
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
          icon={Users}
          title="No contacts yet"
          message="Add your first contact to get started."
          actionLabel="Add Contact"
          onAction={openCreate}
        />
      )}

      <ContactFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        contact={editContact}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Contact"
        message={
          deleteTarget
            ? `Are you sure you want to delete ${deleteTarget.firstName} ${deleteTarget.lastName}?`
            : ''
        }
      />
    </div>
  );
}

function ContactTableSkeleton() {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="hidden md:table-cell">Email</TableHead>
            <TableHead className="hidden lg:table-cell">Phone</TableHead>
            <TableHead className="hidden md:table-cell">Company</TableHead>
            <TableHead className="hidden lg:table-cell">Tags</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-5 w-32" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-40" /></TableCell>
              <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-28" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
              <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-16" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
