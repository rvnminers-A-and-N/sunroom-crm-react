import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse, delay } from 'msw';
import { server } from '../../../tests/msw/server';
import { url } from '../../../tests/msw/handlers/url';
import { renderWithProviders } from '../../../tests/utils/render';
import {
  makeCompany,
  makeContact,
  makePaginated,
  makeTag,
} from '../../../tests/msw/data/factories';
import { ContactFormDialog } from './contact-form-dialog';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Lets a single test force `watch('tagIds')` to return undefined so the
// `?? []` fallback branch in the component is reachable.
const watchOverrides = vi.hoisted(() => ({ tagIdsUndefined: false }));

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
          watchOverrides.tagIdsUndefined &&
          (args[0] === 'tagIds' || (Array.isArray(args[0]) && args[0].includes('tagIds')))
        ) {
          return undefined;
        }
        return (origWatch as (...a: unknown[]) => unknown)(...args);
      }) as typeof origWatch;
      return { ...result, watch: wrappedWatch };
    }) as typeof actual.useForm,
  };
});

describe('ContactFormDialog', () => {
  beforeEach(async () => {
    const { toast } = await import('sonner');
    vi.mocked(toast.success).mockClear();
    watchOverrides.tagIdsUndefined = false;
  });

  it('renders nothing when closed', () => {
    renderWithProviders(
      <ContactFormDialog open={false} onClose={() => {}} />,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the create form with default empty fields', async () => {
    renderWithProviders(
      <ContactFormDialog open={true} onClose={() => {}} />,
    );

    expect(await screen.findByText('New Contact')).toBeInTheDocument();
    expect(
      screen.getByText('Fill in the details to create a new contact.'),
    ).toBeInTheDocument();

    expect((screen.getByLabelText('First Name *') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('Last Name *') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe('');
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('renders the edit form prefilled from the contact prop', async () => {
    const contact = makeContact({
      id: 5,
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@example.com',
      phone: '555-9876',
      title: 'CTO',
      companyId: 3,
      tags: [makeTag({ id: 1, name: 'VIP' })],
    });

    renderWithProviders(
      <ContactFormDialog open={true} onClose={() => {}} contact={contact} />,
    );

    expect(await screen.findByText('Edit Contact')).toBeInTheDocument();
    expect(
      screen.getByText('Update the contact details below.'),
    ).toBeInTheDocument();
    expect((screen.getByLabelText('First Name *') as HTMLInputElement).value).toBe('Alice');
    expect((screen.getByLabelText('Last Name *') as HTMLInputElement).value).toBe('Smith');
    expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe('alice@example.com');
    expect((screen.getByLabelText('Phone') as HTMLInputElement).value).toBe('555-9876');
    expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe('CTO');
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();

    // Tag toggle area is hidden in edit mode
    expect(screen.queryByText('Tags')).not.toBeInTheDocument();
  });

  it('shows validation errors when required fields are missing', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(
      <ContactFormDialog open={true} onClose={onClose} />,
    );

    const form = (await screen.findByLabelText('First Name *')).closest('form') as HTMLFormElement;
    form.noValidate = true;

    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('First name is required')).toBeInTheDocument();
    expect(screen.getByText('Last name is required')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows an error when email is malformed', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ContactFormDialog open={true} onClose={() => {}} />,
    );

    const firstName = await screen.findByLabelText('First Name *');
    const form = firstName.closest('form') as HTMLFormElement;
    form.noValidate = true;

    await user.type(firstName, 'Jane');
    await user.type(screen.getByLabelText('Last Name *'), 'Doe');
    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Invalid email')).toBeInTheDocument();
  });

  it('submits a create request with toggled tags and closes on success', async () => {
    let createdBody: Record<string, unknown> | null = null;
    server.use(
      http.get(url('/tags'), () =>
        HttpResponse.json([
          makeTag({ id: 1, name: 'VIP' }),
          makeTag({ id: 2, name: 'Lead' }),
        ]),
      ),
      http.get(url('/companies'), () =>
        HttpResponse.json(makePaginated([])),
      ),
      http.post(url('/contacts'), async ({ request }) => {
        createdBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(makeContact({ id: 99 }));
      }),
    );

    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(
      <ContactFormDialog open={true} onClose={onClose} />,
    );

    await screen.findByText('New Contact');
    // Wait for the tags to load and the toggle pills to appear
    const vipTag = await screen.findByRole('button', { name: 'VIP' });
    const leadTag = await screen.findByRole('button', { name: 'Lead' });

    await user.type(screen.getByLabelText('First Name *'), 'Bob');
    await user.type(screen.getByLabelText('Last Name *'), 'Builder');
    await user.type(screen.getByLabelText('Phone'), '555-1111');
    await user.type(screen.getByLabelText('Title'), 'Builder');
    await user.type(screen.getByLabelText('Notes'), 'A note');

    await user.click(vipTag);
    await user.click(leadTag);
    // Toggle one off to exercise the remove path
    await user.click(vipTag);

    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(createdBody).not.toBeNull());
    expect(createdBody).toMatchObject({
      firstName: 'Bob',
      lastName: 'Builder',
      phone: '555-1111',
      title: 'Builder',
      notes: 'A note',
      tagIds: [2],
    });

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    const { toast } = await import('sonner');
    expect(toast.success).toHaveBeenCalledWith('Contact created');
  });

  it('omits tagIds when none are selected on create', async () => {
    let createdBody: Record<string, unknown> | null = null;
    server.use(
      http.get(url('/tags'), () => HttpResponse.json([])),
      http.post(url('/contacts'), async ({ request }) => {
        createdBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(makeContact({ id: 100 }));
      }),
    );

    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(
      <ContactFormDialog open={true} onClose={onClose} />,
    );

    await screen.findByText('New Contact');
    await user.type(screen.getByLabelText('First Name *'), 'Bob');
    await user.type(screen.getByLabelText('Last Name *'), 'Builder');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(createdBody).not.toBeNull());
    expect((createdBody as Record<string, unknown>).tagIds).toBeUndefined();
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('selects a company from the Select dropdown', async () => {
    let createdBody: Record<string, unknown> | null = null;
    server.use(
      http.get(url('/companies'), () =>
        HttpResponse.json(
          makePaginated([
            makeCompany({ id: 1, name: 'Acme Inc' }),
            makeCompany({ id: 2, name: 'Globex' }),
          ]),
        ),
      ),
      http.get(url('/tags'), () => HttpResponse.json([])),
      http.post(url('/contacts'), async ({ request }) => {
        createdBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(makeContact({ id: 21 }));
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ContactFormDialog open={true} onClose={() => {}} />);

    await screen.findByText('New Contact');
    await user.type(screen.getByLabelText('First Name *'), 'Eve');
    await user.type(screen.getByLabelText('Last Name *'), 'Gamma');

    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    const option = await screen.findByRole('option', { name: 'Globex' });
    await user.click(option);

    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(createdBody).not.toBeNull());
    expect((createdBody as Record<string, unknown>).companyId).toBe(2);

    // Now switch back to "None" to exercise the null branch
    // (re-open select via re-render is unnecessary; the value is now retained for next test)
  });

  it('selecting "None" clears the company id back to null', async () => {
    server.use(
      http.get(url('/companies'), () =>
        HttpResponse.json(
          makePaginated([
            makeCompany({ id: 1, name: 'Acme Inc' }),
          ]),
        ),
      ),
      http.get(url('/tags'), () => HttpResponse.json([])),
    );

    const user = userEvent.setup();
    const contact = makeContact({
      id: 8,
      firstName: 'Pat',
      lastName: 'King',
      companyId: 1,
    });

    renderWithProviders(
      <ContactFormDialog open={true} onClose={() => {}} contact={contact} />,
    );

    await screen.findByText('Edit Contact');
    // Wait for company list to load so the trigger reflects the selected company
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toHaveTextContent('Acme Inc');
    });

    await user.click(screen.getByRole('combobox'));
    const noneOption = await screen.findByRole('option', { name: 'None' });
    await user.click(noneOption);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).not.toHaveTextContent('Acme Inc');
    });
  });

  it('submits an update request and closes on success', async () => {
    let updateBody: Record<string, unknown> | null = null;
    server.use(
      http.get(url('/companies'), () => HttpResponse.json(makePaginated([]))),
      http.get(url('/tags'), () => HttpResponse.json([])),
      http.put(url('/contacts/5'), async ({ request }) => {
        updateBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(makeContact({ id: 5 }));
      }),
    );

    const user = userEvent.setup();
    const onClose = vi.fn();
    const contact = makeContact({
      id: 5,
      firstName: 'Old',
      lastName: 'Name',
      email: 'old@example.com',
      phone: '555-0000',
      title: 'Old',
      companyId: 1,
    });

    renderWithProviders(
      <ContactFormDialog open={true} onClose={onClose} contact={contact} />,
    );

    await screen.findByText('Edit Contact');
    const firstName = screen.getByLabelText('First Name *') as HTMLInputElement;
    await user.clear(firstName);
    await user.type(firstName, 'New');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(updateBody).not.toBeNull());
    expect((updateBody as Record<string, unknown>).firstName).toBe('New');
    expect((updateBody as Record<string, unknown>).lastName).toBe('Name');
    expect((updateBody as Record<string, unknown>).email).toBe('old@example.com');

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    const { toast } = await import('sonner');
    expect(toast.success).toHaveBeenCalledWith('Contact updated');
  });

  it('drops empty optional fields when updating', async () => {
    let updateBody: Record<string, unknown> | null = null;
    server.use(
      http.get(url('/companies'), () => HttpResponse.json(makePaginated([]))),
      http.get(url('/tags'), () => HttpResponse.json([])),
      http.put(url('/contacts/6'), async ({ request }) => {
        updateBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(makeContact({ id: 6 }));
      }),
    );

    const user = userEvent.setup();
    const contact = makeContact({
      id: 6,
      firstName: 'Sara',
      lastName: 'Long',
      email: null,
      phone: null,
      title: null,
      companyId: null,
      tags: [],
    });

    renderWithProviders(
      <ContactFormDialog open={true} onClose={() => {}} contact={contact} />,
    );

    await screen.findByText('Edit Contact');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(updateBody).not.toBeNull());
    expect((updateBody as Record<string, unknown>).email).toBeUndefined();
    expect((updateBody as Record<string, unknown>).phone).toBeUndefined();
    expect((updateBody as Record<string, unknown>).title).toBeUndefined();
    expect((updateBody as Record<string, unknown>).notes).toBeUndefined();
    expect((updateBody as Record<string, unknown>).companyId).toBeUndefined();
  });

  it('disables the submit button and shows a spinner while saving', async () => {
    server.use(
      http.get(url('/tags'), () => HttpResponse.json([])),
      http.post(url('/contacts'), async () => {
        await delay('infinite');
        return HttpResponse.json(makeContact({ id: 11 }));
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(
      <ContactFormDialog open={true} onClose={() => {}} />,
    );

    await screen.findByText('New Contact');
    await user.type(screen.getByLabelText('First Name *'), 'Bob');
    await user.type(screen.getByLabelText('Last Name *'), 'Builder');

    const submit = screen.getByRole('button', { name: 'Create' });
    await user.click(submit);

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
      <ContactFormDialog open={true} onClose={onClose} />,
    );

    await screen.findByText('New Contact');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('falls back to an empty tag list when watch returns undefined', async () => {
    watchOverrides.tagIdsUndefined = true;
    server.use(
      http.get(url('/tags'), () =>
        HttpResponse.json([makeTag({ id: 1, name: 'VIP' })]),
      ),
    );

    renderWithProviders(<ContactFormDialog open={true} onClose={() => {}} />);

    // The tag pill should still render and be unselected (the fallback `[]`
    // means `selectedTagIds.includes(tag.id)` is false → muted styles).
    const vipTag = await screen.findByRole('button', { name: 'VIP' });
    expect(vipTag.className).toContain('bg-muted');
    expect(vipTag.className).not.toContain('bg-sr-primary');
  });

  it('calls onClose when the dialog open state flips to false (Escape)', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(
      <ContactFormDialog open={true} onClose={onClose} />,
    );

    await screen.findByText('New Contact');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
