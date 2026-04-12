import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse, delay } from 'msw';
import { server } from '../../../tests/msw/server';
import { url } from '../../../tests/msw/handlers/url';
import { renderWithProviders } from '../../../tests/utils/render';
import {
  makeContact,
  makePaginated,
  makeTag,
} from '../../../tests/msw/data/factories';
import ContactListPage from './contact-list-page';

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

// Avoid the heavy ContactFormDialog when testing the list page
vi.mock('./contact-form-dialog', () => ({
  ContactFormDialog: ({
    open,
    onClose,
    contact,
  }: {
    open: boolean;
    onClose: () => void;
    contact: { id: number; firstName: string } | null;
  }) =>
    open ? (
      <div data-testid="contact-form-dialog">
        <span>{contact ? `editing-${contact.id}` : 'creating'}</span>
        <button type="button" onClick={onClose}>
          close-dialog
        </button>
      </div>
    ) : null,
}));

// Light wrapper around the real ConfirmDialog that always exposes the onConfirm
// callback as a hidden button so the early-return branch in handleDelete is reachable.
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

describe('ContactListPage', () => {
  beforeEach(async () => {
    navigateMock.mockReset();
    const { toast } = await import('sonner');
    vi.mocked(toast.success).mockClear();
  });

  it('renders header total and a single contact row', async () => {
    server.use(
      http.get(url('/contacts'), () =>
        HttpResponse.json(
          makePaginated(
            [
              makeContact({
                id: 1,
                firstName: 'Jane',
                lastName: 'Doe',
                email: 'jane@example.com',
                phone: '555-1234',
                companyName: 'Acme Inc',
                title: 'CEO',
                tags: [makeTag({ id: 1, name: 'VIP' })],
              }),
            ],
            { total: 1, lastPage: 1 },
          ),
        ),
      ),
    );

    renderWithProviders(<ContactListPage />);

    expect(await screen.findByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('1 total')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('555-1234')).toBeInTheDocument();
    expect(screen.getByText('Acme Inc')).toBeInTheDocument();
    expect(screen.getByText('CEO')).toBeInTheDocument();
    expect(screen.getByText('VIP')).toBeInTheDocument();
  });

  it('renders em-dash placeholders when contact fields are blank', async () => {
    server.use(
      http.get(url('/contacts'), () =>
        HttpResponse.json(
          makePaginated([
            makeContact({
              id: 2,
              firstName: 'No',
              lastName: 'Info',
              email: null,
              phone: null,
              companyName: null,
              title: null,
              tags: [],
            }),
          ]),
        ),
      ),
    );

    renderWithProviders(<ContactListPage />);

    expect(await screen.findByText('No Info')).toBeInTheDocument();
    // 3 cells (email, phone, company) all show em-dash
    expect(screen.getAllByText('—')).toHaveLength(3);
  });

  it('shows the loading skeleton until data resolves', async () => {
    server.use(
      http.get(url('/contacts'), async () => {
        await delay(40);
        return HttpResponse.json(makePaginated([makeContact()]));
      }),
    );

    const { container } = renderWithProviders(<ContactListPage />);

    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);

    expect(await screen.findByText('Jane Doe')).toBeInTheDocument();
  });

  it('shows the empty state when there are no contacts', async () => {
    server.use(
      http.get(url('/contacts'), () => HttpResponse.json(makePaginated([]))),
    );

    renderWithProviders(<ContactListPage />);

    expect(await screen.findByText('No contacts yet')).toBeInTheDocument();
    const empty = screen.getByText('No contacts yet').closest('div')!;
    const addButton = within(empty).getByRole('button', { name: /add contact/i });

    const user = userEvent.setup();
    await user.click(addButton);

    expect(screen.getByTestId('contact-form-dialog')).toHaveTextContent('creating');
  });

  it('navigates to the detail page when a row is clicked', async () => {
    server.use(
      http.get(url('/contacts'), () =>
        HttpResponse.json(makePaginated([makeContact({ id: 42 })])),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<ContactListPage />);

    const nameCell = await screen.findByText('Jane Doe');
    await user.click(nameCell);

    expect(navigateMock).toHaveBeenCalledWith('/contacts/42');
  });

  it('opens the edit dialog without navigating when the pencil button is clicked', async () => {
    server.use(
      http.get(url('/contacts'), () =>
        HttpResponse.json(makePaginated([makeContact({ id: 7 })])),
      ),
    );

    const user = userEvent.setup();
    const { container } = renderWithProviders(<ContactListPage />);

    await screen.findByText('Jane Doe');

    const buttons = container.querySelectorAll('tbody button');
    expect(buttons.length).toBe(2);
    await user.click(buttons[0] as HTMLElement);

    expect(navigateMock).not.toHaveBeenCalled();
    expect(screen.getByTestId('contact-form-dialog')).toHaveTextContent('editing-7');
  });

  it('opens the delete confirm dialog and triggers deletion', async () => {
    let deleteCalled = false;
    server.use(
      http.get(url('/contacts'), () =>
        HttpResponse.json(makePaginated([makeContact({ id: 9 })])),
      ),
      http.delete(url('/contacts/9'), () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    const { container } = renderWithProviders(<ContactListPage />);

    await screen.findByText('Jane Doe');

    const buttons = container.querySelectorAll('tbody button');
    await user.click(buttons[1] as HTMLElement);

    expect(navigateMock).not.toHaveBeenCalled();
    const confirmDialog = await screen.findByRole('dialog');
    expect(
      within(confirmDialog).getByText(
        /Are you sure you want to delete Jane Doe/,
      ),
    ).toBeInTheDocument();

    await user.click(within(confirmDialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(deleteCalled).toBe(true));
    const { toast } = await import('sonner');
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Contact deleted'));
  });

  it('returns early from handleDelete when no contact is selected', async () => {
    server.use(
      http.get(url('/contacts'), () =>
        HttpResponse.json(makePaginated([makeContact()])),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<ContactListPage />);

    await screen.findByText('Jane Doe');
    // Force-confirm without ever opening the delete dialog. handleDelete sees
    // deleteTarget === null and short-circuits without calling the API.
    await user.click(screen.getByTestId('force-confirm'));
    const { toast } = await import('sonner');
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('opens the create dialog from the page header action', async () => {
    server.use(
      http.get(url('/contacts'), () =>
        HttpResponse.json(makePaginated([makeContact()])),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<ContactListPage />);

    await screen.findByText('Jane Doe');

    const headerAddButtons = screen.getAllByRole('button', { name: /add contact/i });
    await user.click(headerAddButtons[0]);

    expect(screen.getByTestId('contact-form-dialog')).toHaveTextContent('creating');

    await user.click(screen.getByRole('button', { name: 'close-dialog' }));
    expect(screen.queryByTestId('contact-form-dialog')).not.toBeInTheDocument();
  });

  it('debounces the search input and reissues the query', async () => {
    const requests: string[] = [];
    server.use(
      http.get(url('/contacts'), ({ request }) => {
        const search = new URL(request.url).searchParams.get('search');
        requests.push(search ?? '');
        return HttpResponse.json(makePaginated([makeContact()]));
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ContactListPage />);

    await screen.findByText('Jane Doe');
    const initialCount = requests.length;

    const searchInput = screen.getByPlaceholderText('Search by name or email...');
    await user.type(searchInput, 'jane');

    await waitFor(
      () => {
        expect(requests.some((s) => s === 'jane')).toBe(true);
      },
      { timeout: 2000 },
    );
    expect(requests.length).toBeGreaterThan(initialCount);
  });

  it('filters by tag and resets the page back to 1', async () => {
    const calls: { tagId: string | null; page: string | null }[] = [];
    server.use(
      http.get(url('/tags'), () =>
        HttpResponse.json([
          makeTag({ id: 1, name: 'VIP' }),
          makeTag({ id: 2, name: 'Lead' }),
        ]),
      ),
      http.get(url('/contacts'), ({ request }) => {
        const u = new URL(request.url);
        calls.push({
          tagId: u.searchParams.get('tagId'),
          page: u.searchParams.get('page'),
        });
        return HttpResponse.json(makePaginated([makeContact()]));
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ContactListPage />);

    await screen.findByText('Jane Doe');

    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    const lead = await screen.findByRole('option', { name: 'Lead' });
    await user.click(lead);

    await waitFor(() => {
      expect(calls.some((c) => c.tagId === '2')).toBe(true);
    });

    // Switching back to "All tags" sends no tagId
    await user.click(screen.getByRole('combobox'));
    const allOption = await screen.findByRole('option', { name: 'All tags' });
    await user.click(allOption);

    await waitFor(() => {
      // Last call should not include tagId
      const last = calls[calls.length - 1];
      expect(last.tagId).toBeNull();
    });
  });

  it('paginates with the Previous and Next buttons', async () => {
    const pages: number[] = [];
    server.use(
      http.get(url('/contacts'), ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page') ?? '1');
        pages.push(page);
        return HttpResponse.json(
          makePaginated([makeContact({ id: page })], {
            currentPage: page,
            perPage: 10,
            total: 25,
            lastPage: 3,
          }),
        );
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ContactListPage />);

    await screen.findByText('Jane Doe');

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
    await waitFor(() => expect(pages.filter((p) => p === 2).length).toBeGreaterThanOrEqual(2));
  });
});
