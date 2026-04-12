import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse, delay } from 'msw';
import { Routes, Route } from 'react-router-dom';
import { server } from '../../../tests/msw/server';
import { url } from '../../../tests/msw/handlers/url';
import { renderWithProviders } from '../../../tests/utils/render';
import {
  makeCompanyDetail,
  makeContact,
  makeDeal,
} from '../../../tests/msw/data/factories';
import CompanyDetailPage from './company-detail-page';

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
  }: {
    open: boolean;
    onClose: () => void;
  }) =>
    open ? (
      <div data-testid="company-form-dialog">
        <button type="button" onClick={onClose}>
          close-form
        </button>
      </div>
    ) : null,
}));

function renderDetail(id: number = 1) {
  return renderWithProviders(
    <Routes>
      <Route path="/companies/:id" element={<CompanyDetailPage />} />
    </Routes>,
    { route: `/companies/${id}` },
  );
}

describe('CompanyDetailPage', () => {
  beforeEach(async () => {
    navigateMock.mockReset();
    const { toast } = await import('sonner');
    vi.mocked(toast.success).mockClear();
  });

  it('renders the loading skeleton while the company is fetched', async () => {
    server.use(
      http.get(url('/companies/1'), async () => {
        await delay(40);
        return HttpResponse.json(makeCompanyDetail());
      }),
    );

    const { container } = renderDetail(1);
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
    await waitFor(() => {
      expect(screen.getByText('Acme Inc')).toBeInTheDocument();
    });
  });

  it('renders nothing when the company response is null', async () => {
    server.use(
      http.get(url('/companies/1'), () => HttpResponse.json(null)),
    );

    const { container } = renderDetail(1);
    await waitFor(() => {
      expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBe(0);
    });
    expect(container.firstChild).toBeNull();
  });

  it('renders header info, full info card, contacts and deals tables', async () => {
    server.use(
      http.get(url('/companies/1'), () =>
        HttpResponse.json(
          makeCompanyDetail({
            id: 1,
            name: 'Acme Inc',
            industry: 'Tech',
            website: 'https://acme.test',
            phone: '555-1234',
            address: '123 Main St',
            city: 'Austin',
            state: 'TX',
            zip: '78701',
            notes: 'Important client',
            contacts: [
              makeContact({
                id: 1,
                firstName: 'Jane',
                lastName: 'Doe',
                email: 'jane@example.com',
                title: 'CEO',
              }),
            ],
            deals: [
              makeDeal({ id: 1, title: 'Big Deal', value: 50000, stage: 'Won' }),
              makeDeal({
                id: 2,
                title: 'Strange Deal',
                value: 1000,
                stage: 'WeirdStage',
              }),
            ],
          }),
        ),
      ),
    );

    renderDetail(1);

    expect(await screen.findByText('Acme Inc')).toBeInTheDocument();
    expect(screen.getByText('Tech')).toBeInTheDocument();

    const websiteLink = screen.getByRole('link', { name: 'https://acme.test' });
    expect(websiteLink).toHaveAttribute('href', 'https://acme.test');
    expect(websiteLink).toHaveAttribute('target', '_blank');

    expect(screen.getByText('555-1234')).toBeInTheDocument();
    expect(screen.getByText('123 Main St, Austin, TX, 78701')).toBeInTheDocument();
    expect(screen.getByText(/Added /)).toBeInTheDocument();
    expect(screen.getByText('Important client')).toBeInTheDocument();

    expect(screen.getByText('Contacts (1)')).toBeInTheDocument();
    const contactLink = screen.getByRole('link', { name: 'Jane Doe' });
    expect(contactLink).toHaveAttribute('href', '/contacts/1');
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('CEO')).toBeInTheDocument();

    expect(screen.getByText('Deals (2)')).toBeInTheDocument();
    expect(screen.getByText('Big Deal')).toBeInTheDocument();
    expect(screen.getByText('Strange Deal')).toBeInTheDocument();
    expect(screen.getByText('Won')).toBeInTheDocument();
    expect(screen.getByText('WeirdStage')).toBeInTheDocument();
  });

  it('renders em-dash placeholders for contacts with missing fields', async () => {
    server.use(
      http.get(url('/companies/1'), () =>
        HttpResponse.json(
          makeCompanyDetail({
            contacts: [
              makeContact({
                id: 1,
                firstName: 'No',
                lastName: 'Email',
                email: null,
                title: null,
              }),
            ],
            deals: [],
          }),
        ),
      ),
    );

    renderDetail(1);

    expect(await screen.findByText('No Email')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('No deals with this company')).toBeInTheDocument();
  });

  it('renders empty messages and hides info rows when fields are missing', async () => {
    server.use(
      http.get(url('/companies/1'), () =>
        HttpResponse.json(
          makeCompanyDetail({
            name: 'Bare',
            industry: null,
            website: null,
            phone: null,
            address: null,
            city: null,
            state: null,
            zip: null,
            notes: null,
            contacts: [],
            deals: [],
          }),
        ),
      ),
    );

    renderDetail(1);

    expect(await screen.findByText('Bare')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /https:/ })).not.toBeInTheDocument();
    expect(screen.getByText('No contacts at this company')).toBeInTheDocument();
    expect(screen.getByText('No deals with this company')).toBeInTheDocument();
  });

  it('navigates back to /companies when the back button is clicked', async () => {
    server.use(
      http.get(url('/companies/1'), () =>
        HttpResponse.json(makeCompanyDetail()),
      ),
    );

    const user = userEvent.setup();
    const { container } = renderDetail(1);

    await screen.findByText('Acme Inc');
    const backButton = container.querySelector('button')!;
    await user.click(backButton);
    expect(navigateMock).toHaveBeenCalledWith('/companies');
  });

  it('opens the edit dialog and closes it', async () => {
    server.use(
      http.get(url('/companies/1'), () =>
        HttpResponse.json(makeCompanyDetail()),
      ),
    );

    const user = userEvent.setup();
    renderDetail(1);

    await screen.findByText('Acme Inc');
    await user.click(screen.getByRole('button', { name: /Edit/ }));
    expect(screen.getByTestId('company-form-dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'close-form' }));
    expect(screen.queryByTestId('company-form-dialog')).not.toBeInTheDocument();
  });

  it('opens the delete confirm dialog, deletes, toasts, and navigates back', async () => {
    let deleteCalled = false;
    server.use(
      http.get(url('/companies/1'), () =>
        HttpResponse.json(makeCompanyDetail({ id: 1, name: 'Acme Inc' })),
      ),
      http.delete(url('/companies/1'), () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    renderDetail(1);

    await screen.findByText('Acme Inc');
    await user.click(screen.getByRole('button', { name: /Delete/ }));

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText(/Are you sure you want to delete Acme Inc/),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(deleteCalled).toBe(true));
    const { toast } = await import('sonner');
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Company deleted'),
    );
    expect(navigateMock).toHaveBeenCalledWith('/companies');
  });
});
