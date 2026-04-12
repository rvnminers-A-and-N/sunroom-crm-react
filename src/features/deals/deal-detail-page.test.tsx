import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse, delay } from 'msw';
import { server } from '../../../tests/msw/server';
import { url } from '../../../tests/msw/handlers/url';
import { renderWithProviders } from '../../../tests/utils/render';
import {
  makeActivity,
  makeDealDetail,
} from '../../../tests/msw/data/factories';
import DealDetailPage from './deal-detail-page';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useParams: () => ({ id: '42' }),
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
    deal,
  }: {
    open: boolean;
    onClose: () => void;
    deal: { id: number } | null;
  }) =>
    open ? (
      <div data-testid="deal-form-dialog">
        <span>editing-{deal?.id ?? 'none'}</span>
        <button type="button" onClick={onClose}>
          close-dialog
        </button>
      </div>
    ) : null,
}));

vi.mock('@shared/components/confirm-dialog', () => ({
  ConfirmDialog: ({
    open,
    onConfirm,
    onClose,
    title,
    message,
  }: {
    open: boolean;
    onConfirm: () => void;
    onClose: () => void;
    title: string;
    message: string;
  }) =>
    open ? (
      <div role="dialog">
        <h2>{title}</h2>
        <p>{message}</p>
        <button type="button" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          Delete
        </button>
      </div>
    ) : null,
}));

