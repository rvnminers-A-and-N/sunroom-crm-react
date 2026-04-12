import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse, delay } from 'msw';
import { server } from '../../../tests/msw/server';
import { url } from '../../../tests/msw/handlers/url';
import { renderWithProviders } from '../../../tests/utils/render';
import { makeCompany } from '../../../tests/msw/data/factories';
import { CompanyFormDialog } from './company-form-dialog';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('CompanyFormDialog', () => {
  beforeEach(async () => {
    const { toast } = await import('sonner');
    vi.mocked(toast.success).mockClear();
  });

  it('renders nothing when closed', () => {
    renderWithProviders(
      <CompanyFormDialog open={false} onClose={() => {}} />,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the create form with default empty fields', async () => {
    renderWithProviders(
      <CompanyFormDialog open={true} onClose={() => {}} />,
    );

    expect(await screen.findByText('New Company')).toBeInTheDocument();
    expect(
      screen.getByText('Fill in the details to create a new company.'),
    ).toBeInTheDocument();
    expect(
      (screen.getByLabelText('Company Name *') as HTMLInputElement).value,
    ).toBe('');
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('renders the edit form prefilled from the company prop', async () => {
    const company = makeCompany({
      id: 5,
      name: 'Globex',
      industry: 'Energy',
      website: 'https://globex.test',
      phone: '555-1111',
      city: 'Springfield',
      state: 'IL',
    });

    renderWithProviders(
      <CompanyFormDialog open={true} onClose={() => {}} company={company} />,
    );

    expect(await screen.findByText('Edit Company')).toBeInTheDocument();
    expect(
      screen.getByText('Update the company details below.'),
    ).toBeInTheDocument();
    expect((screen.getByLabelText('Company Name *') as HTMLInputElement).value).toBe('Globex');
    expect((screen.getByLabelText('Industry') as HTMLInputElement).value).toBe('Energy');
    expect((screen.getByLabelText('Website') as HTMLInputElement).value).toBe('https://globex.test');
    expect((screen.getByLabelText('Phone') as HTMLInputElement).value).toBe('555-1111');
    expect((screen.getByLabelText('City') as HTMLInputElement).value).toBe('Springfield');
    expect((screen.getByLabelText('State') as HTMLInputElement).value).toBe('IL');
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('shows a validation error when the name is missing', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CompanyFormDialog open={true} onClose={() => {}} />,
    );

    const name = await screen.findByLabelText('Company Name *');
    const form = name.closest('form') as HTMLFormElement;
    form.noValidate = true;

    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Company name is required')).toBeInTheDocument();
  });

  it('submits a create request and closes on success', async () => {
    let createdBody: Record<string, unknown> | null = null;
    server.use(
      http.post(url('/companies'), async ({ request }) => {
        createdBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(makeCompany({ id: 99 }));
      }),
    );

    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(
      <CompanyFormDialog open={true} onClose={onClose} />,
    );

    await screen.findByText('New Company');
    await user.type(screen.getByLabelText('Company Name *'), 'Acme');
    await user.type(screen.getByLabelText('Industry'), 'Tech');
    await user.type(screen.getByLabelText('Website'), 'https://acme.test');
    await user.type(screen.getByLabelText('Phone'), '555-2222');
    await user.type(screen.getByLabelText('Address'), '123 Main');
    await user.type(screen.getByLabelText('City'), 'Austin');
    await user.type(screen.getByLabelText('State'), 'TX');
    await user.type(screen.getByLabelText('ZIP'), '78701');
    await user.type(screen.getByLabelText('Notes'), 'Top customer');

    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(createdBody).not.toBeNull());
    expect(createdBody).toMatchObject({
      name: 'Acme',
      industry: 'Tech',
      website: 'https://acme.test',
      phone: '555-2222',
      address: '123 Main',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
      notes: 'Top customer',
    });

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    const { toast } = await import('sonner');
    expect(toast.success).toHaveBeenCalledWith('Company created');
  });

  it('drops empty optional fields when creating', async () => {
    let createdBody: Record<string, unknown> | null = null;
    server.use(
      http.post(url('/companies'), async ({ request }) => {
        createdBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(makeCompany({ id: 100 }));
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<CompanyFormDialog open={true} onClose={() => {}} />);

    await screen.findByText('New Company');
    await user.type(screen.getByLabelText('Company Name *'), 'Bare');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(createdBody).not.toBeNull());
    const body = createdBody as Record<string, unknown>;
    expect(body.name).toBe('Bare');
    expect(body.industry).toBeUndefined();
    expect(body.website).toBeUndefined();
    expect(body.phone).toBeUndefined();
    expect(body.address).toBeUndefined();
    expect(body.city).toBeUndefined();
    expect(body.state).toBeUndefined();
    expect(body.zip).toBeUndefined();
    expect(body.notes).toBeUndefined();
  });

  it('submits an update request and closes on success', async () => {
    let updateBody: Record<string, unknown> | null = null;
    server.use(
      http.put(url('/companies/5'), async ({ request }) => {
        updateBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(makeCompany({ id: 5 }));
      }),
    );

    const user = userEvent.setup();
    const onClose = vi.fn();
    const company = makeCompany({
      id: 5,
      name: 'Old Co',
      industry: 'Old Industry',
    });

    renderWithProviders(
      <CompanyFormDialog open={true} onClose={onClose} company={company} />,
    );

    await screen.findByText('Edit Company');
    const name = screen.getByLabelText('Company Name *') as HTMLInputElement;
    await user.clear(name);
    await user.type(name, 'New Co');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(updateBody).not.toBeNull());
    expect((updateBody as Record<string, unknown>).name).toBe('New Co');
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    const { toast } = await import('sonner');
    expect(toast.success).toHaveBeenCalledWith('Company updated');
  });

  it('disables the submit button and shows a spinner while saving', async () => {
    server.use(
      http.post(url('/companies'), async () => {
        await delay('infinite');
        return HttpResponse.json(makeCompany({ id: 11 }));
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<CompanyFormDialog open={true} onClose={() => {}} />);

    await screen.findByText('New Company');
    await user.type(screen.getByLabelText('Company Name *'), 'Spinning');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /Create/ }) as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
      expect(document.querySelector('.animate-spin')).not.toBeNull();
    });
  });

  it('closes when the Cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(
      <CompanyFormDialog open={true} onClose={onClose} />,
    );

    await screen.findByText('New Company');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Escape is pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(
      <CompanyFormDialog open={true} onClose={onClose} />,
    );

    await screen.findByText('New Company');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
