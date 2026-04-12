import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse, delay } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterPage from './register-page';
import { renderWithProviders } from '../../../tests/utils/render';
import { server } from '../../../tests/msw/server';
import { useAuthStore } from '@core/stores/auth-store';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe('RegisterPage', () => {
  beforeEach(() => {
    navigateMock.mockClear();
  });

  it('renders the register form fields and link to login', () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByText('Create an account')).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Create Account' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('shows validation errors for short name, bad email, and short password', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);
    // jsdom enforces HTML5 email validation on type="email" fields, which would
    // otherwise block submission and prevent zod errors from rendering.
    const nameInput = screen.getByLabelText('Full Name');
    (nameInput.closest('form') as HTMLFormElement).noValidate = true;
    await user.type(nameInput, 'a');
    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Password'), 'short');
    await user.type(screen.getByLabelText('Confirm Password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Create Account' }));
    expect(
      await screen.findByText('Name must be at least 2 characters'),
    ).toBeInTheDocument();
    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument();
    expect(
      await screen.findByText('Password must be at least 8 characters'),
    ).toBeInTheDocument();
  });

  it('shows a mismatch error when passwords do not match', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);
    await user.type(screen.getByLabelText('Full Name'), 'Jane Doe');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'longenough');
    await user.type(screen.getByLabelText('Confirm Password'), 'different1');
    await user.click(screen.getByRole('button', { name: 'Create Account' }));
    expect(
      await screen.findByText('Passwords do not match'),
    ).toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    expect(passwordInput.type).toBe('password');
    const toggle = screen
      .getAllByRole('button')
      .find((b) => b.getAttribute('type') === 'button');
    await user.click(toggle!);
    expect(passwordInput.type).toBe('text');
    await user.click(toggle!);
    expect(passwordInput.type).toBe('password');
  });

  it('registers successfully and navigates to /dashboard', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);
    await user.type(screen.getByLabelText('Full Name'), 'Jane Doe');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'longenough');
    await user.type(screen.getByLabelText('Confirm Password'), 'longenough');
    await user.click(screen.getByRole('button', { name: 'Create Account' }));
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/dashboard');
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('shows the server error message when registration fails', async () => {
    server.use(
      http.post('http://localhost:5236/api/auth/register', () =>
        HttpResponse.json({ message: 'Email already in use' }, { status: 409 }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);
    await user.type(screen.getByLabelText('Full Name'), 'Jane Doe');
    await user.type(screen.getByLabelText('Email'), 'taken@example.com');
    await user.type(screen.getByLabelText('Password'), 'longenough');
    await user.type(screen.getByLabelText('Confirm Password'), 'longenough');
    await user.click(screen.getByRole('button', { name: 'Create Account' }));
    expect(
      await screen.findByText('Email already in use'),
    ).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('shows a spinner and disables the submit button while registering', async () => {
    server.use(
      http.post('http://localhost:5236/api/auth/register', async () => {
        await delay(50);
        return HttpResponse.json({
          token: 'test-token',
          user: {
            id: 1,
            name: 'Jane',
            email: 'jane@example.com',
            role: 'User',
            avatarUrl: null,
            createdAt: '2024-01-01T00:00:00Z',
          },
        });
      }),
    );
    const user = userEvent.setup();
    const { container } = renderWithProviders(<RegisterPage />);
    await user.type(screen.getByLabelText('Full Name'), 'Jane Doe');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'longenough');
    await user.type(screen.getByLabelText('Confirm Password'), 'longenough');
    await user.click(screen.getByRole('button', { name: 'Create Account' }));
    await waitFor(() => {
      const submit = container.querySelector(
        'button[type="submit"]',
      ) as HTMLButtonElement;
      expect(submit.disabled).toBe(true);
      expect(submit.querySelector('.animate-spin')).not.toBeNull();
    });
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('falls back to a generic error message when the server omits one', async () => {
    server.use(
      http.post('http://localhost:5236/api/auth/register', () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);
    await user.type(screen.getByLabelText('Full Name'), 'Jane Doe');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'longenough');
    await user.type(screen.getByLabelText('Confirm Password'), 'longenough');
    await user.click(screen.getByRole('button', { name: 'Create Account' }));
    expect(await screen.findByText('Registration failed')).toBeInTheDocument();
  });
});
