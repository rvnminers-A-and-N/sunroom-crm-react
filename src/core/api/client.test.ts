import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { apiClient } from './client';
import { useAuthStore } from '../stores/auth-store';
import { server } from '../../../tests/msw/server';
import { url } from '../../../tests/msw/handlers';
import { makeUser } from '../../../tests/msw/data/factories';

describe('apiClient', () => {
  let originalLocation: Location;
  let assignedHref: string;

  function makeLocationMock(): Location {
    const initial = 'http://localhost/';
    assignedHref = initial;
    const mock: Partial<Location> & { toString: () => string } = {
      origin: 'http://localhost',
      protocol: 'http:',
      host: 'localhost',
      hostname: 'localhost',
      port: '',
      pathname: '/',
      search: '',
      hash: '',
      ancestorOrigins: {} as DOMStringList,
      assign: () => {},
      replace: () => {},
      reload: () => {},
      toString: () => assignedHref,
    };
    Object.defineProperty(mock, 'href', {
      configurable: true,
      get: () => assignedHref,
      set: (value: string) => {
        assignedHref = value;
      },
    });
    return mock as Location;
  }

  beforeEach(() => {
    originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: makeLocationMock(),
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
  });

  it('uses VITE_API_URL as the base URL', () => {
    expect(apiClient.defaults.baseURL).toBe('http://localhost:5236/api');
  });

  it('does not send an Authorization header when no token is present', async () => {
    let captured: string | null = 'unset';
    server.use(
      http.get(url('/probe-no-auth'), ({ request }) => {
        captured = request.headers.get('authorization');
        return HttpResponse.json({ ok: true });
      }),
    );

    await apiClient.get('/probe-no-auth');
    expect(captured).toBeNull();
  });

  it('adds a Bearer token from the auth store on outgoing requests', async () => {
    useAuthStore.getState().setAuth(makeUser(), 'jwt-test');

    let captured: string | null = null;
    server.use(
      http.get(url('/probe-auth'), ({ request }) => {
        captured = request.headers.get('authorization');
        return HttpResponse.json({ ok: true });
      }),
    );

    await apiClient.get('/probe-auth');
    expect(captured).toBe('Bearer jwt-test');
  });

  it('logs out and redirects to /auth/login on a 401 response', async () => {
    useAuthStore.getState().setAuth(makeUser(), 'jwt-bad');

    server.use(
      http.get(url('/probe-401'), () => {
        return HttpResponse.json({ message: 'unauthorized' }, { status: 401 });
      }),
    );

    await expect(apiClient.get('/probe-401')).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().token).toBeNull();
    expect(window.location.href).toBe('/auth/login');
  });

  it('rejects non-401 errors without logging out or redirecting', async () => {
    useAuthStore.getState().setAuth(makeUser(), 'jwt-stay');

    server.use(
      http.get(url('/probe-500'), () => {
        return HttpResponse.json({ message: 'boom' }, { status: 500 });
      }),
    );

    await expect(apiClient.get('/probe-500')).rejects.toMatchObject({
      response: { status: 500 },
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().token).toBe('jwt-stay');
    expect(window.location.href).toBe('http://localhost/');
  });

  it('rejects network-level errors that have no response', async () => {
    server.use(
      http.get(url('/probe-network'), () => {
        return HttpResponse.error();
      }),
    );

    await expect(apiClient.get('/probe-network')).rejects.toBeDefined();
    expect(window.location.href).toBe('http://localhost/');
  });
});
