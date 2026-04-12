import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse, delay } from 'msw';
import { server } from '../../../tests/msw/server';
import { url } from '../../../tests/msw/handlers/url';
import { renderWithProviders } from '../../../tests/utils/render';
import {
  makeActivity,
  makeContact,
  makeDeal,
  makePaginated,
} from '../../../tests/msw/data/factories';
import { ActivityFormDialog } from './activity-form-dialog';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function setupContactsAndDeals() {
  server.use(
    http.get(url('/contacts'), () =>
      HttpResponse.json(
        makePaginated([
          makeContact({ id: 1, firstName: 'Jane', lastName: 'Doe' }),
          makeContact({ id: 2, firstName: 'John', lastName: 'Smith' }),
        ]),
      ),
    ),
    http.get(url('/deals'), () =>
      HttpResponse.json(
        makePaginated([
          makeDeal({ id: 1, title: 'Big Deal' }),
          makeDeal({ id: 2, title: 'Small Deal' }),
        ]),
      ),
    ),
  );
}

describe('ActivityFormDialog', () => {
  beforeEach(async () => {
    const { toast } = await import('sonner');
    vi.mocked(toast.success).mockClear();
  });

  it('renders nothing when closed', () => {
    setupContactsAndDeals();
    renderWithProviders(<ActivityFormDialog open={false} onClose={vi.fn()} />);
    expect(screen.queryByText('Log Activity')).not.toBeInTheDocument();
  });

  it('renders the create form with default values', async () => {
    setupContactsAndDeals();
    renderWithProviders(<ActivityFormDialog open onClose={vi.fn()} />);

    expect(await screen.findByText('Log Activity')).toBeInTheDocument();
    expect(screen.getByText('Log a new activity for tracking.')).toBeInTheDocument();
    expect(screen.getByLabelText(/Subject/)).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Log' })).toBeInTheDocument();
  });

  it('renders the edit form prefilled with activity values', async () => {
    setupContactsAndDeals();
    renderWithProviders(
      <ActivityFormDialog
        open
        onClose={vi.fn()}
        activity={makeActivity({
          id: 7,
          type: 'Meeting',
          subject: 'Quarterly review',
          body: 'Notes...',
          contactId: 2,
          dealId: 1,
          occurredAt: '2025-03-15T00:00:00Z',
        })}
      />,
    );

    expect(await screen.findByText('Edit Activity')).toBeInTheDocument();
    expect(screen.getByText('Update the activity details below.')).toBeInTheDocument();
    expect(screen.getByLabelText(/Subject/)).toHaveValue('Quarterly review');
    expect(screen.getByLabelText(/Body/)).toHaveValue('Notes...');
    expect(screen.getByLabelText(/Date/)).toHaveValue('2025-03-15');
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('uses today as a fallback when the activity has no occurredAt', async () => {
    setupContactsAndDeals();
    renderWithProviders(
      <ActivityFormDialog
        open
        onClose={vi.fn()}
        activity={makeActivity({
          id: 8,
          subject: 'Quick note',
          body: null,
          occurredAt: '' as unknown as string,
        })}
      />,
    );
    await screen.findByText('Edit Activity');
    expect(screen.getByLabelText(/Body/)).toHaveValue('');
    // Date input should have a non-empty value (today)
    expect((screen.getByLabelText(/Date/) as HTMLInputElement).value).not.toBe('');
  });

  it('shows a validation error when subject is empty', async () => {
    setupContactsAndDeals();
    const user = userEvent.setup();
    renderWithProviders(<ActivityFormDialog open onClose={vi.fn()} />);

    await screen.findByText('Log Activity');
    const form = document.getElementById('activity-form') as HTMLFormElement;
    form.noValidate = true;

    await user.click(screen.getByRole('button', { name: 'Log' }));
    expect(await screen.findByText('Subject is required')).toBeInTheDocument();
  });

  it(
    'submits the create payload with all fields',
    { timeout: 15000 },
    async () => {
      setupContactsAndDeals();
      let captured: Record<string, unknown> | null = null;
      server.use(
        http.post(url('/activities'), async ({ request }) => {
          captured = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(makeActivity({ id: 99, ...captured }));
        }),
      );

      const onClose = vi.fn();
      const user = userEvent.setup();
      renderWithProviders(<ActivityFormDialog open onClose={onClose} />);

      await screen.findByText('Log Activity');
      const form = document.getElementById('activity-form') as HTMLFormElement;
      form.noValidate = true;

      await user.type(screen.getByLabelText(/Subject/), 'Big meeting');
      await user.type(screen.getByLabelText(/Body/), 'Discussed plans');

      const triggers = screen.getAllByRole('combobox');
      // triggers[0] = type, triggers[1] = contact, triggers[2] = deal
      await user.click(triggers[0]);
      await user.click(await screen.findByRole('option', { name: 'Meeting' }));

      await user.click(triggers[1]);
      await user.click(await screen.findByRole('option', { name: 'Jane Doe' }));

      await user.click(triggers[2]);
      await user.click(await screen.findByRole('option', { name: 'Big Deal' }));

      await user.click(screen.getByRole('button', { name: 'Log' }));

      await waitFor(() => expect(captured).not.toBeNull());
      expect(captured).toMatchObject({
        type: 'Meeting',
        subject: 'Big meeting',
        body: 'Discussed plans',
        contactId: 1,
        dealId: 1,
      });
      expect((captured as Record<string, unknown>).occurredAt).toEqual(
        expect.stringMatching(/T/),
      );

      const { toast } = await import('sonner');
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Activity logged'));
      expect(onClose).toHaveBeenCalled();
    },
  );

  it(
    'switches contact and deal back to None and omits optional fields',
    { timeout: 15000 },
    async () => {
      setupContactsAndDeals();
      let captured: Record<string, unknown> | null = null;
      server.use(
        http.post(url('/activities'), async ({ request }) => {
          captured = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(makeActivity({ id: 1, ...captured }));
        }),
      );

      const user = userEvent.setup();
      renderWithProviders(<ActivityFormDialog open onClose={vi.fn()} />);

      await screen.findByText('Log Activity');
      const form = document.getElementById('activity-form') as HTMLFormElement;
      form.noValidate = true;

      await user.type(screen.getByLabelText(/Subject/), 'Just a note');
      const triggers = screen.getAllByRole('combobox');

      // Pick contact then switch back to None
      await user.click(triggers[1]);
      await user.click(await screen.findByRole('option', { name: 'Jane Doe' }));
      await user.click(triggers[1]);
      await user.click(await screen.findByRole('option', { name: 'None' }));

      // Pick deal then switch back to None
      await user.click(triggers[2]);
      await user.click(await screen.findByRole('option', { name: 'Big Deal' }));
      await user.click(triggers[2]);
      await user.click(await screen.findByRole('option', { name: 'None' }));

      // Clear the date so occurredAt becomes empty string
      const dateInput = screen.getByLabelText(/Date/);
      await user.clear(dateInput);

      await user.click(screen.getByRole('button', { name: 'Log' }));

      await waitFor(() => expect(captured).not.toBeNull());
      expect((captured as Record<string, unknown>).contactId).toBeUndefined();
      expect((captured as Record<string, unknown>).dealId).toBeUndefined();
      expect((captured as Record<string, unknown>).body).toBeUndefined();
      expect((captured as Record<string, unknown>).occurredAt).toBeUndefined();
    },
  );

  it('submits an update payload when editing an existing activity', async () => {
    setupContactsAndDeals();
    let captured: Record<string, unknown> | null = null;
    server.use(
      http.put(url('/activities/12'), async ({ request }) => {
        captured = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(makeActivity({ id: 12, ...captured }));
      }),
    );

    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <ActivityFormDialog
        open
        onClose={onClose}
        activity={makeActivity({
          id: 12,
          type: 'Note',
          subject: 'Old title',
          body: 'Original',
          occurredAt: '2025-01-01',
        })}
      />,
    );

    await screen.findByText('Edit Activity');
    const form = document.getElementById('activity-form') as HTMLFormElement;
    form.noValidate = true;

    const subject = screen.getByLabelText(/Subject/);
    await user.clear(subject);
    await user.type(subject, 'New title');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(captured).not.toBeNull());
    expect(captured).toMatchObject({
      type: 'Note',
      subject: 'New title',
      body: 'Original',
    });

    const { toast } = await import('sonner');
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Activity updated'));
    expect(onClose).toHaveBeenCalled();
  });

  it('disables the submit button and shows a spinner while creating', async () => {
    setupContactsAndDeals();
    server.use(
      http.post(url('/activities'), async () => {
        await delay('infinite');
        return HttpResponse.json(makeActivity());
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ActivityFormDialog open onClose={vi.fn()} />);

    await screen.findByText('Log Activity');
    const form = document.getElementById('activity-form') as HTMLFormElement;
    form.noValidate = true;

    await user.type(screen.getByLabelText(/Subject/), 'Hold');
    await user.click(screen.getByRole('button', { name: 'Log' }));

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /Log/ });
      expect(btn).toBeDisabled();
    });
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('calls onClose when the Cancel button is clicked', async () => {
    setupContactsAndDeals();
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<ActivityFormDialog open onClose={onClose} />);

    await screen.findByText('Log Activity');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when the dialog is dismissed via Escape', async () => {
    setupContactsAndDeals();
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<ActivityFormDialog open onClose={onClose} />);

    await screen.findByText('Log Activity');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
