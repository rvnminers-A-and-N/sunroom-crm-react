import { http, HttpResponse } from 'msw';
import { url } from './url';
import { makeUser } from '../data/factories';

export const usersHandlers = [
  http.get(url('/users'), () => {
    return HttpResponse.json([makeUser()]);
  }),

  http.get(url('/users/:id'), ({ params }) => {
    return HttpResponse.json(makeUser({ id: Number(params.id) }));
  }),

  http.put(url('/users/:id'), async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(makeUser({ id: Number(params.id), ...body }));
  }),

  http.delete(url('/users/:id'), () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
