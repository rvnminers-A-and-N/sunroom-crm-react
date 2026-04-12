import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createTestQueryClient } from '../../../tests/utils/query-client';
import { createWrapper } from '../../../tests/utils/render';
import { useCreateTag, useDeleteTag, useTags, useUpdateTag } from './use-tags';

describe('use-tags', () => {
  it('useTags returns list', async () => {
    const { result } = renderHook(() => useTags(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0]).toMatchObject({ id: 1, name: 'VIP' });
  });

  it('useCreateTag posts and invalidates tags', async () => {
    const qc = createTestQueryClient();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useCreateTag(), {
      wrapper: createWrapper({ queryClient: qc }),
    });
    await act(async () => {
      await result.current.mutateAsync({ name: 'New', color: '#000' });
    });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['tags'] });
  });

  it('useUpdateTag puts and invalidates tags', async () => {
    const qc = createTestQueryClient();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateTag(5), {
      wrapper: createWrapper({ queryClient: qc }),
    });
    await act(async () => {
      await result.current.mutateAsync({ name: 'Renamed', color: '#fff' });
    });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['tags'] });
  });

  it('useDeleteTag deletes and invalidates tags', async () => {
    const qc = createTestQueryClient();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteTag(), {
      wrapper: createWrapper({ queryClient: qc }),
    });
    await act(async () => {
      await result.current.mutateAsync(1);
    });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['tags'] });
  });
});
