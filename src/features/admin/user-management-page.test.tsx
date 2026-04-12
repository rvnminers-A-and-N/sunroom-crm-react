import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse, delay } from 'msw';
import { server } from '../../../tests/msw/server';
import { url } from '../../../tests/msw/handlers/url';
import { renderWithProviders } from '../../../tests/utils/render';
import { makeUser } from '../../../tests/msw/data/factories';
import UserManagementPage from './user-management-page';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
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
        data-testid="force-confirm-user"
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

describe('UserManagementPage', () => {
  beforeEach(async () => {
    const { toast } = await import('sonner');
    vi.mocked(toast.success).mockClear();
  });

  it('renders skeleton placeholders while users load', async () => {
    server.use(
      http.get(url('/users'), async () => {
        await delay(40);
        return HttpResponse.json([makeUser()]);
      }),
    );

    const { container } = renderWithProviders(<UserManagementPage />);
    expect(
      container.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(0);
    await screen.findByText('Test User');
  });

  it('renders the empty state when no users exist', async () => {
    server.use(http.get(url('/users'), () => HttpResponse.json([])));
    renderWithProviders(<UserManagementPage />);
    expect(await screen.findByText('No users found.')).toBeInTheDocument();
  });

  it('renders user rows with name, email, role and joined date', async () => {
    server.use(
      http.get(url('/users'), () =>
        HttpResponse.json([
          makeUser({
            id: 1,
            name: 'Alice Admin',
            email: 'alice@example.com',
            role: 'Admin',
            createdAt: '2024-05-01T00:00:00Z',
          }),
          makeUser({
            id: 2,
            name: 'Bob User',
            email: 'bob@example.com',
            role: 'User',
            createdAt: '2024-06-01T00:00:00Z',
          }),
        ]),
      ),
    );

    renderWithProviders(<UserManagementPage />);

    expect(await screen.findByText('Alice Admin')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('Bob User')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();

    // Two role select triggers (one per row)
    expect(screen.getAllByRole('combobox')).toHaveLength(2);
  });

  it(
    'updates a user role via the select and shows a success toast',
    { timeout: 15000 },
    async () => {
      let updatedBody: Record<string, unknown> | null = null;
      server.use(
        http.get(url('/users'), () =>
          HttpResponse.json([
            makeUser({ id: 1, name: 'Alice', role: 'User' }),
          ]),
        ),
        http.put(url('/users/1'), async ({ request }) => {
          updatedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(makeUser({ id: 1, name: 'Alice', role: 'Admin' }));
        }),
      );

      const user = userEvent.setup();
      renderWithProviders(<UserManagementPage />);
      await screen.findByText('Alice');

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);
      await user.click(await screen.findByRole('option', { name: 'Admin' }));

      await waitFor(() => expect(updatedBody).not.toBeNull());
      expect(updatedBody).toMatchObject({ role: 'Admin' });

      const { toast } = await import('sonner');
      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith('Alice updated to Admin'),
      );
    },
  );

  it('opens the delete confirm dialog and triggers user deletion', async () => {
    let deleteCalled = false;
    server.use(
      http.get(url('/users'), () =>
        HttpResponse.json([
          makeUser({ id: 1, name: 'DeleteMe', email: 'd@example.com' }),
        ]),
      ),
      http.delete(url('/users/1'), () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    const { container } = renderWithProviders(<UserManagementPage />);
    await screen.findByText('DeleteMe');

    // The trash icon button is the only Button rendered with the destructive class
    const deleteButton = container.querySelector(
      'button.text-destructive',
    ) as HTMLButtonElement;
    expect(deleteButton).not.toBeNull();
    await user.click(deleteButton);

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText(/Are you sure you want to delete DeleteMe/),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(deleteCalled).toBe(true));
    const { toast } = await import('sonner');
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('User deleted'),
    );
  });

  it('returns early from handleDelete when no target is selected', async () => {
    server.use(
      http.get(url('/users'), () =>
        HttpResponse.json([makeUser({ id: 1, name: 'Untouched' })]),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<UserManagementPage />);
    await screen.findByText('Untouched');

    await user.click(screen.getByTestId('force-confirm-user'));
    const { toast } = await import('sonner');
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('closes the delete dialog when Cancel is clicked', async () => {
    let deleteCalled = false;
    server.use(
      http.get(url('/users'), () =>
        HttpResponse.json([makeUser({ id: 1, name: 'KeepMe' })]),
      ),
      http.delete(url('/users/1'), () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    const { container } = renderWithProviders(<UserManagementPage />);
    await screen.findByText('KeepMe');

    const deleteButton = container.querySelector(
      'button.text-destructive',
    ) as HTMLButtonElement;
    await user.click(deleteButton);

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(deleteCalled).toBe(false);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });
});
