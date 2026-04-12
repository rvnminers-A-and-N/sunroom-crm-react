import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse, delay } from 'msw';
import { server } from '../../../tests/msw/server';
import { url } from '../../../tests/msw/handlers/url';
import { renderWithProviders } from '../../../tests/utils/render';
import { makeDeal, makePipeline } from '../../../tests/msw/data/factories';
import DealPipelinePage from './deal-pipeline-page';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('./deal-form-dialog', () => ({
  DealFormDialog: ({
    open,
    onClose,
  }: {
    open: boolean;
    onClose: () => void;
  }) =>
    open ? (
      <div data-testid="deal-form-dialog">
        <button type="button" onClick={onClose}>
          close-dialog
        </button>
      </div>
    ) : null,
}));

// Capture the dnd-kit handlers exposed by DndContext so tests can drive them
const dndHandlers = vi.hoisted(() => ({
  onDragStart: null as ((e: { active: { id: number | string } }) => void) | null,
  onDragEnd: null as
    | ((e: {
        active: { id: number | string };
        over: { id: string } | null;
      }) => void)
    | null,
}));

const dndOverrides = vi.hoisted(() => ({
  isOver: false,
  transform: null as { x: number; y: number } | null,
}));

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({
    children,
    onDragStart,
    onDragEnd,
  }: {
    children: React.ReactNode;
    onDragStart: typeof dndHandlers.onDragStart;
    onDragEnd: typeof dndHandlers.onDragEnd;
  }) => {
    dndHandlers.onDragStart = onDragStart;
    dndHandlers.onDragEnd = onDragEnd;
    return <div data-testid="dnd-context">{children}</div>;
  },
  DragOverlay: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="drag-overlay">{children}</div>
  ),
  closestCorners: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: () => [],
  useDroppable: () => ({ setNodeRef: vi.fn(), isOver: dndOverrides.isOver }),
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: dndOverrides.transform,
  }),
}));

