import { useState } from 'react';
import { Pencil, Trash2, Check, X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@shared/components/page-header';
import { ConfirmDialog } from '@shared/components/confirm-dialog';
import { useCurrentUser } from '@core/hooks/use-auth';
import { useTags, useCreateTag, useDeleteTag, useUpdateTag } from '@core/hooks/use-tags';
import { formatInitials } from '@shared/utils/format-initials';
import type { Tag } from '@core/models/tag';

export default function ProfilePage() {
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: tags, isLoading: tagsLoading } = useTags();
  const createTag = useCreateTag();
  const deleteTagMutation = useDeleteTag();

  // Create tag form
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#02795f');

  // Edit tag state
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null);

  function handleCreateTag() {
    if (!newTagName.trim()) return;
    createTag.mutate(
      { name: newTagName.trim(), color: newTagColor },
      {
        onSuccess: () => {
          toast.success('Tag created');
          setNewTagName('');
          setNewTagColor('#02795f');
        },
      },
    );
  }

  function startEdit(tag: Tag) {
    setEditingTag(tag);
    setEditName(tag.name);
    setEditColor(tag.color);
  }

  function handleDeleteTag() {
    if (!deleteTarget) return;
    deleteTagMutation.mutate(deleteTarget.id, {
      onSuccess: () => toast.success('Tag deleted'),
    });
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Profile and tag management" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Card */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Profile</h3>
            {userLoading ? (
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ) : user ? (
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-sr-primary to-sr-coral flex items-center justify-center text-white text-xl font-bold">
                  {formatInitials(user.name)}
                </div>
                <div>
                  <p className="font-semibold text-lg">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <span className="inline-flex items-center rounded-full bg-sr-primary/10 text-sr-primary px-2 py-0.5 text-xs font-medium mt-1">
                    {user.role}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    Member since{' '}
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Tag Management */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-1">Tags</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Manage tags used to organize your contacts.
            </p>

            {/* Create Tag Form */}
            <div className="flex items-center gap-2 mb-4">
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name, e.g. VIP"
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
              />
              <input
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="h-9 w-9 rounded border cursor-pointer"
                title="Tag color"
              />
              <Button
                size="sm"
                onClick={handleCreateTag}
                disabled={!newTagName.trim() || createTag.isPending}
                className="bg-sr-primary hover:bg-sr-primary-dark"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            {/* Tag List */}
            {tagsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : tags && tags.length > 0 ? (
              <div className="space-y-2">
                {tags.map((tag) =>
                  editingTag?.id === tag.id ? (
                    <EditTagRow
                      key={tag.id}
                      tagId={tag.id}
                      name={editName}
                      color={editColor}
                      onNameChange={setEditName}
                      onColorChange={setEditColor}
                      onSave={() => setEditingTag(null)}
                      onCancel={() => setEditingTag(null)}
                    />
                  ) : (
                    <div
                      key={tag.id}
                      className="flex items-center justify-between rounded-lg border px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="text-sm font-medium">{tag.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => startEdit(tag)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(tag)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tags created yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteTag}
        title="Delete Tag"
        message={
          deleteTarget
            ? `Are you sure you want to delete the tag "${deleteTarget.name}"?`
            : ''
        }
      />
    </div>
  );
}

function EditTagRow({
  tagId,
  name,
  color,
  onNameChange,
  onColorChange,
  onSave,
  onCancel,
}: {
  tagId: number;
  name: string;
  color: string;
  onNameChange: (v: string) => void;
  onColorChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const updateTag = useUpdateTag(tagId);

  function handleSave() {
    if (!name.trim()) return;
    updateTag.mutate(
      { name: name.trim(), color },
      {
        onSuccess: () => {
          toast.success('Tag updated');
          onSave();
        },
      },
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
      <Input
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        className="flex-1 h-7 text-sm"
        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
      />
      <input
        type="color"
        value={color}
        onChange={(e) => onColorChange(e.target.value)}
        className="h-7 w-7 rounded border cursor-pointer"
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-sr-primary"
        onClick={handleSave}
      >
        <Check className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={onCancel}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
