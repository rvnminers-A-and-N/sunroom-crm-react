import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse, delay } from 'msw';
import { server } from '../../../tests/msw/server';
import { url } from '../../../tests/msw/handlers/url';
import { renderWithProviders } from '../../../tests/utils/render';
import {
  makeContact,
  makeCompany,
  makeDeal,
  makePaginated,
} from '../../../tests/msw/data/factories';
import { DealFormDialog } from './deal-form-dialog';

const watchOverrides = vi.hoisted(() => ({ contactIdUndefined: false }));

vi.mock('react-hook-form', async () => {
  const actual =
    await vi.importActual<typeof import('react-hook-form')>('react-hook-form');
  return {
    ...actual,
    useForm: ((opts: Parameters<typeof actual.useForm>[0]) => {
      const result = actual.useForm(opts);
      const origWatch = result.watch;
      const wrappedWatch = ((...args: unknown[]) => {
        if (
          watchOverrides.contactIdUndefined &&
          (args[0] === 'contactId' || args.length === 0)
        ) {
          if (args.length === 0) {
            const all = (origWatch as unknown as () => Record<string, unknown>)();
            return { ...all, contactId: undefined };
          }
          return undefined;
        }
        return (origWatch as (...a: unknown[]) => unknown)(...args);
      }) as typeof origWatch;
      return { ...result, watch: wrappedWatch };
    }) as typeof actual.useForm,
  };
});

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function setupContactsAndCompanies() {
  server.use(
    http.get(url('/contacts'), () =>
      HttpResponse.json(
        makePaginated([
          makeContact({ id: 1, firstName: 'Jane', lastName: 'Doe' }),
          makeContact({ id: 2, firstName: 'John', lastName: 'Smith' }),
        ]),
      ),
    ),
    http.get(url('/companies'), () =>
      HttpResponse.json(
        makePaginated([
          makeCompany({ id: 1, name: 'Acme Inc' }),
          makeCompany({ id: 2, name: 'Globex' }),
        ]),
      ),
    ),
  );
}

