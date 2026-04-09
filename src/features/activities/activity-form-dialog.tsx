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
import {
  useCreateActivity,
  useUpdateActivity,
} from '@core/hooks/use-activities';
import { useContacts } from '@core/hooks/use-contacts';
import { useDeals } from '@core/hooks/use-deals';
import type { Activity, ActivityType } from '@core/models/activity';
import { toast } from 'sonner';

const TYPES: ActivityType[] = ['Note', 'Call', 'Email', 'Meeting', 'Task'];

const activitySchema = z.object({
  type: z.string().min(1, 'Type is required'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().optional(),
  contactId: z.number().nullable().optional(),
  dealId: z.number().nullable().optional(),
  occurredAt: z.string().optional(),
});

type ActivityFormData = z.infer<typeof activitySchema>;

interface ActivityFormDialogProps {
  open: boolean;
  onClose: () => void;
  activity?: Activity | null;
}

export function ActivityFormDialog({
  open,
  onClose,
  activity,
}: ActivityFormDialogProps) {
  const isEdit = !!activity;
  const createActivity = useCreateActivity();
  const updateActivity = useUpdateActivity(activity?.id ?? 0);

  const { data: contactsData } = useContacts({ page: 1, perPage: 200 });
  const { data: dealsData } = useDeals({ page: 1, perPage: 200 });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      type: 'Note',
      subject: '',
      body: '',
      contactId: null,
      dealId: null,
      occurredAt: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        type: activity?.type ?? 'Note',
        subject: activity?.subject ?? '',
        body: activity?.body ?? '',
        contactId: activity?.contactId ?? null,
        dealId: activity?.dealId ?? null,
        occurredAt: activity?.occurredAt
          ? activity.occurredAt.split('T')[0]
          : new Date().toISOString().split('T')[0],
      });
    }
  }, [open, activity, reset]);

  const saving = createActivity.isPending || updateActivity.isPending;
  const selectedType = watch('type');
  const selectedContactId = watch('contactId');
  const selectedDealId = watch('dealId');

  function onSubmit(data: ActivityFormData) {
    const payload = {
      type: data.type,
      subject: data.subject,
      body: data.body || undefined,
      contactId: data.contactId ?? undefined,
      dealId: data.dealId ?? undefined,
      occurredAt: data.occurredAt
        ? new Date(data.occurredAt).toISOString()
        : undefined,
    };

    if (isEdit) {
      updateActivity.mutate(payload, {
        onSuccess: () => {
          toast.success('Activity updated');
          onClose();
        },
      });
    } else {
      createActivity.mutate(payload, {
        onSuccess: () => {
          toast.success('Activity logged');
          onClose();
        },
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Activity' : 'Log Activity'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the activity details below.'
              : 'Log a new activity for tracking.'}
          </DialogDescription>
        </DialogHeader>

        <form
          id="activity-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select
                value={selectedType}
                onValueChange={(v) => setValue('type', v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="act-date">Date</Label>
              <Input
                id="act-date"
                type="date"
                {...register('occurredAt')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="act-subject">Subject *</Label>
            <Input
              id="act-subject"
              {...register('subject')}
              placeholder="Follow-up call with client"
            />
            {errors.subject && (
              <p className="text-xs text-destructive">
                {errors.subject.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Contact</Label>
            <Select
              value={selectedContactId?.toString() ?? 'none'}
              onValueChange={(v) =>
                setValue('contactId', v === 'none' ? null : Number(v))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a contact" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {contactsData?.data.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.firstName} {c.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Deal</Label>
            <Select
              value={selectedDealId?.toString() ?? 'none'}
              onValueChange={(v) =>
                setValue('dealId', v === 'none' ? null : Number(v))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a deal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {dealsData?.data.map((d) => (
                  <SelectItem key={d.id} value={d.id.toString()}>
                    {d.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="act-body">Body</Label>
            <Textarea
              id="act-body"
              {...register('body')}
              placeholder="Details about the activity..."
              rows={4}
            />
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="activity-form"
            disabled={saving}
            className="bg-sr-primary hover:bg-sr-primary-dark"
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEdit ? 'Save' : 'Log'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
