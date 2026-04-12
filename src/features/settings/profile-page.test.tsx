import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse, delay } from 'msw';
import { server } from '../../../tests/msw/server';
import { url } from '../../../tests/msw/handlers/url';
import { renderWithProviders } from '../../../tests/utils/render';
import { makeUser, makeTag } from '../../../tests/msw/data/factories';
import ProfilePage from './profile-page';

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
        data-testid="force-confirm-tag"
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

describe('ProfilePage', () => {
  beforeEach(async () => {
    const { toast } = await import('sonner');
    vi.mocked(toast.success).mockClear();
  });

  it('renders skeleton placeholders while user data loads', async () => {
    server.use(
      http.get(url('/auth/me'), async () => {
        await delay(40);
        return HttpResponse.json(makeUser());
      }),
      http.get(url('/tags'), async () => {
        await delay(40);
        return HttpResponse.json([]);
      }),
    );

    const { container } = renderWithProviders(<ProfilePage />, {
      initialAuth: { user: makeUser() },
    });
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
    await screen.findByText('Test User');
  });

  it('renders the profile card when user data resolves', async () => {
    server.use(
      http.get(url('/auth/me'), () =>
        HttpResponse.json(
          makeUser({
            name: 'Alice Wonderland',
            email: 'alice@example.com',
            role: 'Admin',
            createdAt: '2024-05-01T00:00:00Z',
          }),
        ),
      ),
      http.get(url('/tags'), () => HttpResponse.json([])),
    );

    renderWithProviders(<ProfilePage />, {
      initialAuth: { user: makeUser() },
    });

    expect(await screen.findByText('Alice Wonderland')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText(/Member since/)).toBeInTheDocument();
  });

  it('shows the empty tags state when no tags exist', async () => {
    server.use(
      http.get(url('/auth/me'), () => HttpResponse.json(makeUser())),
      http.get(url('/tags'), () => HttpResponse.json([])),
    );

    renderWithProviders(<ProfilePage />);
    expect(await screen.findByText('No tags created yet.')).toBeInTheDocument();
  });

  it('renders existing tags with their colors', async () => {
    server.use(
      http.get(url('/auth/me'), () => HttpResponse.json(makeUser())),
      http.get(url('/tags'), () =>
        HttpResponse.json([
          makeTag({ id: 1, name: 'VIP', color: '#ff8800' }),
          makeTag({ id: 2, name: 'Hot Lead', color: '#ff0000' }),
        ]),
      ),
    );

    renderWithProviders(<ProfilePage />);
    expect(await screen.findByText('VIP')).toBeInTheDocument();
    expect(screen.getByText('Hot Lead')).toBeInTheDocument();
  });

  it('creates a tag via the Add button and shows a success toast', async () => {
    let createdBody: Record<string, unknown> | null = null;
    server.use(
      http.get(url('/auth/me'), () => HttpResponse.json(makeUser())),
      http.get(url('/tags'), () => HttpResponse.json([])),
      http.post(url('/tags'), async ({ request }) => {
        createdBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(makeTag({ id: 5, ...createdBody }));
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ProfilePage />);

    await screen.findByText('No tags created yet.');
    await user.type(
      screen.getByPlaceholderText(/Tag name/),
      'NewTag',
    );
    await user.click(screen.getByRole('button', { name: /Add/ }));

    await waitFor(() => expect(createdBody).not.toBeNull());
    expect(createdBody).toMatchObject({ name: 'NewTag', color: '#02795f' });
    const { toast } = await import('sonner');
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Tag created'));

    // Form should reset
    expect(screen.getByPlaceholderText(/Tag name/)).toHaveValue('');
  });

  it('creates a tag when pressing Enter in the input', async () => {
    let createdCount = 0;
    server.use(
      http.get(url('/auth/me'), () => HttpResponse.json(makeUser())),
      http.get(url('/tags'), () => HttpResponse.json([])),
      http.post(url('/tags'), async () => {
        createdCount++;
        return HttpResponse.json(makeTag({ id: 6 }));
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ProfilePage />);
    await screen.findByText('No tags created yet.');

    const input = screen.getByPlaceholderText(/Tag name/);
    await user.type(input, 'EnterTag');
    await user.keyboard('{Enter}');
    await waitFor(() => expect(createdCount).toBe(1));
  });

  it('does not create a tag when name is whitespace', async () => {
    let createdCount = 0;
    server.use(
      http.get(url('/auth/me'), () => HttpResponse.json(makeUser())),
      http.get(url('/tags'), () => HttpResponse.json([])),
      http.post(url('/tags'), () => {
        createdCount++;
        return HttpResponse.json(makeTag());
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ProfilePage />);
    await screen.findByText('No tags created yet.');

    const input = screen.getByPlaceholderText(/Tag name/);
    await user.type(input, '   ');
    await user.keyboard('{Enter}');

    // Add button should still be disabled
    expect(screen.getByRole('button', { name: /Add/ })).toBeDisabled();
    expect(createdCount).toBe(0);
  });

  it('changes the new tag color via the color input', async () => {
    server.use(
      http.get(url('/auth/me'), () => HttpResponse.json(makeUser())),
      http.get(url('/tags'), () => HttpResponse.json([])),
    );
    const user = userEvent.setup();
    const { container } = renderWithProviders(<ProfilePage />);
    await screen.findByText('No tags created yet.');

    const colorInput = container.querySelector(
      'input[type="color"]',
    ) as HTMLInputElement;
    expect(colorInput.value).toBe('#02795f');
    await user.click(colorInput);
    // userEvent doesn't simulate color picker interaction; use fireEvent fallback
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.input(colorInput, { target: { value: '#ff00ff' } });
    expect(colorInput.value).toBe('#ff00ff');
  });

  it('opens the edit row, updates the tag name and saves', async () => {
    let updatedBody: Record<string, unknown> | null = null;
    server.use(
      http.get(url('/auth/me'), () => HttpResponse.json(makeUser())),
      http.get(url('/tags'), () =>
        HttpResponse.json([makeTag({ id: 1, name: 'OldName' })]),
      ),
      http.put(url('/tags/1'), async ({ request }) => {
        updatedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(makeTag({ id: 1, ...updatedBody }));
      }),
    );

    const user = userEvent.setup();
    const { container } = renderWithProviders(<ProfilePage />);
    await screen.findByText('OldName');

    // The first edit button next to the OldName tag
    const tagRowButtons = container.querySelectorAll('div.flex.items-center.justify-between button');
    await user.click(tagRowButtons[0] as HTMLElement);

    const editInput = container.querySelector(
      'input.flex-1.h-7',
    ) as HTMLInputElement;
    expect(editInput.value).toBe('OldName');
    await user.clear(editInput);
    await user.type(editInput, 'NewName');

    // Save button (Check icon) is the third button in the edit row
    const editButtons = editInput.parentElement!.querySelectorAll('button');
    await user.click(editButtons[0] as HTMLElement);

    await waitFor(() => expect(updatedBody).not.toBeNull());
    expect(updatedBody).toMatchObject({ name: 'NewName' });
    const { toast } = await import('sonner');
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Tag updated'));
  });

  it('saves the edited tag via the Enter key', async () => {
    let updatedCount = 0;
    server.use(
      http.get(url('/auth/me'), () => HttpResponse.json(makeUser())),
      http.get(url('/tags'), () =>
        HttpResponse.json([makeTag({ id: 1, name: 'KeyName' })]),
      ),
      http.put(url('/tags/1'), async () => {
        updatedCount++;
        return HttpResponse.json(makeTag({ id: 1 }));
      }),
    );

    const user = userEvent.setup();
    const { container } = renderWithProviders(<ProfilePage />);
    await screen.findByText('KeyName');

    const tagRowButtons = container.querySelectorAll('div.flex.items-center.justify-between button');
    await user.click(tagRowButtons[0] as HTMLElement);

    const editInput = container.querySelector(
      'input.flex-1.h-7',
    ) as HTMLInputElement;
    await user.click(editInput);
    await user.keyboard('{Enter}');
    await waitFor(() => expect(updatedCount).toBe(1));
  });

  it('does not save when the edited name is whitespace', async () => {
    let updatedCount = 0;
    server.use(
      http.get(url('/auth/me'), () => HttpResponse.json(makeUser())),
      http.get(url('/tags'), () =>
        HttpResponse.json([makeTag({ id: 1, name: 'BlankCheck' })]),
      ),
      http.put(url('/tags/1'), () => {
        updatedCount++;
        return HttpResponse.json(makeTag({ id: 1 }));
      }),
    );

    const user = userEvent.setup();
    const { container } = renderWithProviders(<ProfilePage />);
    await screen.findByText('BlankCheck');

    const tagRowButtons = container.querySelectorAll('div.flex.items-center.justify-between button');
    await user.click(tagRowButtons[0] as HTMLElement);

    const editInput = container.querySelector(
      'input.flex-1.h-7',
    ) as HTMLInputElement;
    await user.clear(editInput);
    await user.type(editInput, '   ');

    const editButtons = editInput.parentElement!.querySelectorAll('button');
    await user.click(editButtons[0] as HTMLElement);

    // Should not have called PUT
    await new Promise((r) => setTimeout(r, 30));
    expect(updatedCount).toBe(0);
  });

  it('changes the edit tag color via the color input', async () => {
    server.use(
      http.get(url('/auth/me'), () => HttpResponse.json(makeUser())),
      http.get(url('/tags'), () =>
        HttpResponse.json([makeTag({ id: 1, name: 'Colored' })]),
      ),
    );
    const user = userEvent.setup();
    const { container } = renderWithProviders(<ProfilePage />);
    await screen.findByText('Colored');

    const tagRowButtons = container.querySelectorAll('div.flex.items-center.justify-between button');
    await user.click(tagRowButtons[0] as HTMLElement);

    const editColorInput = container.querySelector(
      'input.h-7.w-7',
    ) as HTMLInputElement;
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.input(editColorInput, { target: { value: '#abcdef' } });
    expect(editColorInput.value).toBe('#abcdef');
  });

  it('cancels the edit row without saving', async () => {
    let updatedCount = 0;
    server.use(
      http.get(url('/auth/me'), () => HttpResponse.json(makeUser())),
      http.get(url('/tags'), () =>
        HttpResponse.json([makeTag({ id: 1, name: 'Cancelable' })]),
      ),
      http.put(url('/tags/1'), () => {
        updatedCount++;
        return HttpResponse.json(makeTag({ id: 1 }));
      }),
    );

    const user = userEvent.setup();
    const { container } = renderWithProviders(<ProfilePage />);
    await screen.findByText('Cancelable');

    const tagRowButtons = container.querySelectorAll('div.flex.items-center.justify-between button');
    await user.click(tagRowButtons[0] as HTMLElement);

    const editInput = container.querySelector(
      'input.flex-1.h-7',
    ) as HTMLInputElement;
    const editButtons = editInput.parentElement!.querySelectorAll('button');
    // Cancel is the second button (X icon)
    await user.click(editButtons[1] as HTMLElement);

    expect(updatedCount).toBe(0);
    // Edit row should be gone
    await waitFor(() => {
      expect(container.querySelector('input.flex-1.h-7')).toBeNull();
    });
  });

  it('opens the delete confirm dialog and triggers tag deletion', async () => {
    let deleteCalled = false;
    server.use(
      http.get(url('/auth/me'), () => HttpResponse.json(makeUser())),
      http.get(url('/tags'), () =>
        HttpResponse.json([makeTag({ id: 1, name: 'DeleteMe' })]),
      ),
      http.delete(url('/tags/1'), () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    const { container } = renderWithProviders(<ProfilePage />);
    await screen.findByText('DeleteMe');

    const tagRowButtons = container.querySelectorAll('div.flex.items-center.justify-between button');
    // Second button is delete
    await user.click(tagRowButtons[1] as HTMLElement);

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText(/Are you sure you want to delete the tag "DeleteMe"/),
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(deleteCalled).toBe(true));
    const { toast } = await import('sonner');
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Tag deleted'));
  });

  it('returns early from handleDeleteTag when no target is selected', async () => {
    server.use(
      http.get(url('/auth/me'), () => HttpResponse.json(makeUser())),
      http.get(url('/tags'), () =>
        HttpResponse.json([makeTag({ id: 1, name: 'Untouched' })]),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<ProfilePage />);
    await screen.findByText('Untouched');

    await user.click(screen.getByTestId('force-confirm-tag'));
    const { toast } = await import('sonner');
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('disables the Add button while creating', async () => {
    server.use(
      http.get(url('/auth/me'), () => HttpResponse.json(makeUser())),
      http.get(url('/tags'), () => HttpResponse.json([])),
      http.post(url('/tags'), async () => {
        await delay('infinite');
        return HttpResponse.json(makeTag());
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<ProfilePage />);
    await screen.findByText('No tags created yet.');

    await user.type(screen.getByPlaceholderText(/Tag name/), 'Pending');
    await user.click(screen.getByRole('button', { name: /Add/ }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add/ })).toBeDisabled();
    });
  });
});
