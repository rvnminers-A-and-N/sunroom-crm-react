import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse, delay } from 'msw';
import { Routes, Route } from 'react-router-dom';
import { server } from '../../../tests/msw/server';
import { url } from '../../../tests/msw/handlers/url';
import { renderWithProviders } from '../../../tests/utils/render';
import {
  makeActivity,
  makeCompany,
  makeContactDetail,
  makeDeal,
  makePaginated,
  makeTag,
} from '../../../tests/msw/data/factories';
import ContactDetailPage from './contact-detail-page';

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

vi.mock('./contact-form-dialog', () => ({
  ContactFormDialog: ({
    open,
    onClose,
  }: {
    open: boolean;
    onClose: () => void;
  }) =>
    open ? (
      <div data-testid="contact-form-dialog">
        <button type="button" onClick={onClose}>
          close-form
        </button>
      </div>
    ) : null,
}));

function renderDetail(id: number = 1) {
  return renderWithProviders(
    <Routes>
      <Route path="/contacts/:id" element={<ContactDetailPage />} />
    </Routes>,
    { route: `/contacts/${id}` },
  );
}

describe('ContactDetailPage', () => {
  beforeEach(async () => {
    navigateMock.mockReset();
    const { toast } = await import('sonner');
    vi.mocked(toast.success).mockClear();
  });

  it('renders the loading skeleton while the contact is fetched', async () => {
    server.use(
      http.get(url('/contacts/1'), async () => {
        await delay(40);
        return HttpResponse.json(makeContactDetail());
      }),
    );

    const { container } = renderDetail(1);

    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });
  });

  it('renders nothing when the contact response is null', async () => {
    server.use(
      http.get(url('/contacts/1'), () =>
        HttpResponse.json(null),
      ),
    );

    const { container } = renderDetail(1);

    await waitFor(() => {
      // Wait until skeleton is gone (loading complete)
      expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBe(0);
    });
    expect(container.firstChild).toBeNull();
  });

  it('renders header info, info card with tags and notes, and deals tab content', async () => {
    server.use(
      http.get(url('/contacts/1'), () =>
        HttpResponse.json(
          makeContactDetail({
            id: 1,
            firstName: 'Alice',
            lastName: 'Smith',
            email: 'alice@example.com',
            phone: '555-1234',
            title: 'CEO',
            notes: 'Likes coffee',
            lastContactedAt: '2024-01-15T00:00:00Z',
            company: makeCompany({ id: 4, name: 'Globex' }),
            tags: [makeTag({ id: 1, name: 'VIP' })],
            deals: [
              makeDeal({ id: 1, title: 'Big Deal', value: 50000, stage: 'Won' }),
              makeDeal({ id: 2, title: 'Small Deal', value: 1000, stage: 'WeirdStage' }),
            ],
            activities: [],
          }),
        ),
      ),
    );

    renderDetail(1);

    expect(await screen.findByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('CEO')).toBeInTheDocument();
    const companyLink = screen.getByRole('link', { name: /Globex/ });
    expect(companyLink).toHaveAttribute('href', '/companies/4');

    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('555-1234')).toBeInTheDocument();
    expect(screen.getByText(/Added /)).toBeInTheDocument();
    expect(screen.getByText(/Last contacted/)).toBeInTheDocument();
    expect(screen.getByText('VIP')).toBeInTheDocument();
    expect(screen.getByText('Likes coffee')).toBeInTheDocument();

    // Deals tab is the default — both deals should be present
    expect(screen.getByText('Big Deal')).toBeInTheDocument();
    expect(screen.getByText('Small Deal')).toBeInTheDocument();
    // The known stage uses the mapped style; the unknown stage falls through to the default
    expect(screen.getByText('Won')).toBeInTheDocument();
    expect(screen.getByText('WeirdStage')).toBeInTheDocument();
    expect(screen.getByText('Deals (2)')).toBeInTheDocument();
    expect(screen.getByText('Activities (0)')).toBeInTheDocument();
  });

  it('renders fallback labels when optional fields are missing', async () => {
    server.use(
      http.get(url('/contacts/1'), () =>
        HttpResponse.json(
          makeContactDetail({
            id: 1,
            firstName: 'Pat',
            lastName: 'Doe',
            email: null,
            phone: null,
            title: null,
            notes: null,
            lastContactedAt: null,
            company: null,
            tags: [],
            deals: [],
            activities: [],
          }),
        ),
      ),
    );

    renderDetail(1);

    expect(await screen.findByText('Pat Doe')).toBeInTheDocument();
    expect(screen.getByText('No email')).toBeInTheDocument();
    expect(screen.getByText('No phone')).toBeInTheDocument();
    expect(screen.queryByText(/Last contacted/)).not.toBeInTheDocument();
    expect(screen.getByText('No deals yet')).toBeInTheDocument();
  });

  it('shows the empty activities message and renders activities when present', async () => {
    server.use(
      http.get(url('/contacts/1'), () =>
        HttpResponse.json(
          makeContactDetail({
            activities: [],
          }),
        ),
      ),
    );

    const user = userEvent.setup();
    renderDetail(1);

    await screen.findByText('Jane Doe');
    await user.click(screen.getByRole('tab', { name: /Activities/ }));
    expect(await screen.findByText('No activities yet')).toBeInTheDocument();

    // Re-fetch with an activity for the populated branch
    server.use(
      http.get(url('/contacts/1'), () =>
        HttpResponse.json(
          makeContactDetail({
            activities: [
              makeActivity({ id: 1, type: 'Call', subject: 'Intro call' }),
            ],
          }),
        ),
      ),
    );
  });

  it('renders activities content when there are activities', async () => {
    server.use(
      http.get(url('/contacts/1'), () =>
        HttpResponse.json(
          makeContactDetail({
            deals: [],
            activities: [
              makeActivity({
                id: 1,
                type: 'Call',
                subject: 'Intro call',
                occurredAt: '2024-01-02T00:00:00Z',
              }),
            ],
          }),
        ),
      ),
    );

    const user = userEvent.setup();
    renderDetail(1);

    await screen.findByText('Jane Doe');
    await user.click(screen.getByRole('tab', { name: /Activities/ }));
    expect(await screen.findByText('Intro call')).toBeInTheDocument();
  });

  it('navigates back to /contacts when the back button is clicked', async () => {
    server.use(
      http.get(url('/contacts/1'), () =>
        HttpResponse.json(makeContactDetail()),
      ),
    );

    const user = userEvent.setup();
    const { container } = renderDetail(1);

    await screen.findByText('Jane Doe');
    const backButton = container.querySelector('button')!;
    await user.click(backButton);
    expect(navigateMock).toHaveBeenCalledWith('/contacts');
  });

  it('opens the edit dialog and closes it', async () => {
    server.use(
      http.get(url('/contacts/1'), () =>
        HttpResponse.json(makeContactDetail()),
      ),
    );

    const user = userEvent.setup();
    renderDetail(1);

    await screen.findByText('Jane Doe');
    await user.click(screen.getByRole('button', { name: /Edit/ }));
    expect(screen.getByTestId('contact-form-dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'close-form' }));
    expect(screen.queryByTestId('contact-form-dialog')).not.toBeInTheDocument();
  });

  it('opens the delete confirm dialog, deletes, toasts, and navigates back', async () => {
    let deleteCalled = false;
    server.use(
      http.get(url('/contacts/1'), () =>
        HttpResponse.json(makeContactDetail({ id: 1 })),
      ),
      http.delete(url('/contacts/1'), () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    renderDetail(1);

    await screen.findByText('Jane Doe');
    await user.click(screen.getByRole('button', { name: /Delete/ }));

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText(/Are you sure you want to delete Jane Doe/),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(deleteCalled).toBe(true));
    const { toast } = await import('sonner');
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Contact deleted'),
    );
    expect(navigateMock).toHaveBeenCalledWith('/contacts');
  });
});
