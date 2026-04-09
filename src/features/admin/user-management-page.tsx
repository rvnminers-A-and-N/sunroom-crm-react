import { useState } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
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
import { ConfirmDialog } from '@shared/components/confirm-dialog';
import { useUsers, useUpdateUser, useDeleteUser } from '@core/hooks/use-users';
import { formatInitials } from '@shared/utils/format-initials';
import type { User } from '@core/models/user';

const ROLES = ['User', 'Admin'];

export default function UserManagementPage() {
  const { data: users, isLoading } = useUsers();
  const deleteUser = useDeleteUser();
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  function handleDelete() {
    if (!deleteTarget) return;
    deleteUser.mutate(deleteTarget.id, {
      onSuccess: () => toast.success('User deleted'),
    });
  }

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Manage user accounts and roles (Admin only)"
      />

      {isLoading ? (
        <UserTableSkeleton />
      ) : users && users.length > 0 ? (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden md:table-cell">Joined</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onDelete={() => setDeleteTarget(user)}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-12">
          No users found.
        </p>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={
          deleteTarget
            ? `Are you sure you want to delete ${deleteTarget.name}? This action cannot be undone.`
            : ''
        }
      />
    </div>
  );
}

function UserRow({
  user,
  onDelete,
}: {
  user: User;
  onDelete: () => void;
}) {
  const updateUser = useUpdateUser(user.id);

  function handleRoleChange(role: string) {
    updateUser.mutate(
      { role },
      {
        onSuccess: () => toast.success(`${user.name} updated to ${role}`),
      },
    );
  }

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sr-primary to-sr-coral flex items-center justify-center text-white text-xs font-bold shrink-0">
            {formatInitials(user.name)}
          </div>
          <span className="font-medium">{user.name}</span>
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell text-muted-foreground">
        {user.email}
      </TableCell>
      <TableCell>
        <Select value={user.role} onValueChange={handleRoleChange}>
          <SelectTrigger className="w-[100px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
        {new Date(user.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function UserTableSkeleton() {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="hidden sm:table-cell">Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="hidden md:table-cell">Joined</TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 4 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-5 w-28" />
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-40" /></TableCell>
              <TableCell><Skeleton className="h-8 w-[100px]" /></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
              <TableCell><Skeleton className="h-8 w-8" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
