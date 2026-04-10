import { describe, expect, it } from 'vitest';
import { apiClient } from '@core/api/client';
import { url } from './msw/handlers';

describe('test infrastructure sanity', () => {
  it('runs vitest assertions', () => {
    expect(1 + 1).toBe(2);
  });

  it('intercepts axios requests through MSW', async () => {
    const response = await apiClient.get('/auth/me');
    expect(response.status).toBe(200);
    expect(response.data).toMatchObject({ email: 'test@example.com' });
  });

  it('exposes a stable API_URL helper', () => {
    expect(url('/foo')).toBe('http://localhost:5236/api/foo');
  });
});
