import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse, delay } from 'msw';
import { server } from '../../../tests/msw/server';
import { url } from '../../../tests/msw/handlers/url';
import { renderWithProviders } from '../../../tests/utils/render';
import { makeCompany, makePaginated } from '../../../tests/msw/data/factories';
import CompanyListPage from './company-list-page';

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

vi.mock('./company-form-dialog', () => ({
  CompanyFormDialog: ({
    open,
    onClose,
    company,
  }: {
    open: boolean;
    onClose: () => void;
    company: { id: number; name: string } | null;
  }) =>
    open ? (
      <div data-testid="company-form-dialog">
        <span>{company ? `editing-${company.id}` : 'creating'}</span>
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

describe('CompanyListPage', () => {
  beforeEach(async () => {
    navigateMock.mockReset();
    const { toast } = await import('sonner');
    vi.mocked(toast.success).mockClear();
  });

  it('renders header total and a single company row', async () => {
    server.use(
      http.get(url('/companies'), () =>
        HttpResponse.json(
          makePaginated(
            [
              makeCompany({
                id: 1,
                name: 'Acme Inc',
                industry: 'Tech',
                city: 'Austin',
                state: 'TX',
                contactCount: 5,
                dealCount: 3,
              }),
            ],
            { total: 1 },
          ),
        ),
      ),
    );

    renderWithProviders(<CompanyListPage />);

    expect(await screen.findByText('Acme Inc')).toBeInTheDocument();
    expect(screen.getByText('1 total')).toBeInTheDocument();
    expect(screen.getByText('Tech')).toBeInTheDocument();
    expect(screen.getByText('Austin, TX')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('formats location with city only or state only or em-dash when missing', async () => {
    server.use(
      http.get(url('/companies'), () =>
        HttpResponse.json(
          makePaginated([
            makeCompany({ id: 1, name: 'CityOnly', city: 'NYC', state: null }),
            makeCompany({ id: 2, name: 'StateOnly', city: null, state: 'CA' }),
            makeCompany({
              id: 3,
              name: 'NoLocation',
              city: null,
              state: null,
              industry: null,
            }),
          ]),
        ),
      ),
    );

    renderWithProviders(<CompanyListPage />);

    expect(await screen.findByText('CityOnly')).toBeInTheDocument();
    expect(screen.getByText('NYC')).toBeInTheDocument();
    expect(screen.getByText('CA')).toBeInTheDocument();
    // NoLocation row has em-dash for industry AND location
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
  });

  it('shows the loading skeleton until data resolves', async () => {
    server.use(
      http.get(url('/companies'), async () => {
        await delay(40);
        return HttpResponse.json(makePaginated([makeCompany()]));
      }),
    );

    const { container } = renderWithProviders(<CompanyListPage />);
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
    expect(await screen.findByText('Acme Inc')).toBeInTheDocument();
  });

  it('shows the empty state and opens the create dialog from it', async () => {
    server.use(
      http.get(url('/companies'), () =>
        HttpResponse.json(makePaginated([])),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<CompanyListPage />);

    expect(await screen.findByText('No companies yet')).toBeInTheDocument();
    const empty = screen.getByText('No companies yet').closest('div')!;
    const addButton = within(empty).getByRole('button', { name: /add company/i });
    await user.click(addButton);
    expect(screen.getByTestId('company-form-dialog')).toHaveTextContent('creating');
  });

  it('navigates to the detail page when a row is clicked', async () => {
    server.use(
      http.get(url('/companies'), () =>
        HttpResponse.json(makePaginated([makeCompany({ id: 88 })])),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<CompanyListPage />);

    await user.click(await screen.findByText('Acme Inc'));
    expect(navigateMock).toHaveBeenCalledWith('/companies/88');
  });

  it('opens the edit dialog without navigating', async () => {
    server.use(
      http.get(url('/companies'), () =>
        HttpResponse.json(makePaginated([makeCompany({ id: 4 })])),
      ),
    );

    const user = userEvent.setup();
    const { container } = renderWithProviders(<CompanyListPage />);

    await screen.findByText('Acme Inc');
    const buttons = container.querySelectorAll('tbody button');
    expect(buttons.length).toBe(2);
    await user.click(buttons[0] as HTMLElement);

    expect(navigateMock).not.toHaveBeenCalled();
    expect(screen.getByTestId('company-form-dialog')).toHaveTextContent('editing-4');
  });

  it('opens the delete confirm dialog and triggers deletion', async () => {
    let deleteCalled = false;
    server.use(
      http.get(url('/companies'), () =>
        HttpResponse.json(makePaginated([makeCompany({ id: 9 })])),
      ),
      http.delete(url('/companies/9'), () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    const { container } = renderWithProviders(<CompanyListPage />);

    await screen.findByText('Acme Inc');
    const buttons = container.querySelectorAll('tbody button');
    await user.click(buttons[1] as HTMLElement);

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText(/Are you sure you want to delete Acme Inc/),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(deleteCalled).toBe(true));
    const { toast } = await import('sonner');
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Company deleted'));
  });

  it('returns early from handleDelete when no target is selected', async () => {
    server.use(
      http.get(url('/companies'), () =>
        HttpResponse.json(makePaginated([makeCompany()])),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<CompanyListPage />);

    await screen.findByText('Acme Inc');
    await user.click(screen.getByTestId('force-confirm'));
    const { toast } = await import('sonner');
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('opens the create dialog from the page header action', async () => {
    server.use(
      http.get(url('/companies'), () =>
        HttpResponse.json(makePaginated([makeCompany()])),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<CompanyListPage />);

    await screen.findByText('Acme Inc');
    const buttons = screen.getAllByRole('button', { name: /add company/i });
    await user.click(buttons[0]);

    expect(screen.getByTestId('company-form-dialog')).toHaveTextContent('creating');
    await user.click(screen.getByRole('button', { name: 'close-dialog' }));
    expect(screen.queryByTestId('company-form-dialog')).not.toBeInTheDocument();
  });

  it('debounces the search input and reissues the query', async () => {
    const requests: string[] = [];
    server.use(
      http.get(url('/companies'), ({ request }) => {
        const search = new URL(request.url).searchParams.get('search');
        requests.push(search ?? '');
        return HttpResponse.json(makePaginated([makeCompany()]));
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<CompanyListPage />);

    await screen.findByText('Acme Inc');
    const initial = requests.length;
    await user.type(screen.getByPlaceholderText('Search companies...'), 'acme');

    await waitFor(
      () => {
        expect(requests.some((s) => s === 'acme')).toBe(true);
      },
      { timeout: 2000 },
    );
    expect(requests.length).toBeGreaterThan(initial);
  });

  it('paginates with the Previous and Next buttons', async () => {
    const pages: number[] = [];
    server.use(
      http.get(url('/companies'), ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page') ?? '1');
        pages.push(page);
        return HttpResponse.json(
          makePaginated([makeCompany({ id: page })], {
            currentPage: page,
            perPage: 10,
            total: 25,
            lastPage: 3,
          }),
        );
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<CompanyListPage />);

    await screen.findByText('Acme Inc');
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
    expect(await screen.findByText('Showing 21–25 of 25')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Previous' }));
    await waitFor(() =>
      expect(pages.filter((p) => p === 2).length).toBeGreaterThanOrEqual(2),
    );
  });
});
