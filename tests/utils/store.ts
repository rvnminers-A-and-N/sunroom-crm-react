import { useAuthStore } from '@core/stores/auth-store';
import { useUiStore } from '@core/stores/ui-store';
import type { User } from '@core/models/user';

const initialAuthState = useAuthStore.getState();
const initialUiState = useUiStore.getState();

export function resetAuthStore(): void {
  useAuthStore.setState(
    {
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: initialAuthState.setAuth,
      setUser: initialAuthState.setUser,
      logout: initialAuthState.logout,
    },
    true,
  );
}

export function resetUiStore(): void {
  useUiStore.setState(
    {
      sidebarCollapsed: false,
      toggleSidebar: initialUiState.toggleSidebar,
      setSidebarCollapsed: initialUiState.setSidebarCollapsed,
    },
    true,
  );
}

export function seedAuth(user: User, token = 'test-token'): void {
  useAuthStore.setState({ user, token, isAuthenticated: true });
}
