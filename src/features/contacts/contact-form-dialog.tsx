import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateContact, useUpdateContact } from '@core/hooks/use-contacts';
import { useCompanies } from '@core/hooks/use-companies';
import { useTags } from '@core/hooks/use-tags';
import type { Contact } from '@core/models/contact';
import { toast } from 'sonner';

const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  phone: z.string().optional(),
  title: z.string().optional(),
  notes: z.string().optional(),
  companyId: z.number().nullable().optional(),
  tagIds: z.array(z.number()).optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactFormDialogProps {
  open: boolean;
  onClose: () => void;
  contact?: Contact | null;
}

export function ContactFormDialog({
  open,
  onClose,
  contact,
}: ContactFormDialogProps) {
  const isEdit = !!contact;
  const createContact = useCreateContact();
  const updateContact = useUpdateContact(contact?.id ?? 0);
  const { data: companiesData } = useCompanies({
    page: 1,
    perPage: 100,
  });
  const { data: tags } = useTags();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      title: '',
      notes: '',
      companyId: null,
      tagIds: [],
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        firstName: contact?.firstName ?? '',
        lastName: contact?.lastName ?? '',
        email: contact?.email ?? '',
        phone: contact?.phone ?? '',
        title: contact?.title ?? '',
        notes: '',
        companyId: contact?.companyId ?? null,
        tagIds: contact?.tags?.map((t) => t.id) ?? [],
      });
    }
  }, [open, contact, reset]);

  const saving = createContact.isPending || updateContact.isPending;
  const selectedCompanyId = watch('companyId');
  const selectedTagIds = watch('tagIds') ?? [];

  function onSubmit(data: ContactFormData) {
    if (isEdit) {
      const { tagIds: _tagIds, ...updateData } = data;
      updateContact.mutate(
        {
          firstName: updateData.firstName,
          lastName: updateData.lastName,
          email: updateData.email || undefined,
          phone: updateData.phone || undefined,
          title: updateData.title || undefined,
          notes: updateData.notes || undefined,
          companyId: updateData.companyId ?? undefined,
        },
        {
          onSuccess: () => {
            toast.success('Contact updated');
            onClose();
          },
        },
      );
    } else {
      createContact.mutate(
        {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email || undefined,
          phone: data.phone || undefined,
          title: data.title || undefined,
          notes: data.notes || undefined,
          companyId: data.companyId ?? undefined,
          tagIds:
            data.tagIds && data.tagIds.length > 0 ? data.tagIds : undefined,
        },
        {
          onSuccess: () => {
            toast.success('Contact created');
            onClose();
          },
        },
      );
    }
  }

  function toggleTag(tagId: number) {
    const current = selectedTagIds;
    if (current.includes(tagId)) {
      setValue(
        'tagIds',
        current.filter((id) => id !== tagId),
      );
    } else {
      setValue('tagIds', [...current, tagId]);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Contact' : 'New Contact'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the contact details below.'
              : 'Fill in the details to create a new contact.'}
          </DialogDescription>
        </DialogHeader>

        <form
          id="contact-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                {...register('firstName')}
                placeholder="John"
              />
              {errors.firstName && (
                <p className="text-xs text-destructive">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                {...register('lastName')}
                placeholder="Doe"
              />
              {errors.lastName && (
                <p className="text-xs text-destructive">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="john@example.com"
            />
            {errors.email && (
              <p className="text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              {...register('phone')}
              placeholder="(555) 123-4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Sales Manager"
            />
          </div>

          <div className="space-y-2">
            <Label>Company</Label>
            <Select
              value={selectedCompanyId?.toString() ?? 'none'}
              onValueChange={(v) =>
                setValue('companyId', v === 'none' ? null : Number(v))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {companiesData?.data.map((company) => (
                  <SelectItem key={company.id} value={company.id.toString()}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isEdit && tags && tags.length > 0 && (
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selectedTagIds.includes(tag.id)
                        ? 'bg-sr-primary text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="contact-form"
            disabled={saving}
            className="bg-sr-primary hover:bg-sr-primary-dark"
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEdit ? 'Save' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
