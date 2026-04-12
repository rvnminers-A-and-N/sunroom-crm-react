import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createWrapper } from '../../../tests/utils/render';
import { useDashboard } from './use-dashboard';

describe('useDashboard', () => {
  it('fetches dashboard data', async () => {
    const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.totalContacts).toBe(10);
    expect(result.current.data?.totalCompanies).toBe(4);
  });
});
