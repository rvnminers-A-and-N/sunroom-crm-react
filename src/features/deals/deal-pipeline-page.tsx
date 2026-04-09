import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { List, Columns3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@shared/components/page-header';
import { DealFormDialog } from './deal-form-dialog';
import { usePipeline } from '@core/hooks/use-deals';
import { apiClient } from '@core/api/client';
import { formatCurrencyShort } from '@shared/utils/format-currency';
import type { Deal, PipelineStage } from '@core/models/deal';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const STAGE_COLORS: Record<string, string> = {
  Lead: '#F4C95D',
  Qualified: '#F9A66C',
  Proposal: '#F76C6C',
  Negotiation: '#3B82F6',
  Won: '#02795F',
  Lost: '#9CA3AF',
};

export default function DealPipelinePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: pipeline, isLoading } = usePipeline();
  const [formOpen, setFormOpen] = useState(false);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  function handleDragStart(event: DragStartEvent) {
    const deal = findDealById(Number(event.active.id));
    setActiveDeal(deal ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDeal(null);
    const { active, over } = event;
    if (!over || !pipeline) return;

    const dealId = Number(active.id);
    const targetStage = String(over.id);

    const deal = findDealById(dealId);
    if (!deal || deal.stage === targetStage) return;

    // Optimistic update
    const updatedStages = pipeline.stages.map((s) => ({
      ...s,
      deals: [...s.deals],
      count: s.count,
      totalValue: s.totalValue,
    }));

    const sourceStage = updatedStages.find((s) => s.stage === deal.stage);
    const destStage = updatedStages.find((s) => s.stage === targetStage);

    if (sourceStage && destStage) {
      const idx = sourceStage.deals.findIndex((d) => d.id === dealId);
      if (idx > -1) {
        sourceStage.deals.splice(idx, 1);
        sourceStage.count--;
        sourceStage.totalValue -= deal.value;
      }
      destStage.deals.push({ ...deal, stage: targetStage });
      destStage.count++;
      destStage.totalValue += deal.value;

      queryClient.setQueryData(['deals', 'pipeline'], {
        stages: updatedStages,
      });
    }

    // Persist to API
    persistStageChange(dealId, {
      title: deal.title,
      value: deal.value,
      contactId: deal.contactId,
      companyId: deal.companyId ?? undefined,
      stage: targetStage,
      expectedCloseDate: deal.expectedCloseDate ?? undefined,
    });
  }

  function findDealById(id: number): Deal | undefined {
    if (!pipeline) return undefined;
    for (const stage of pipeline.stages) {
      const deal = stage.deals.find((d) => d.id === id);
      if (deal) return deal;
    }
    return undefined;
  }

  function persistStageChange(dealId: number, data: Record<string, unknown>) {
    apiClient.put(`/deals/${dealId}`, data).catch(() => {
      toast.error('Failed to update deal stage');
      queryClient.invalidateQueries({ queryKey: ['deals', 'pipeline'] });
    });
  }

  if (isLoading) return <PipelineSkeleton />;

  return (
    <div>
      <PageHeader
        title="Pipeline"
        subtitle="Drag deals between stages"
        actionLabel="Add Deal"
        onAction={() => setFormOpen(true)}
      />

      <div className="flex gap-2 mb-4">
        <Button variant="outline" size="sm" asChild>
          <Link to="/deals">
            <List className="h-4 w-4 mr-1" /> List
          </Link>
        </Button>
        <Button variant="default" size="sm" className="bg-sr-primary">
          <Columns3 className="h-4 w-4 mr-1" /> Pipeline
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {pipeline?.stages.map((stage) => (
            <PipelineColumn
              key={stage.stage}
              stage={stage}
              onDealClick={(id) => navigate(`/deals/${id}`)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeDeal && <DealCard deal={activeDeal} isDragging />}
        </DragOverlay>
      </DndContext>

      <DealFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
      />
    </div>
  );
}

function PipelineColumn({
  stage,
  onDealClick,
}: {
  stage: PipelineStage;
  onDealClick: (id: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.stage });
  const color = STAGE_COLORS[stage.stage] ?? '#6B7280';

  return (
    <div className="flex-shrink-0 w-[280px]">
      <div
        className="rounded-t-lg px-3 py-2 border-t-4"
        style={{ borderTopColor: color }}
      >
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm">{stage.stage}</span>
          <span className="text-xs bg-muted rounded-full px-2 py-0.5">
            {stage.count}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatCurrencyShort(stage.totalValue)}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`min-h-[200px] space-y-2 rounded-b-lg border border-t-0 p-2 transition-colors ${
          isOver ? 'bg-muted/50' : 'bg-muted/20'
        }`}
      >
        {stage.deals.length > 0 ? (
          stage.deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              onClick={() => onDealClick(deal.id)}
            />
          ))
        ) : (
          <p className="text-xs text-muted-foreground text-center py-8">
            No deals
          </p>
        )}
      </div>
    </div>
  );
}

function DealCard({
  deal,
  isDragging,
  onClick,
}: {
  deal: Deal;
  isDragging?: boolean;
  onClick?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggableCard(
    deal.id,
  );

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={!isDragging ? setNodeRef : undefined}
      style={style}
      {...(!isDragging ? { ...listeners, ...attributes } : {})}
      className={`rounded-lg border bg-card p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-90 shadow-lg rotate-2' : ''
      }`}
      onClick={onClick}
    >
      <p className="font-medium text-sm truncate">{deal.title}</p>
      <p className="text-xs text-muted-foreground mt-1">{deal.contactName}</p>
      <p className="text-sm font-semibold mt-2">
        {formatCurrencyShort(deal.value)}
      </p>
    </div>
  );
}

function useDraggableCard(id: number) {
  return useDraggable({ id });
}

function PipelineSkeleton() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-[280px]">
            <Skeleton className="h-16 w-full rounded-t-lg" />
            <div className="border border-t-0 rounded-b-lg p-2 space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
