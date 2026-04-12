import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createTestQueryClient } from '../../../tests/utils/query-client';
import { createWrapper } from '../../../tests/utils/render';
import {
  useContact,
  useContacts,
  useCreateContact,
  useDeleteContact,
  useSyncContactTags,
  useUpdateContact,
} from './use-contacts';

describe('use-contacts', () => {
  it('useContacts returns paginated list', async () => {
    const { result } = renderHook(
      () => useContacts({ page: 1, perPage: 10 }),
      { wrapper: createWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data?.[0]).toMatchObject({ firstName: 'Jane' });
  });

  it('useContact fetches by id', async () => {
    const { result } = renderHook(() => useContact(2), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject({ id: 2 });
  });

  it('useContact is disabled when id=0', () => {
    const { result } = renderHook(() => useContact(0), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('useCreateContact posts and invalidates contacts', async () => {
    const qc = createTestQueryClient();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useCreateContact(), {
      wrapper: createWrapper({ queryClient: qc }),
    });
    await act(async () => {
      await result.current.mutateAsync({ firstName: 'New', lastName: 'Person' });
    });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['contacts'] });
  });

  it('useUpdateContact puts and invalidates list and detail', async () => {
    const qc = createTestQueryClient();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateContact(5), {
      wrapper: createWrapper({ queryClient: qc }),
    });
    await act(async () => {
      await result.current.mutateAsync({ firstName: 'Updated' });
    });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['contacts'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['contacts', 5] });
  });

  it('useDeleteContact deletes and invalidates contacts', async () => {
    const qc = createTestQueryClient();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteContact(), {
      wrapper: createWrapper({ queryClient: qc }),
    });
    await act(async () => {
      await result.current.mutateAsync(9);
    });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['contacts'] });
  });

  it('useSyncContactTags posts and invalidates contact detail', async () => {
    const qc = createTestQueryClient();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useSyncContactTags(4), {
      wrapper: createWrapper({ queryClient: qc }),
    });
    await act(async () => {
      await result.current.mutateAsync([1, 2]);
    });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['contacts', 4] });
  });
});
