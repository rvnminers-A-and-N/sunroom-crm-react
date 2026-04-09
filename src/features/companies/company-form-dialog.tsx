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
  useCreateCompany,
  useUpdateCompany,
} from '@core/hooks/use-companies';
import type { Company } from '@core/models/company';
import { toast } from 'sonner';

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  industry: z.string().optional(),
  website: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  notes: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

interface CompanyFormDialogProps {
  open: boolean;
  onClose: () => void;
  company?: Company | null;
}

export function CompanyFormDialog({
  open,
  onClose,
  company,
}: CompanyFormDialogProps) {
  const isEdit = !!company;
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany(company?.id ?? 0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      industry: '',
      website: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: company?.name ?? '',
        industry: company?.industry ?? '',
        website: company?.website ?? '',
        phone: company?.phone ?? '',
        address: '',
        city: company?.city ?? '',
        state: company?.state ?? '',
        zip: '',
        notes: '',
      });
    }
  }, [open, company, reset]);

  const saving = createCompany.isPending || updateCompany.isPending;

  function onSubmit(data: CompanyFormData) {
    const payload = {
      name: data.name,
      industry: data.industry || undefined,
      website: data.website || undefined,
      phone: data.phone || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      zip: data.zip || undefined,
      notes: data.notes || undefined,
    };

    if (isEdit) {
      updateCompany.mutate(payload, {
        onSuccess: () => {
          toast.success('Company updated');
          onClose();
        },
      });
    } else {
      createCompany.mutate(payload, {
        onSuccess: () => {
          toast.success('Company created');
          onClose();
        },
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Company' : 'New Company'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the company details below.'
              : 'Fill in the details to create a new company.'}
          </DialogDescription>
        </DialogHeader>

        <form
          id="company-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Company Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Acme Corp"
            />
            {errors.name && (
              <p className="text-xs text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              {...register('industry')}
              placeholder="Technology"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              {...register('website')}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comp-phone">Phone</Label>
            <Input
              id="comp-phone"
              {...register('phone')}
              placeholder="(555) 123-4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              {...register('address')}
              placeholder="123 Main St"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register('city')} placeholder="Austin" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" {...register('state')} placeholder="TX" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP</Label>
              <Input id="zip" {...register('zip')} placeholder="78701" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comp-notes">Notes</Label>
            <Textarea
              id="comp-notes"
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
            form="company-form"
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
