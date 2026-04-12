import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createTestQueryClient } from '../../../tests/utils/query-client';
import { createWrapper } from '../../../tests/utils/render';
import {
  useCompanies,
  useCompany,
  useCreateCompany,
  useDeleteCompany,
  useUpdateCompany,
} from './use-companies';

describe('use-companies', () => {
  it('useCompanies returns paginated list', async () => {
    const { result } = renderHook(() => useCompanies({ page: 1, perPage: 10 }), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data?.[0]).toMatchObject({ id: 1, name: 'Acme Inc' });
  });

  it('useCompany fetches by id', async () => {
    const { result } = renderHook(() => useCompany(2), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toMatchObject({ id: 2 });
  });

  it('useCompany is disabled when id=0', () => {
    const { result } = renderHook(() => useCompany(0), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('useCreateCompany posts and invalidates companies', async () => {
    const qc = createTestQueryClient();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useCreateCompany(), {
      wrapper: createWrapper({ queryClient: qc }),
    });
    await act(async () => {
      await result.current.mutateAsync({ name: 'New Co' });
    });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['companies'] });
  });

  it('useUpdateCompany puts and invalidates list and detail', async () => {
    const qc = createTestQueryClient();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateCompany(5), {
      wrapper: createWrapper({ queryClient: qc }),
    });
    await act(async () => {
      await result.current.mutateAsync({ name: 'Updated' });
    });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['companies'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['companies', 5] });
  });

  it('useDeleteCompany deletes and invalidates companies', async () => {
    const qc = createTestQueryClient();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteCompany(), {
      wrapper: createWrapper({ queryClient: qc }),
    });
    await act(async () => {
      await result.current.mutateAsync(7);
    });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['companies'] });
  });
});
