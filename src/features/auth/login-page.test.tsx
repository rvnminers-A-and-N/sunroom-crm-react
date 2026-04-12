import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse, delay } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from './login-page';
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

describe('LoginPage', () => {
  beforeEach(() => {
    navigateMock.mockClear();
  });

  it('renders the login form fields and link to register', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Register' })).toBeInTheDocument();
  });

  it('shows validation errors when submitted with empty fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);
    await user.click(screen.getByRole('button', { name: 'Sign In' }));
    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(await screen.findByText('Password is required')).toBeInTheDocument();
  });

  it('shows email format validation error', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);
    // Disable HTML5 validation so jsdom does not block submission with the
    // type="email" field, allowing the zod resolver to surface its message.
    const emailInput = screen.getByLabelText('Email');
    (emailInput.closest('form') as HTMLFormElement).noValidate = true;
    await user.type(emailInput, 'not-an-email');
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));
    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument();
  });

  it('toggles password visibility when the eye button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    expect(passwordInput.type).toBe('password');
    // The toggle is the only non-submit button in the form
    const toggle = screen
      .getAllByRole('button')
      .find((b) => b.getAttribute('type') === 'button');
    expect(toggle).toBeDefined();
    await user.click(toggle!);
    expect(passwordInput.type).toBe('text');
    await user.click(toggle!);
    expect(passwordInput.type).toBe('password');
  });

  it('logs in successfully and navigates to /dashboard', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/dashboard');
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().token).toBe('test-token');
  });

  it('shows the server error message when login fails', async () => {
    server.use(
      http.post('http://localhost:5236/api/auth/login', () =>
        HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));
    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('shows a spinner and disables the submit button while logging in', async () => {
    server.use(
      http.post('http://localhost:5236/api/auth/login', async () => {
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
    const { container } = renderWithProviders(<LoginPage />);
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));
    // While the mutation is pending, the submit button should be disabled and
    // contain a spinner instead of the text label.
    await waitFor(() => {
      const submit = container.querySelector(
        'button[type="submit"]',
      ) as HTMLButtonElement;
      expect(submit.disabled).toBe(true);
      expect(submit.querySelector('.animate-spin')).not.toBeNull();
    });
    // And eventually the navigation fires once the mutation resolves.
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('falls back to a generic error message when the server omits one', async () => {
    server.use(
      http.post('http://localhost:5236/api/auth/login', () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));
    expect(await screen.findByText('Login failed')).toBeInTheDocument();
  });
});