describe('DealDetailPage', () => {
  beforeEach(async () => {
    navigateMock.mockReset();
    const { toast } = await import('sonner');
    vi.mocked(toast.success).mockClear();
  });

  it('shows the loading skeleton until data resolves', async () => {
    server.use(
      http.get(url('/deals/42'), async () => {
        await delay(40);
        return HttpResponse.json(makeDealDetail({ id: 42 }));
      }),
    );

    const { container } = renderWithProviders(<DealDetailPage />);
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
    expect(await screen.findByText('New Deal')).toBeInTheDocument();
  });

  it('returns null when the API resolves with a falsy deal', async () => {
    server.use(
      http.get(url('/deals/42'), () => HttpResponse.json(null)),
    );
    const { container } = renderWithProviders(<DealDetailPage />);
    await waitFor(() => {
      expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBe(0);
    });
    expect(container.firstChild).toBeNull();
  });

  it('renders all info card fields when populated', async () => {
    server.use(
      http.get(url('/deals/42'), () =>
        HttpResponse.json(
          makeDealDetail({
            id: 42,
            title: 'Big Deal',
            value: 75000,
            stage: 'Won',
            contactName: 'Jane Doe',
            contactId: 7,
            companyName: 'Acme Inc',
            companyId: 9,
            expectedCloseDate: '2024-12-31',
            closedAt: '2025-01-15',
            notes: 'Closed quickly',
          }),
        ),
      ),
    );

    renderWithProviders(<DealDetailPage />);

    expect(await screen.findByText('Big Deal')).toBeInTheDocument();
    // "Won" appears in both the header badge and the stage stepper
    expect(screen.getAllByText('Won').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Jane Doe').closest('a')).toHaveAttribute(
      'href',
      '/contacts/7',
    );
    expect(screen.getByText('Acme Inc').closest('a')).toHaveAttribute(
      'href',
      '/companies/9',
    );
    expect(screen.getByText(/Expected close:/)).toBeInTheDocument();
    expect(screen.getByText(/Closed:/)).toBeInTheDocument();
    expect(screen.getByText(/Created/)).toBeInTheDocument();
    expect(screen.getByText('Closed quickly')).toBeInTheDocument();
  });

  it('falls back to muted style for unknown stages', async () => {
    server.use(
      http.get(url('/deals/42'), () =>
        HttpResponse.json(
          makeDealDetail({
            id: 42,
            stage: 'WeirdStage',
            companyName: null,
            companyId: null,
            expectedCloseDate: null,
            closedAt: null,
            notes: null,
          }),
        ),
      ),
    );

    renderWithProviders(<DealDetailPage />);
    const badge = await screen.findByText('WeirdStage');
    expect(badge.className).toMatch(/bg-muted/);
    expect(screen.queryByText(/Expected close:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Closed:/)).not.toBeInTheDocument();
  });

  it('renders the Lost stage stepper variant', async () => {
    server.use(
      http.get(url('/deals/42'), () =>
        HttpResponse.json(makeDealDetail({ id: 42, stage: 'Lost' })),
      ),
    );

    const { container } = renderWithProviders(<DealDetailPage />);
    await screen.findByText('New Deal');
    // The Lost stepper bar uses bg-gray-400 instead of bg-sr-primary
    expect(container.querySelectorAll('.bg-gray-400').length).toBeGreaterThan(0);
  });

  it('renders the activities list when present', async () => {
    server.use(
      http.get(url('/deals/42'), () =>
        HttpResponse.json(
          makeDealDetail({
            id: 42,
            activities: [
              makeActivity({
                id: 1,
                subject: 'Follow up call',
                body: 'Spoke about pricing',
                type: 'Call',
              }),
              makeActivity({
                id: 2,
                subject: 'Sent proposal',
                body: null as unknown as string,
                type: 'Note',
              }),
            ],
          }),
        ),
      ),
    );

    renderWithProviders(<DealDetailPage />);
    await screen.findByText('New Deal');
    expect(screen.getByText('Activities (2)')).toBeInTheDocument();
    expect(screen.getByText('Follow up call')).toBeInTheDocument();
    expect(screen.getByText('Spoke about pricing')).toBeInTheDocument();
    expect(screen.getByText('Sent proposal')).toBeInTheDocument();
  });

  it('shows the empty activities placeholder when none', async () => {
    server.use(
      http.get(url('/deals/42'), () =>
        HttpResponse.json(makeDealDetail({ id: 42, activities: [] })),
      ),
    );
    renderWithProviders(<DealDetailPage />);
    await screen.findByText('New Deal');
    expect(screen.getByText('No activities recorded')).toBeInTheDocument();
  });

  it('renders the AI insights card when insights are present', async () => {
    server.use(
      http.get(url('/deals/42'), () =>
        HttpResponse.json(
          makeDealDetail({
            id: 42,
            insights: [
              {
                id: 1,
                insight: 'High-value lead',
                generatedAt: '2025-01-15T10:30:00Z',
              },
            ],
          }),
        ),
      ),
    );
    renderWithProviders(<DealDetailPage />);
    await screen.findByText('New Deal');
    expect(screen.getByText('AI Insights')).toBeInTheDocument();
    expect(screen.getByText('High-value lead')).toBeInTheDocument();
  });

  it('navigates back to /deals when the back button is clicked', async () => {
    server.use(
      http.get(url('/deals/42'), () =>
        HttpResponse.json(makeDealDetail({ id: 42 })),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<DealDetailPage />);
    await screen.findByText('New Deal');

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[0]); // back button is first
    expect(navigateMock).toHaveBeenCalledWith('/deals');
  });

  it('opens the edit dialog and closes it', async () => {
    server.use(
      http.get(url('/deals/42'), () =>
        HttpResponse.json(makeDealDetail({ id: 42 })),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<DealDetailPage />);
    await screen.findByText('New Deal');

    await user.click(screen.getByRole('button', { name: /Edit/ }));
    expect(screen.getByTestId('deal-form-dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'close-dialog' }));
    expect(screen.queryByTestId('deal-form-dialog')).not.toBeInTheDocument();
  });

  it('opens the delete dialog and triggers deletion', async () => {
    let deleteCalled = false;
    server.use(
      http.get(url('/deals/42'), () =>
        HttpResponse.json(makeDealDetail({ id: 42, title: 'Big Deal' })),
      ),
      http.delete(url('/deals/42'), () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<DealDetailPage />);
    await screen.findByText('Big Deal');

    await user.click(screen.getByRole('button', { name: /Delete/ }));
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText(/Are you sure you want to delete "Big Deal"/),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(deleteCalled).toBe(true));

    const { toast } = await import('sonner');
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Deal deleted'));
    expect(navigateMock).toHaveBeenCalledWith('/deals');
  });

  it('cancels the delete dialog without deleting', async () => {
    server.use(
      http.get(url('/deals/42'), () =>
        HttpResponse.json(makeDealDetail({ id: 42 })),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<DealDetailPage />);
    await screen.findByText('New Deal');

    await user.click(screen.getByRole('button', { name: /Delete/ }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
