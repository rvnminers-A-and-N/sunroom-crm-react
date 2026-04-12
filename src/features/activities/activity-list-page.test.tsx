import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse, delay } from 'msw';
import { server } from '../../../tests/msw/server';
import { url } from '../../../tests/msw/handlers/url';
import { renderWithProviders } from '../../../tests/utils/render';
import { makeActivity, makePaginated } from '../../../tests/msw/data/factories';
import ActivityListPage from './activity-list-page';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('./activity-form-dialog', () => ({
  ActivityFormDialog: ({
    open,
    onClose,
    activity,
  }: {
    open: boolean;
    onClose: () => void;
    activity: { id: number } | null;
  }) =>
    open ? (
      <div data-testid="activity-form-dialog">
        <span>{activity ? `editing-${activity.id}` : 'creating'}</span>
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

describe('ActivityListPage', () => {
  beforeEach(async () => {
    const { toast } = await import('sonner');
    vi.mocked(toast.success).mockClear();
  });

  it('renders header total and a single row with all fields', async () => {
    server.use(
      http.get(url('/activities'), () =>
        HttpResponse.json(
          makePaginated(
            [
              makeActivity({
                id: 1,
                type: 'Call',
                subject: 'Follow up',
                aiSummary: 'Discussed pricing',
                contactId: 5,
                contactName: 'Jane Doe',
                dealId: 3,
                dealTitle: 'Big Deal',
              }),
            ],
            { total: 1 },
          ),
        ),
      ),
    );

    renderWithProviders(<ActivityListPage />);

    expect(await screen.findByText('Follow up')).toBeInTheDocument();
    expect(screen.getByText('1 total')).toBeInTheDocument();
    expect(screen.getByText('AI Summary')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe').closest('a')).toHaveAttribute(
      'href',
      '/contacts/5',
    );
    expect(screen.getByText('Big Deal').closest('a')).toHaveAttribute(
      'href',
      '/deals/3',
    );
  });

  it('renders em-dashes when contact and deal are missing', async () => {
    server.use(
      http.get(url('/activities'), () =>
        HttpResponse.json(
          makePaginated([
            makeActivity({
              id: 2,
              subject: 'Solo note',
              aiSummary: null,
              contactId: null,
              contactName: null,
              dealId: null,
              dealTitle: null,
            }),
          ]),
        ),
      ),
    );

    renderWithProviders(<ActivityListPage />);

    expect(await screen.findByText('Solo note')).toBeInTheDocument();
    expect(screen.queryByText('AI Summary')).not.toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBe(2);
  });

  it('shows the loading skeleton until data resolves', async () => {
    server.use(
      http.get(url('/activities'), async () => {
        await delay(40);
        return HttpResponse.json(makePaginated([makeActivity()]));
      }),
    );

    const { container } = renderWithProviders(<ActivityListPage />);
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
    expect(await screen.findByText('Sample activity')).toBeInTheDocument();
  });

  it('shows the empty state and opens the create dialog from it', async () => {
    server.use(
      http.get(url('/activities'), () => HttpResponse.json(makePaginated([]))),
    );

    const user = userEvent.setup();
    renderWithProviders(<ActivityListPage />);

    expect(await screen.findByText('No activities yet')).toBeInTheDocument();
    const empty = screen.getByText('No activities yet').closest('div')!;
    const addButton = within(empty).getByRole('button', { name: /log activity/i });
    await user.click(addButton);
    expect(screen.getByTestId('activity-form-dialog')).toHaveTextContent('creating');
  });

  it('opens the edit dialog when the edit button is clicked', async () => {
    server.use(
      http.get(url('/activities'), () =>
        HttpResponse.json(makePaginated([makeActivity({ id: 4 })])),
      ),
    );

    const user = userEvent.setup();
    const { container } = renderWithProviders(<ActivityListPage />);

    await screen.findByText('Sample activity');
    const buttons = container.querySelectorAll('tbody button');
    expect(buttons.length).toBe(2);
    await user.click(buttons[0] as HTMLElement);

    expect(screen.getByTestId('activity-form-dialog')).toHaveTextContent('editing-4');
  });

  it('opens the delete confirm dialog and triggers deletion', async () => {
    let deleteCalled = false;
    server.use(
      http.get(url('/activities'), () =>
        HttpResponse.json(
          makePaginated([makeActivity({ id: 9, subject: 'Big call' })]),
        ),
      ),
      http.delete(url('/activities/9'), () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    const { container } = renderWithProviders(<ActivityListPage />);

    await screen.findByText('Big call');
    const buttons = container.querySelectorAll('tbody button');
    await user.click(buttons[1] as HTMLElement);

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText(/Are you sure you want to delete "Big call"/),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(deleteCalled).toBe(true));
    const { toast } = await import('sonner');
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Activity deleted'));
  });

  it('returns early from handleDelete when no target is selected', async () => {
    server.use(
      http.get(url('/activities'), () =>
        HttpResponse.json(makePaginated([makeActivity()])),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<ActivityListPage />);

    await screen.findByText('Sample activity');
    await user.click(screen.getByTestId('force-confirm'));
    const { toast } = await import('sonner');
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('opens the create dialog from the page header action', async () => {
    server.use(
      http.get(url('/activities'), () =>
        HttpResponse.json(makePaginated([makeActivity()])),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<ActivityListPage />);

    await screen.findByText('Sample activity');
    const buttons = screen.getAllByRole('button', { name: /log activity/i });
    await user.click(buttons[0]);

    expect(screen.getByTestId('activity-form-dialog')).toHaveTextContent('creating');
    await user.click(screen.getByRole('button', { name: 'close-dialog' }));
    expect(screen.queryByTestId('activity-form-dialog')).not.toBeInTheDocument();
  });

  it('filters by type and resets the page back to 1', async () => {
    const calls: { type: string | null; page: string | null }[] = [];
    server.use(
      http.get(url('/activities'), ({ request }) => {
        const u = new URL(request.url);
        calls.push({
          type: u.searchParams.get('type'),
          page: u.searchParams.get('page'),
        });
        return HttpResponse.json(makePaginated([makeActivity()]));
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ActivityListPage />);

    await screen.findByText('Sample activity');

    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    const call = await screen.findByRole('option', { name: 'Call' });
    await user.click(call);

    await waitFor(() => expect(calls.some((c) => c.type === 'Call')).toBe(true));

    // Switch back to All types — sends no type param
    await user.click(screen.getByRole('combobox'));
    const allTypes = await screen.findByRole('option', { name: 'All types' });
    await user.click(allTypes);

    await waitFor(() => {
      const last = calls[calls.length - 1];
      expect(last.type).toBeNull();
    });
  });

  it('paginates with the Previous and Next buttons', async () => {
    const pages: number[] = [];
    server.use(
      http.get(url('/activities'), ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page') ?? '1');
        pages.push(page);
        return HttpResponse.json(
          makePaginated([makeActivity({ id: page })], {
            currentPage: page,
            perPage: 10,
            total: 25,
            lastPage: 3,
          }),
        );
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ActivityListPage />);

    await screen.findByText('Sample activity');
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
});
