import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createTestQueryClient } from '../../../tests/utils/query-client';
import { createWrapper } from '../../../tests/utils/render';
import { useDealInsights, useSmartSearch, useSummarize } from './use-ai';

describe('use-ai', () => {
  it('useSummarize posts and returns summary', async () => {
    const { result } = renderHook(() => useSummarize(), { wrapper: createWrapper() });
    let data;
    await act(async () => {
      data = await result.current.mutateAsync({ text: 'Some text' });
    });
    expect(data).toEqual({ summary: 'A short summary.' });
  });

  it('useDealInsights posts and invalidates the deal', async () => {
    const qc = createTestQueryClient();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useDealInsights(7), {
      wrapper: createWrapper({ queryClient: qc }),
    });
    let data;
    await act(async () => {
      data = await result.current.mutateAsync();
    });
    expect(data).toEqual({ insight: 'A useful insight.' });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['deals', 7] });
  });

  it('useSmartSearch posts and returns interpretation', async () => {
    const { result } = renderHook(() => useSmartSearch(), { wrapper: createWrapper() });
    let data;
    await act(async () => {
      data = await result.current.mutateAsync({ query: 'find people' });
    });
    expect(data).toMatchObject({ interpretation: 'Searching for things' });
  });
});
