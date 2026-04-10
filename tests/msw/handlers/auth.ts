import { http, HttpResponse } from 'msw';
import { url } from './url';
import { makeUser } from '../data/factories';
import type { LoginRequest, RegisterRequest } from '@core/models/user';

export const authHandlers = [
  http.post(url('/auth/login'), async ({ request }) => {
    const body = (await request.json()) as LoginRequest;
    return HttpResponse.json({
      token: 'test-token',
      user: makeUser({ email: body.email }),
    });
  }),

  http.post(url('/auth/register'), async ({ request }) => {
    const body = (await request.json()) as RegisterRequest;
    return HttpResponse.json({
      token: 'test-token',
      user: makeUser({ email: body.email, name: body.name }),
    });
  }),

  http.get(url('/auth/me'), () => {
    return HttpResponse.json(makeUser());
  }),

  http.post(url('/auth/logout'), () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
