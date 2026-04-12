import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createTestQueryClient } from '../../../tests/utils/query-client';
import { createWrapper } from '../../../tests/utils/render';
import { useDeleteUser, useUpdateUser, useUser, useUsers } from './use-users';

describe('use-users', () => {
  it('useUsers returns list', async () => {
    const { result } = renderHook(() => useUsers(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0]).toMatchObject({ id: 1 });
  });

  it('useUser fetches a single user', async () => {
    const { result } = renderHook(() => useUser(7), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject({ id: 7 });
  });

  it('useUser is disabled when id=0', () => {
    const { result } = renderHook(() => useUser(0), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('useUpdateUser puts and invalidates users', async () => {
    const qc = createTestQueryClient();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateUser(3), {
      wrapper: createWrapper({ queryClient: qc }),
    });
    await act(async () => {
      await result.current.mutateAsync({ name: 'Renamed' });
    });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['users'] });
  });

  it('useDeleteUser deletes and invalidates users', async () => {
    const qc = createTestQueryClient();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteUser(), {
      wrapper: createWrapper({ queryClient: qc }),
    });
    await act(async () => {
      await result.current.mutateAsync(3);
    });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['users'] });
  });
});
