import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Clock,
  Pencil,
  Trash2,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ActivityIcon } from '@shared/components/activity-icon';
import { ConfirmDialog } from '@shared/components/confirm-dialog';
import { ContactFormDialog } from './contact-form-dialog';
import { useContact, useDeleteContact } from '@core/hooks/use-contacts';
import { formatRelativeTime } from '@shared/utils/format-relative-time';
import { formatCurrencyShort } from '@shared/utils/format-currency';

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const contactId = Number(id);
  const { data: contact, isLoading } = useContact(contactId);
  const deleteContact = useDeleteContact();

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  function handleDelete() {
    deleteContact.mutate(contactId, {
      onSuccess: () => {
        toast.success('Contact deleted');
        navigate('/contacts');
      },
    });
  }

  if (isLoading) return <ContactDetailSkeleton />;
  if (!contact) return null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/contacts')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-sr-text">
            {contact.firstName} {contact.lastName}
          </h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            {contact.title && <span>{contact.title}</span>}
            {contact.title && contact.company && <span>&middot;</span>}
            {contact.company && (
              <Link
                to={`/companies/${contact.company.id}`}
                className="text-sr-primary hover:underline inline-flex items-center gap-1"
              >
                <Building2 className="h-3.5 w-3.5" />
                {contact.company.name}
              </Link>
            )}
          </div>
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
            <InfoRow icon={Mail} label={contact.email || 'No email'} />
            <InfoRow icon={Phone} label={contact.phone || 'No phone'} />
            <InfoRow
              icon={Calendar}
              label={`Added ${new Date(contact.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
            />
            {contact.lastContactedAt && (
              <InfoRow
                icon={Clock}
                label={`Last contacted ${formatRelativeTime(contact.lastContactedAt)}`}
              />
            )}

            {contact.tags.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {contact.tags.map((tag) => (
                    <Badge key={tag.id} variant="secondary" className="text-xs">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {contact.notes && (
              <div className="pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Notes
                </p>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {contact.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs: Deals & Activities */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="deals">
            <TabsList>
              <TabsTrigger value="deals">
                Deals ({contact.deals.length})
              </TabsTrigger>
              <TabsTrigger value="activities">
                Activities ({contact.activities.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="deals" className="mt-4">
              {contact.deals.length > 0 ? (
                <div className="space-y-2">
                  {contact.deals.map((deal) => (
                    <Link
                      key={deal.id}
                      to={`/deals/${deal.id}`}
                      className="block rounded-lg border bg-card p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{deal.title}</p>
                          <StageBadge stage={deal.stage} />
                        </div>
                        <span className="font-semibold text-sm">
                          {formatCurrencyShort(deal.value)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No deals yet
                </p>
              )}
            </TabsContent>

            <TabsContent value="activities" className="mt-4">
              {contact.activities.length > 0 ? (
                <div className="space-y-3">
                  {contact.activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 rounded-lg border bg-card p-4"
                    >
                      <ActivityIcon type={activity.type} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          {activity.subject}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.type} &middot;{' '}
                          {formatRelativeTime(activity.occurredAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No activities yet
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <ContactFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        contact={contact as any}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Contact"
        message={`Are you sure you want to delete ${contact.firstName} ${contact.lastName}?`}
      />
    </div>
  );
}

function InfoRow({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span>{label}</span>
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
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-1 ${color}`}
    >
      {stage}
    </span>
  );
}

function ContactDetailSkeleton() {
  return (
    <div>
      <div className="flex items-start gap-4 mb-6">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="flex-1">
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
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
        <div className="lg:col-span-2">
          <Skeleton className="h-10 w-48 mb-4" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full mb-2" />
          ))}
        </div>
      </div>
    </div>
  );
}