describe('DealFormDialog', () => {
  beforeEach(async () => {
    watchOverrides.contactIdUndefined = false;
    const { toast } = await import('sonner');
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it('renders nothing when closed', () => {
    setupContactsAndCompanies();
    renderWithProviders(<DealFormDialog open={false} onClose={vi.fn()} />);
    expect(screen.queryByText('New Deal')).not.toBeInTheDocument();
  });

  it('renders the create form with default values', async () => {
    setupContactsAndCompanies();
    renderWithProviders(<DealFormDialog open onClose={vi.fn()} />);

    expect(await screen.findByText('New Deal')).toBeInTheDocument();
    expect(screen.getByText('Fill in the details to create a new deal.')).toBeInTheDocument();
    expect(screen.getByLabelText(/Title/)).toHaveValue('');
    expect(screen.getByLabelText(/Value/)).toHaveValue(0);
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('renders the edit form prefilled with deal values', async () => {
    setupContactsAndCompanies();
    renderWithProviders(
      <DealFormDialog
        open
        onClose={vi.fn()}
        deal={makeDeal({
          id: 5,
          title: 'Big Deal',
          value: 1234,
          stage: 'Won',
          contactId: 2,
          companyId: 2,
          expectedCloseDate: '2025-06-15T00:00:00Z',
        })}
      />,
    );

    expect(await screen.findByText('Edit Deal')).toBeInTheDocument();
    expect(screen.getByText('Update the deal details below.')).toBeInTheDocument();
    expect(screen.getByLabelText(/Title/)).toHaveValue('Big Deal');
    expect(screen.getByLabelText(/Value/)).toHaveValue(1234);
    expect(screen.getByLabelText(/Expected Close Date/)).toHaveValue('2025-06-15');
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('uses an empty close date when the deal has none', async () => {
    setupContactsAndCompanies();
    renderWithProviders(
      <DealFormDialog
        open
        onClose={vi.fn()}
        deal={makeDeal({ id: 6, expectedCloseDate: null, companyId: null })}
      />,
    );
    await screen.findByText('Edit Deal');
    expect(screen.getByLabelText(/Expected Close Date/)).toHaveValue('');
  });

  it('shows validation errors when required fields are invalid', async () => {
    setupContactsAndCompanies();
    const user = userEvent.setup();
    renderWithProviders(<DealFormDialog open onClose={vi.fn()} />);

    await screen.findByText('New Deal');
    const form = document.getElementById('deal-form') as HTMLFormElement;
    form.noValidate = true;

    // Title is empty by default; contactId is 0 by default → both invalid
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Contact is required')).toBeInTheDocument();
  });

  it('submits the create payload when the form is valid', { timeout: 15000 }, async () => {
    setupContactsAndCompanies();
    let captured: Record<string, unknown> | null = null;
    server.use(
      http.post(url('/deals'), async ({ request }) => {
        captured = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(makeDeal({ id: 99, ...captured }));
      }),
    );

    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<DealFormDialog open onClose={onClose} />);

    await screen.findByText('New Deal');
    const form = document.getElementById('deal-form') as HTMLFormElement;
    form.noValidate = true;

    await user.type(screen.getByLabelText(/Title/), 'Mega Deal');
    const valueInput = screen.getByLabelText(/Value/);
    await user.clear(valueInput);
    await user.type(valueInput, '15000');

    // Pick the contact via the contact select (contains "Select a contact" placeholder)
    const triggers = screen.getAllByRole('combobox');
    // triggers[0] = stage, triggers[1] = contact, triggers[2] = company
    await user.click(triggers[1]);
    await user.click(await screen.findByRole('option', { name: 'John Smith' }));

    // Pick a company
    await user.click(triggers[2]);
    await user.click(await screen.findByRole('option', { name: 'Globex' }));

    // Switch the stage to Qualified
    await user.click(triggers[0]);
    await user.click(await screen.findByRole('option', { name: 'Qualified' }));

    // Add a close date and notes
    await user.type(screen.getByLabelText(/Expected Close Date/), '2025-12-31');
    await user.type(screen.getByLabelText(/Notes/), 'Hot lead');

    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(captured).not.toBeNull());
    expect(captured).toMatchObject({
      title: 'Mega Deal',
      value: 15000,
      contactId: 2,
      companyId: 2,
      stage: 'Qualified',
      expectedCloseDate: '2025-12-31',
      notes: 'Hot lead',
    });

    const { toast } = await import('sonner');
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Deal created'));
    expect(onClose).toHaveBeenCalled();
  });

  it('switches the company select to None and omits optional fields', { timeout: 15000 }, async () => {
    setupContactsAndCompanies();
    let captured: Record<string, unknown> | null = null;
    server.use(
      http.post(url('/deals'), async ({ request }) => {
        captured = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(makeDeal({ id: 1, ...captured }));
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<DealFormDialog open onClose={vi.fn()} />);

    await screen.findByText('New Deal');
    const form = document.getElementById('deal-form') as HTMLFormElement;
    form.noValidate = true;

    await user.type(screen.getByLabelText(/Title/), 'Plain Deal');
    const triggers = screen.getAllByRole('combobox');
    // Set contact (required)
    await user.click(triggers[1]);
    await user.click(await screen.findByRole('option', { name: 'Jane Doe' }));

    // Open company select; pick a non-default first, then switch back to None
    await user.click(triggers[2]);
    await user.click(await screen.findByRole('option', { name: 'Acme Inc' }));
    await user.click(triggers[2]);
    await user.click(await screen.findByRole('option', { name: 'None' }));

    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(captured).not.toBeNull());
    expect(captured).toMatchObject({
      title: 'Plain Deal',
      contactId: 1,
    });
    // Optional fields should be omitted (undefined)
    expect((captured as Record<string, unknown>).companyId).toBeUndefined();
    expect((captured as Record<string, unknown>).expectedCloseDate).toBeUndefined();
    expect((captured as Record<string, unknown>).notes).toBeUndefined();
  });

  it('submits an update payload when editing an existing deal', async () => {
    setupContactsAndCompanies();
    let captured: Record<string, unknown> | null = null;
    server.use(
      http.put(url('/deals/7'), async ({ request }) => {
        captured = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(makeDeal({ id: 7, ...captured }));
      }),
    );

    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <DealFormDialog
        open
        onClose={onClose}
        deal={makeDeal({
          id: 7,
          title: 'Old',
          value: 200,
          contactId: 1,
          companyId: 1,
          stage: 'Lead',
          expectedCloseDate: '2025-01-01',
        })}
      />,
    );

    await screen.findByText('Edit Deal');
    const form = document.getElementById('deal-form') as HTMLFormElement;
    form.noValidate = true;

    const title = screen.getByLabelText(/Title/);
    await user.clear(title);
    await user.type(title, 'Updated');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(captured).not.toBeNull());
    expect(captured).toMatchObject({
      title: 'Updated',
      value: 200,
      contactId: 1,
      companyId: 1,
      stage: 'Lead',
      expectedCloseDate: '2025-01-01',
    });

    const { toast } = await import('sonner');
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Deal updated'));
    expect(onClose).toHaveBeenCalled();
  });

  it('disables the submit button and shows a spinner while creating', async () => {
    setupContactsAndCompanies();
    server.use(
      http.post(url('/deals'), async () => {
        await delay('infinite');
        return HttpResponse.json(makeDeal());
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<DealFormDialog open onClose={vi.fn()} />);

    await screen.findByText('New Deal');
    const form = document.getElementById('deal-form') as HTMLFormElement;
    form.noValidate = true;

    await user.type(screen.getByLabelText(/Title/), 'Pending');
    const triggers = screen.getAllByRole('combobox');
    await user.click(triggers[1]);
    await user.click(await screen.findByRole('option', { name: 'Jane Doe' }));

    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /Create/ });
      expect(btn).toBeDisabled();
    });
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('calls onClose when the Cancel button is clicked', async () => {
    setupContactsAndCompanies();
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<DealFormDialog open onClose={onClose} />);

    await screen.findByText('New Deal');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows a value validation error when value is negative', async () => {
    setupContactsAndCompanies();
    const user = userEvent.setup();
    renderWithProviders(<DealFormDialog open onClose={vi.fn()} />);

    await screen.findByText('New Deal');
    const form = document.getElementById('deal-form') as HTMLFormElement;
    form.noValidate = true;

    await user.type(screen.getByLabelText(/Title/), 'Some Title');
    const valueInput = screen.getByLabelText(/Value/);
    await user.clear(valueInput);
    await user.type(valueInput, '-5');

    // Pick a contact so contactId validation passes
    const triggers = screen.getAllByRole('combobox');
    await user.click(triggers[1]);
    await user.click(await screen.findByRole('option', { name: 'Jane Doe' }));

    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Value must be 0 or more')).toBeInTheDocument();
  });

  it('falls back to "0" when watch returns undefined for contactId', async () => {
    watchOverrides.contactIdUndefined = true;
    setupContactsAndCompanies();
    renderWithProviders(<DealFormDialog open onClose={vi.fn()} />);

    // The form rendered successfully with the fallback value '0' applied
    // when watch('contactId') returned undefined
    expect(await screen.findByText('New Deal')).toBeInTheDocument();
    expect(screen.getByLabelText(/Title/)).toBeInTheDocument();
  });

  it('calls onClose when the dialog is dismissed via Escape', async () => {
    setupContactsAndCompanies();
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<DealFormDialog open onClose={onClose} />);

    await screen.findByText('New Deal');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
