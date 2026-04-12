import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createTestQueryClient } from '../../../tests/utils/query-client';
import { createWrapper } from '../../../tests/utils/render';
import {
  useCreateDeal,
  useDeal,
  useDeals,
  useDeleteDeal,
  usePipeline,
  useUpdateDeal,
} from './use-deals';

describe('use-deals', () => {
  it('useDeals returns paginated list', async () => {
    const { result } = renderHook(
      () => useDeals({ page: 1, perPage: 10 }),
      { wrapper: createWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data?.[0]).toMatchObject({ title: 'New Deal' });
  });

  it('useDeal fetches by id', async () => {
    const { result } = renderHook(() => useDeal(3), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject({ id: 3 });
  });

  it('useDeal is disabled when id=0', () => {
    const { result } = renderHook(() => useDeal(0), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('usePipeline returns pipeline stages', async () => {
    const { result } = renderHook(() => usePipeline(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.stages?.[0]).toMatchObject({ stage: 'Lead' });
  });

  it('useCreateDeal posts and invalidates deals + dashboard', async () => {
    const qc = createTestQueryClient();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useCreateDeal(), {
      wrapper: createWrapper({ queryClient: qc }),
    });
    await act(async () => {
      await result.current.mutateAsync({ title: 'New', value: 100, stage: 'Lead' });
    });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['deals'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['dashboard'] });
  });

  it('useUpdateDeal puts and invalidates deals + detail + dashboard', async () => {
    const qc = createTestQueryClient();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateDeal(5), {
      wrapper: createWrapper({ queryClient: qc }),
    });
    await act(async () => {
      await result.current.mutateAsync({ title: 'Updated' });
    });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['deals'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['deals', 5] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['dashboard'] });
  });

  it('useDeleteDeal deletes and invalidates deals + dashboard', async () => {
    const qc = createTestQueryClient();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteDeal(), {
      wrapper: createWrapper({ queryClient: qc }),
    });
    await act(async () => {
      await result.current.mutateAsync(9);
    });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['deals'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['dashboard'] });
  });
});