describe('DealPipelinePage', () => {
  beforeEach(async () => {
    navigateMock.mockReset();
    dndHandlers.onDragStart = null;
    dndHandlers.onDragEnd = null;
    dndOverrides.isOver = false;
    dndOverrides.transform = null;
    const { toast } = await import('sonner');
    vi.mocked(toast.error).mockClear();
  });

  it('renders the loading skeleton until the pipeline resolves', async () => {
    server.use(
      http.get(url('/deals/pipeline'), async () => {
        await delay(40);
        return HttpResponse.json(makePipeline());
      }),
    );
    const { container } = renderWithProviders(<DealPipelinePage />);
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
    await screen.findByText('Drag deals between stages');
  });

  it('renders all stage columns with deals and totals', async () => {
    server.use(
      http.get(url('/deals/pipeline'), () =>
        HttpResponse.json({
          stages: [
            {
              stage: 'Lead',
              count: 1,
              totalValue: 1000,
              deals: [makeDeal({ id: 1, title: 'Lead Deal', value: 1000, stage: 'Lead' })],
            },
            {
              stage: 'Qualified',
              count: 0,
              totalValue: 0,
              deals: [],
            },
            {
              stage: 'Proposal',
              count: 0,
              totalValue: 0,
              deals: [],
            },
            {
              stage: 'Negotiation',
              count: 0,
              totalValue: 0,
              deals: [],
            },
            {
              stage: 'Won',
              count: 0,
              totalValue: 0,
              deals: [],
            },
            {
              stage: 'Lost',
              count: 0,
              totalValue: 0,
              deals: [],
            },
          ],
        }),
      ),
    );
    renderWithProviders(<DealPipelinePage />);
    expect(await screen.findByText('Lead Deal')).toBeInTheDocument();
    expect(screen.getAllByText('No deals').length).toBe(5);
  });

  it('uses a fallback color for an unknown stage column', async () => {
    server.use(
      http.get(url('/deals/pipeline'), () =>
        HttpResponse.json({
          stages: [
            {
              stage: 'WeirdStage',
              count: 0,
              totalValue: 0,
              deals: [],
            },
          ],
        }),
      ),
    );
    renderWithProviders(<DealPipelinePage />);
    await screen.findByText('WeirdStage');
    // Find the column header which uses inline borderTopColor
    const headers = document.querySelectorAll('[style*="border-top-color"]');
    expect(headers.length).toBeGreaterThan(0);
  });

  it('navigates to the deal detail when a deal card is clicked', async () => {
    server.use(
      http.get(url('/deals/pipeline'), () =>
        HttpResponse.json({
          stages: [
            {
              stage: 'Lead',
              count: 1,
              totalValue: 1000,
              deals: [makeDeal({ id: 12, title: 'Click Me', stage: 'Lead' })],
            },
          ],
        }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<DealPipelinePage />);
    await user.click(await screen.findByText('Click Me'));
    expect(navigateMock).toHaveBeenCalledWith('/deals/12');
  });

  it('opens the create dialog from the page header action', async () => {
    server.use(
      http.get(url('/deals/pipeline'), () => HttpResponse.json(makePipeline())),
    );
    const user = userEvent.setup();
    renderWithProviders(<DealPipelinePage />);
    await screen.findByText('Drag deals between stages');

    await user.click(screen.getByRole('button', { name: /Add Deal/ }));
    expect(screen.getByTestId('deal-form-dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'close-dialog' }));
    expect(screen.queryByTestId('deal-form-dialog')).not.toBeInTheDocument();
  });

  it('renders the List view link', async () => {
    server.use(
      http.get(url('/deals/pipeline'), () => HttpResponse.json(makePipeline())),
    );
    renderWithProviders(<DealPipelinePage />);
    await screen.findByText('Drag deals between stages');
    expect(screen.getByRole('link', { name: /List/ })).toHaveAttribute('href', '/deals');
  });

  it('handleDragStart sets the active deal in the overlay', async () => {
    server.use(
      http.get(url('/deals/pipeline'), () =>
        HttpResponse.json({
          stages: [
            {
              stage: 'Lead',
              count: 1,
              totalValue: 1000,
              deals: [makeDeal({ id: 5, title: 'Active', stage: 'Lead' })],
            },
          ],
        }),
      ),
    );
    renderWithProviders(<DealPipelinePage />);
    await screen.findByText('Active');

    dndHandlers.onDragStart!({ active: { id: 5 } });
    // The overlay should now render a card via DragOverlay
    await waitFor(() => {
      const overlay = screen.getByTestId('drag-overlay');
      expect(overlay.textContent).toContain('Active');
    });
  });

  it('handleDragStart with an unknown id clears the active deal', async () => {
    server.use(
      http.get(url('/deals/pipeline'), () =>
        HttpResponse.json({
          stages: [
            {
              stage: 'Lead',
              count: 1,
              totalValue: 1000,
              deals: [makeDeal({ id: 5, stage: 'Lead' })],
            },
          ],
        }),
      ),
    );
    renderWithProviders(<DealPipelinePage />);
    await screen.findByText('New Deal');

    // First set an active deal, then try to set an unknown one
    dndHandlers.onDragStart!({ active: { id: 5 } });
    dndHandlers.onDragStart!({ active: { id: 999 } });
    const overlay = screen.getByTestId('drag-overlay');
    expect(overlay.textContent).toBe('');
  });

  it('handleDragEnd does nothing when over is null', async () => {
    server.use(
      http.get(url('/deals/pipeline'), () =>
        HttpResponse.json({
          stages: [
            {
              stage: 'Lead',
              count: 1,
              totalValue: 1000,
              deals: [makeDeal({ id: 5, stage: 'Lead' })],
            },
          ],
        }),
      ),
    );
    let putCalled = false;
    server.use(
      http.put(url('/deals/5'), () => {
        putCalled = true;
        return HttpResponse.json({});
      }),
    );

    renderWithProviders(<DealPipelinePage />);
    await screen.findByText('New Deal');

    dndHandlers.onDragEnd!({ active: { id: 5 }, over: null });
    await new Promise((r) => setTimeout(r, 20));
    expect(putCalled).toBe(false);
  });

  it('handleDragEnd does nothing when the target stage matches', async () => {
    server.use(
      http.get(url('/deals/pipeline'), () =>
        HttpResponse.json({
          stages: [
            {
              stage: 'Lead',
              count: 1,
              totalValue: 1000,
              deals: [makeDeal({ id: 5, stage: 'Lead' })],
            },
          ],
        }),
      ),
    );
    let putCalled = false;
    server.use(
      http.put(url('/deals/5'), () => {
        putCalled = true;
        return HttpResponse.json({});
      }),
    );

    renderWithProviders(<DealPipelinePage />);
    await screen.findByText('New Deal');

    dndHandlers.onDragEnd!({ active: { id: 5 }, over: { id: 'Lead' } });
    await new Promise((r) => setTimeout(r, 20));
    expect(putCalled).toBe(false);
  });

  it('handleDragEnd does nothing when the deal id is unknown', async () => {
    server.use(
      http.get(url('/deals/pipeline'), () =>
        HttpResponse.json({
          stages: [
            {
              stage: 'Lead',
              count: 1,
              totalValue: 1000,
              deals: [makeDeal({ id: 5, stage: 'Lead' })],
            },
          ],
        }),
      ),
    );
    let putCalled = false;
    server.use(
      http.put(url('/deals/999'), () => {
        putCalled = true;
        return HttpResponse.json({});
      }),
    );

    renderWithProviders(<DealPipelinePage />);
    await screen.findByText('New Deal');

    dndHandlers.onDragEnd!({ active: { id: 999 }, over: { id: 'Qualified' } });
    await new Promise((r) => setTimeout(r, 20));
    expect(putCalled).toBe(false);
  });

  it('moves the deal optimistically and persists the stage change', async () => {
    server.use(
      http.get(url('/deals/pipeline'), () =>
        HttpResponse.json({
          stages: [
            {
              stage: 'Lead',
              count: 1,
              totalValue: 1000,
              deals: [
                makeDeal({
                  id: 5,
                  title: 'Mover',
                  value: 1000,
                  stage: 'Lead',
                  contactId: 1,
                  companyId: 2,
                  expectedCloseDate: '2025-06-01',
                }),
              ],
            },
            {
              stage: 'Qualified',
              count: 0,
              totalValue: 0,
              deals: [],
            },
          ],
        }),
      ),
    );

    let putBody: Record<string, unknown> | null = null;
    server.use(
      http.put(url('/deals/5'), async ({ request }) => {
        putBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({});
      }),
    );

    renderWithProviders(<DealPipelinePage />);
    await screen.findByText('Mover');

    dndHandlers.onDragEnd!({ active: { id: 5 }, over: { id: 'Qualified' } });

    await waitFor(() => expect(putBody).not.toBeNull());
    expect(putBody).toMatchObject({
      title: 'Mover',
      value: 1000,
      contactId: 1,
      companyId: 2,
      stage: 'Qualified',
      expectedCloseDate: '2025-06-01',
    });
  });

  it('omits optional fields in the persist payload when null', async () => {
    server.use(
      http.get(url('/deals/pipeline'), () =>
        HttpResponse.json({
          stages: [
            {
              stage: 'Lead',
              count: 1,
              totalValue: 500,
              deals: [
                makeDeal({
                  id: 7,
                  title: 'Bare',
                  value: 500,
                  stage: 'Lead',
                  companyId: null,
                  expectedCloseDate: null,
                }),
              ],
            },
            {
              stage: 'Won',
              count: 0,
              totalValue: 0,
              deals: [],
            },
          ],
        }),
      ),
    );
    let putBody: Record<string, unknown> | null = null;
    server.use(
      http.put(url('/deals/7'), async ({ request }) => {
        putBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({});
      }),
    );

    renderWithProviders(<DealPipelinePage />);
    await screen.findByText('Bare');

    dndHandlers.onDragEnd!({ active: { id: 7 }, over: { id: 'Won' } });
    await waitFor(() => expect(putBody).not.toBeNull());
    expect((putBody as Record<string, unknown>).companyId).toBeUndefined();
    expect((putBody as Record<string, unknown>).expectedCloseDate).toBeUndefined();
  });

  it('shows an error toast when the persist call fails', async () => {
    server.use(
      http.get(url('/deals/pipeline'), () =>
        HttpResponse.json({
          stages: [
            {
              stage: 'Lead',
              count: 1,
              totalValue: 1000,
              deals: [makeDeal({ id: 8, title: 'Fails', stage: 'Lead' })],
            },
            {
              stage: 'Qualified',
              count: 0,
              totalValue: 0,
              deals: [],
            },
          ],
        }),
      ),
      http.put(url('/deals/8'), () => HttpResponse.json({}, { status: 500 })),
    );

    renderWithProviders(<DealPipelinePage />);
    await screen.findByText('Fails');

    dndHandlers.onDragEnd!({ active: { id: 8 }, over: { id: 'Qualified' } });

    const { toast } = await import('sonner');
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Failed to update deal stage'),
    );
  });

  it('does not move when sourceStage cannot be found (missing source side)', async () => {
    // findDealById walks all stages so it can find a deal that doesn't really
    // belong to the stage matching its `stage` field. We construct that case
    // here so the optimistic block runs but sourceStage is undefined.
    server.use(
      http.get(url('/deals/pipeline'), () =>
        HttpResponse.json({
          stages: [
            {
              stage: 'Qualified',
              count: 1,
              totalValue: 1000,
              // The deal claims stage 'Lead' but the only available column is Qualified
              deals: [makeDeal({ id: 9, stage: 'Lead' })],
            },
          ],
        }),
      ),
    );
    let putBody: Record<string, unknown> | null = null;
    server.use(
      http.put(url('/deals/9'), async ({ request }) => {
        putBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({});
      }),
    );

    renderWithProviders(<DealPipelinePage />);
    await screen.findByText('New Deal');

    // Drop into Qualified — sourceStage (Lead) doesn't exist, but the persist
    // call still fires because the optimistic block is skipped.
    dndHandlers.onDragEnd!({ active: { id: 9 }, over: { id: 'Qualified' } });
    await waitFor(() => expect(putBody).not.toBeNull());
    expect((putBody as Record<string, unknown>).stage).toBe('Qualified');
  });

  it('applies the isOver background when a column is hovered', async () => {
    dndOverrides.isOver = true;
    server.use(
      http.get(url('/deals/pipeline'), () =>
        HttpResponse.json({
          stages: [
            {
              stage: 'Lead',
              count: 0,
              totalValue: 0,
              deals: [],
            },
          ],
        }),
      ),
    );
    const { container } = renderWithProviders(<DealPipelinePage />);
    await screen.findByText('Drag deals between stages');
    expect(container.querySelector('.bg-muted\\/50')).not.toBeNull();
  });

  it('applies the transform style when a card is being dragged', async () => {
    dndOverrides.transform = { x: 12, y: 34 };
    server.use(
      http.get(url('/deals/pipeline'), () =>
        HttpResponse.json({
          stages: [
            {
              stage: 'Lead',
              count: 1,
              totalValue: 1000,
              deals: [makeDeal({ id: 1, title: 'Dragged', stage: 'Lead' })],
            },
          ],
        }),
      ),
    );
    renderWithProviders(<DealPipelinePage />);
    const card = await screen.findByText('Dragged');
    expect(card.parentElement?.getAttribute('style')).toContain('translate(12px, 34px)');
  });

  it('handleDragStart returns undefined when pipeline data is missing', async () => {
    server.use(
      http.get(url('/deals/pipeline'), () => HttpResponse.json(null)),
    );
    renderWithProviders(<DealPipelinePage />);

    // Wait for the dnd handlers to be registered
    await waitFor(() => expect(dndHandlers.onDragStart).not.toBeNull());

    // findDealById should hit the !pipeline branch and return undefined,
    // leaving the overlay empty
    dndHandlers.onDragStart!({ active: { id: 5 } });
    const overlay = screen.getByTestId('drag-overlay');
    expect(overlay.textContent).toBe('');
  });

  it('handles dragging a deal already missing from its source list', async () => {
    // sourceStage exists but the deal isn't in its deals array (idx === -1)
    // This exercises the `if (idx > -1)` false branch.
    server.use(
      http.get(url('/deals/pipeline'), () =>
        HttpResponse.json({
          stages: [
            {
              stage: 'Lead',
              count: 0,
              totalValue: 0,
              deals: [],
            },
            {
              stage: 'Qualified',
              count: 1,
              totalValue: 1000,
              // Deal lives here but claims stage 'Lead'
              deals: [makeDeal({ id: 10, stage: 'Lead' })],
            },
          ],
        }),
      ),
    );
    let putBody: Record<string, unknown> | null = null;
    server.use(
      http.put(url('/deals/10'), async ({ request }) => {
        putBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({});
      }),
    );

    renderWithProviders(<DealPipelinePage />);
    await screen.findByText('New Deal');

    dndHandlers.onDragEnd!({ active: { id: 10 }, over: { id: 'Qualified' } });
    await waitFor(() => expect(putBody).not.toBeNull());
  });
});
