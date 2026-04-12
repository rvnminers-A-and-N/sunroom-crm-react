import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createTestQueryClient } from '../../../tests/utils/query-client';
import { createWrapper } from '../../../tests/utils/render';
import {
  useActivities,
  useActivity,
  useCreateActivity,
  useDeleteActivity,
  useUpdateActivity,
} from './use-activities';

describe('use-activities', () => {
  it('useActivities returns paginated list', async () => {
    const { result } = renderHook(
      () => useActivities({ page: 1, perPage: 10 }),
      { wrapper: createWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data?.[0]).toMatchObject({ id: 1 });
  });

  it('useActivity fetches by id', async () => {
    const { result } = renderHook(() => useActivity(8), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject({ id: 8 });
  });

  it('useActivity is disabled when id=0', () => {
    const { result } = renderHook(() => useActivity(0), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('useCreateActivity posts and invalidates activities + dashboard', async () => {
    const qc = createTestQueryClient();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useCreateActivity(), {
      wrapper: createWrapper({ queryClient: qc }),
    });
    await act(async () => {
      await result.current.mutateAsync({ type: 'Note', subject: 'Hi' });
    });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['activities'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['dashboard'] });
  });

  it('useUpdateActivity puts and invalidates activities + detail', async () => {
    const qc = createTestQueryClient();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateActivity(5), {
      wrapper: createWrapper({ queryClient: qc }),
    });
    await act(async () => {
      await result.current.mutateAsync({ subject: 'Updated' });
    });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['activities'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['activities', 5] });
  });

  it('useDeleteActivity deletes and invalidates activities + dashboard', async () => {
    const qc = createTestQueryClient();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteActivity(), {
      wrapper: createWrapper({ queryClient: qc }),
    });
    await act(async () => {
      await result.current.mutateAsync(9);
    });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['activities'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['dashboard'] });
  });
});
