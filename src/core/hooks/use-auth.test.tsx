import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useAuthStore } from '@core/stores/auth-store';
import { createWrapper } from '../../../tests/utils/render';
import { useCurrentUser, useLogin, useLogout, useRegister } from './use-auth';

describe('use-auth', () => {
  it('useLogin sets auth store on success', async () => {
    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });
    await act(async () => {
      await result.current.mutateAsync({ email: 'a@b.test', password: 'pw' });
    });
    const state = useAuthStore.getState();
    expect(state.token).toBe('test-token');
    expect(state.user?.email).toBe('a@b.test');
    expect(state.isAuthenticated).toBe(true);
  });

  it('useRegister sets auth store on success', async () => {
    const { result } = renderHook(() => useRegister(), { wrapper: createWrapper() });
    await act(async () => {
      await result.current.mutateAsync({
        name: 'New User',
        email: 'n@b.test',
        password: 'pw',
      });
    });
    const state = useAuthStore.getState();
    expect(state.user?.email).toBe('n@b.test');
    expect(state.user?.name).toBe('New User');
    expect(state.isAuthenticated).toBe(true);
  });

  it('useCurrentUser is disabled when not authenticated', () => {
    const { result } = renderHook(() => useCurrentUser(), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('useCurrentUser fetches and sets user when authenticated', async () => {
    useAuthStore.setState({
      user: { id: 1, name: 'X', email: 'x@y.z', role: 'User', avatarUrl: null, createdAt: '' },
      token: 'test-token',
      isAuthenticated: true,
    });
    const { result } = renderHook(() => useCurrentUser(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.email).toBe('test@example.com');
    expect(useAuthStore.getState().user?.email).toBe('test@example.com');
  });

  it('useLogout logs out via store on settled', async () => {
    useAuthStore.setState({
      user: { id: 1, name: 'X', email: 'x@y.z', role: 'User', avatarUrl: null, createdAt: '' },
      token: 'test-token',
      isAuthenticated: true,
    });
    const { result } = renderHook(() => useLogout(), { wrapper: createWrapper() });
    await act(async () => {
      await result.current.mutateAsync();
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().token).toBeNull();
  });
});
