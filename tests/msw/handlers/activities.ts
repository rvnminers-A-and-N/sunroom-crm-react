import { http, HttpResponse } from 'msw';
import { url } from './url';
import { makeActivity, makePaginated } from '../data/factories';

export const activitiesHandlers = [
  http.get(url('/activities'), () => {
    return HttpResponse.json(makePaginated([makeActivity()]));
  }),

  http.get(url('/activities/:id'), ({ params }) => {
    return HttpResponse.json(makeActivity({ id: Number(params.id) }));
  }),

  http.post(url('/activities'), async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(makeActivity({ id: 2, ...body }));
  }),

  http.put(url('/activities/:id'), async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(makeActivity({ id: Number(params.id), ...body }));
  }),

  http.delete(url('/activities/:id'), () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
