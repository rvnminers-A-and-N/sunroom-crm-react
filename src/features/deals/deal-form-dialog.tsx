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
import { useCreateDeal, useUpdateDeal } from '@core/hooks/use-deals';
import { useContacts } from '@core/hooks/use-contacts';
import { useCompanies } from '@core/hooks/use-companies';
import type { Deal, DealStage } from '@core/models/deal';
import { toast } from 'sonner';

const STAGES: DealStage[] = [
  'Lead',
  'Qualified',
  'Proposal',
  'Negotiation',
  'Won',
  'Lost',
];

const dealSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  value: z.coerce.number().min(0, 'Value must be 0 or more'),
  contactId: z.coerce.number().min(1, 'Contact is required'),
  companyId: z.number().nullable().optional(),
  stage: z.string(),
  expectedCloseDate: z.string().optional(),
  notes: z.string().optional(),
});

type DealFormData = z.infer<typeof dealSchema>;

interface DealFormDialogProps {
  open: boolean;
  onClose: () => void;
  deal?: Deal | null;
}

export function DealFormDialog({ open, onClose, deal }: DealFormDialogProps) {
  const isEdit = !!deal;
  const createDeal = useCreateDeal();
  const updateDeal = useUpdateDeal(deal?.id ?? 0);

  const { data: contactsData } = useContacts({ page: 1, perPage: 200 });
  const { data: companiesData } = useCompanies({ page: 1, perPage: 200 });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      title: '',
      value: 0,
      contactId: 0,
      companyId: null,
      stage: 'Lead',
      expectedCloseDate: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: deal?.title ?? '',
        value: deal?.value ?? 0,
        contactId: deal?.contactId ?? 0,
        companyId: deal?.companyId ?? null,
        stage: deal?.stage ?? 'Lead',
        expectedCloseDate: deal?.expectedCloseDate
          ? deal.expectedCloseDate.split('T')[0]
          : '',
        notes: '',
      });
    }
  }, [open, deal, reset]);

  const saving = createDeal.isPending || updateDeal.isPending;
  const selectedContactId = watch('contactId');
  const selectedCompanyId = watch('companyId');
  const selectedStage = watch('stage');

  function onSubmit(data: DealFormData) {
    const payload = {
      title: data.title,
      value: data.value,
      contactId: data.contactId,
      companyId: data.companyId ?? undefined,
      stage: data.stage,
      expectedCloseDate: data.expectedCloseDate || undefined,
      notes: data.notes || undefined,
    };

    if (isEdit) {
      updateDeal.mutate(payload, {
        onSuccess: () => {
          toast.success('Deal updated');
          onClose();
        },
      });
    } else {
      createDeal.mutate(payload, {
        onSuccess: () => {
          toast.success('Deal created');
          onClose();
        },
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Deal' : 'New Deal'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the deal details below.'
              : 'Fill in the details to create a new deal.'}
          </DialogDescription>
        </DialogHeader>

        <form
          id="deal-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="deal-title">Title *</Label>
            <Input
              id="deal-title"
              {...register('title')}
              placeholder="Enterprise License"
            />
            {errors.title && (
              <p className="text-xs text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deal-value">Value ($) *</Label>
              <Input
                id="deal-value"
                type="number"
                step="0.01"
                {...register('value')}
              />
              {errors.value && (
                <p className="text-xs text-destructive">
                  {errors.value.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Stage</Label>
              <Select
                value={selectedStage}
                onValueChange={(v) => setValue('stage', v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Contact *</Label>
            <Select
              value={selectedContactId?.toString() ?? '0'}
              onValueChange={(v) => setValue('contactId', Number(v))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a contact" />
              </SelectTrigger>
              <SelectContent>
                {contactsData?.data.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.firstName} {c.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.contactId && (
              <p className="text-xs text-destructive">
                {errors.contactId.message}
              </p>
            )}
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
                {companiesData?.data.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deal-close-date">Expected Close Date</Label>
            <Input
              id="deal-close-date"
              type="date"
              {...register('expectedCloseDate')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deal-notes">Notes</Label>
            <Textarea
              id="deal-notes"
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
            form="deal-form"
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
