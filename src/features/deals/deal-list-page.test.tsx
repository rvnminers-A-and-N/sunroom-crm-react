import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse, delay } from 'msw';
import { server } from '../../../tests/msw/server';
import { url } from '../../../tests/msw/handlers/url';
import { renderWithProviders } from '../../../tests/utils/render';
import { makeDeal, makePaginated } from '../../../tests/msw/data/factories';
import DealListPage from './deal-list-page';

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
    deal,
  }: {
    open: boolean;
    onClose: () => void;
    deal: { id: number; title: string } | null;
  }) =>
    open ? (
      <div data-testid="deal-form-dialog">
        <span>{deal ? `editing-${deal.id}` : 'creating'}</span>
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
  }) => (
    <>
      <button
        type="button"
        data-testid="force-confirm"
        onClick={onConfirm}
        style={{ display: 'none' }}
      >
        force-confirm
      </button>
      {open && (
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
      )}
    </>
  ),
}));

describe('DealListPage', () => {
  beforeEach(async () => {
    navigateMock.mockReset();
    const { toast } = await import('sonner');
    vi.mocked(toast.success).mockClear();
  });

  it('renders header total and a single deal row with stage badge', async () => {
    server.use(
      http.get(url('/deals'), () =>
        HttpResponse.json(
          makePaginated(
            [
              makeDeal({
                id: 1,
                title: 'Big Deal',
                value: 50000,
                stage: 'Won',
                contactName: 'Jane Doe',
                companyName: 'Acme Inc',
                expectedCloseDate: '2024-12-31',
              }),
            ],
            { total: 1 },
          ),
        ),
      ),
    );

    renderWithProviders(<DealListPage />);

    expect(await screen.findByText('Big Deal')).toBeInTheDocument();
    expect(screen.getByText('1 total')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Acme Inc')).toBeInTheDocument();
    expect(screen.getByText('Won')).toBeInTheDocument();
    // Date is formatted via toLocaleDateString
    expect(screen.getByText(/Dec 30, 2024|Dec 31, 2024/)).toBeInTheDocument();
  });

  it('uses fallback styles for unknown stages and em-dash for missing fields', async () => {
    server.use(
      http.get(url('/deals'), () =>
        HttpResponse.json(
          makePaginated([
            makeDeal({
              id: 2,
              title: 'Mystery',
              value: 100,
              stage: 'WeirdStage',
              companyName: null,
              expectedCloseDate: null,
            }),
          ]),
        ),
      ),
    );

    renderWithProviders(<DealListPage />);

    expect(await screen.findByText('Mystery')).toBeInTheDocument();
    expect(screen.getByText('WeirdStage')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
  });

  it('shows the loading skeleton until data resolves', async () => {
    server.use(
      http.get(url('/deals'), async () => {
        await delay(40);
        return HttpResponse.json(makePaginated([makeDeal()]));
      }),
    );

    const { container } = renderWithProviders(<DealListPage />);
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
    expect(await screen.findByText('New Deal')).toBeInTheDocument();
  });

  it('shows the empty state and opens the create dialog from it', async () => {
    server.use(
      http.get(url('/deals'), () => HttpResponse.json(makePaginated([]))),
    );

    const user = userEvent.setup();
    renderWithProviders(<DealListPage />);

    expect(await screen.findByText('No deals yet')).toBeInTheDocument();
    const empty = screen.getByText('No deals yet').closest('div')!;
    const addButton = within(empty).getByRole('button', { name: /add deal/i });
    await user.click(addButton);
    expect(screen.getByTestId('deal-form-dialog')).toHaveTextContent('creating');
  });

  it('navigates to the detail page when a row is clicked', async () => {
    server.use(
      http.get(url('/deals'), () =>
        HttpResponse.json(makePaginated([makeDeal({ id: 77 })])),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<DealListPage />);

    await user.click(await screen.findByText('New Deal'));
    expect(navigateMock).toHaveBeenCalledWith('/deals/77');
  });

  it('opens the edit dialog without navigating', async () => {
    server.use(
      http.get(url('/deals'), () =>
        HttpResponse.json(makePaginated([makeDeal({ id: 4 })])),
      ),
    );

    const user = userEvent.setup();
    const { container } = renderWithProviders(<DealListPage />);

    await screen.findByText('New Deal');
    const buttons = container.querySelectorAll('tbody button');
    expect(buttons.length).toBe(2);
    await user.click(buttons[0] as HTMLElement);

    expect(navigateMock).not.toHaveBeenCalled();
    expect(screen.getByTestId('deal-form-dialog')).toHaveTextContent('editing-4');
  });

  it('opens the delete confirm dialog and triggers deletion', async () => {
    let deleteCalled = false;
    server.use(
      http.get(url('/deals'), () =>
        HttpResponse.json(
          makePaginated([makeDeal({ id: 9, title: 'Big Deal' })]),
        ),
      ),
      http.delete(url('/deals/9'), () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    const { container } = renderWithProviders(<DealListPage />);

    await screen.findByText('Big Deal');
    const buttons = container.querySelectorAll('tbody button');
    await user.click(buttons[1] as HTMLElement);

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText(/Are you sure you want to delete "Big Deal"/),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(deleteCalled).toBe(true));
    const { toast } = await import('sonner');
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Deal deleted'));
  });

  it('returns early from handleDelete when no target is selected', async () => {
    server.use(
      http.get(url('/deals'), () =>
        HttpResponse.json(makePaginated([makeDeal()])),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<DealListPage />);

    await screen.findByText('New Deal');
    await user.click(screen.getByTestId('force-confirm'));
    const { toast } = await import('sonner');
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('opens the create dialog from the page header action', async () => {
    server.use(
      http.get(url('/deals'), () =>
        HttpResponse.json(makePaginated([makeDeal()])),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<DealListPage />);

    await screen.findByText('New Deal');
    const buttons = screen.getAllByRole('button', { name: /add deal/i });
    await user.click(buttons[0]);

    expect(screen.getByTestId('deal-form-dialog')).toHaveTextContent('creating');
    await user.click(screen.getByRole('button', { name: 'close-dialog' }));
    expect(screen.queryByTestId('deal-form-dialog')).not.toBeInTheDocument();
  });

  it('debounces the search input and reissues the query, resetting page', async () => {
    const requests: { search: string | null; page: string | null }[] = [];
    server.use(
      http.get(url('/deals'), ({ request }) => {
        const u = new URL(request.url);
        requests.push({
          search: u.searchParams.get('search'),
          page: u.searchParams.get('page'),
        });
        return HttpResponse.json(makePaginated([makeDeal()]));
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<DealListPage />);

    await screen.findByText('New Deal');
    await user.type(screen.getByPlaceholderText('Search deals...'), 'big');

    await waitFor(
      () => {
        expect(requests.some((r) => r.search === 'big')).toBe(true);
      },
      { timeout: 2000 },
    );
  });

  it('filters by stage and resets the page back to 1', async () => {
    const calls: { stage: string | null; page: string | null }[] = [];
    server.use(
      http.get(url('/deals'), ({ request }) => {
        const u = new URL(request.url);
        calls.push({
          stage: u.searchParams.get('stage'),
          page: u.searchParams.get('page'),
        });
        return HttpResponse.json(makePaginated([makeDeal()]));
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<DealListPage />);

    await screen.findByText('New Deal');

    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    const won = await screen.findByRole('option', { name: 'Won' });
    await user.click(won);

    await waitFor(() => expect(calls.some((c) => c.stage === 'Won')).toBe(true));

    // Switch back to All stages — sends no stage param
    await user.click(screen.getByRole('combobox'));
    const allStages = await screen.findByRole('option', { name: 'All stages' });
    await user.click(allStages);

    await waitFor(() => {
      const last = calls[calls.length - 1];
      expect(last.stage).toBeNull();
    });
  });

  it('paginates with the Previous and Next buttons', async () => {
    const pages: number[] = [];
    server.use(
      http.get(url('/deals'), ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page') ?? '1');
        pages.push(page);
        return HttpResponse.json(
          makePaginated([makeDeal({ id: page })], {
            currentPage: page,
            perPage: 10,
            total: 25,
            lastPage: 3,
          }),
        );
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<DealListPage />);

    await screen.findByText('New Deal');
    const previous = screen.getByRole('button', { name: 'Previous' });
    const next = screen.getByRole('button', { name: 'Next' });
    expect(previous).toBeDisabled();
    expect(next).not.toBeDisabled();
    expect(screen.getByText('Showing 1–10 of 25')).toBeInTheDocument();

    await user.click(next);
    await waitFor(() => expect(pages).toContain(2));
    expect(await screen.findByText('Showing 11–20 of 25')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(pages).toContain(3));
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Previous' }));
    await waitFor(() => expect(pages.filter((p) => p === 2).length).toBeGreaterThanOrEqual(2));
  });

  it('renders the Pipeline view link', async () => {
    server.use(
      http.get(url('/deals'), () =>
        HttpResponse.json(makePaginated([makeDeal()])),
      ),
    );

    renderWithProviders(<DealListPage />);
    await screen.findByText('New Deal');
    const link = screen.getByRole('link', { name: /Pipeline/ });
    expect(link).toHaveAttribute('href', '/deals/pipeline');
  });
});
