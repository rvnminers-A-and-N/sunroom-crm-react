import { describe, expect, it } from 'vitest';
import { useAuthStore } from './auth-store';
import { makeUser } from '../../../tests/msw/data/factories';

describe('useAuthStore', () => {
  it('starts in a logged-out state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('setAuth populates user, token, and flips isAuthenticated', () => {
    const user = makeUser({ id: 7, email: 'me@example.com' });
    useAuthStore.getState().setAuth(user, 'jwt-123');

    const state = useAuthStore.getState();
    expect(state.user).toEqual(user);
    expect(state.token).toBe('jwt-123');
    expect(state.isAuthenticated).toBe(true);
  });

  it('setUser updates the user without touching the token', () => {
    const user = makeUser({ id: 1 });
    useAuthStore.getState().setAuth(user, 'jwt-abc');

    const updated = makeUser({ id: 1, name: 'Renamed' });
    useAuthStore.getState().setUser(updated);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(updated);
    expect(state.token).toBe('jwt-abc');
  });

  it('logout clears user, token, and isAuthenticated', () => {
    useAuthStore.getState().setAuth(makeUser(), 'jwt-xyz');
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('persists only token and user via the partialize option', () => {
    const user = makeUser({ id: 5 });
    useAuthStore.getState().setAuth(user, 'jwt-persist');

    const persisted = JSON.parse(
      window.localStorage.getItem('sunroom_auth') ?? '{}',
    );

    expect(persisted.state).toEqual({ token: 'jwt-persist', user });
    expect(persisted.state).not.toHaveProperty('isAuthenticated');
  });
});
