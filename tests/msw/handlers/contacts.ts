import { http, HttpResponse } from 'msw';
import { url } from './url';
import {
  makeContact,
  makeContactDetail,
  makePaginated,
} from '../data/factories';

export const contactsHandlers = [
  http.get(url('/contacts'), () => {
    return HttpResponse.json(makePaginated([makeContact()]));
  }),

  http.get(url('/contacts/:id'), ({ params }) => {
    return HttpResponse.json(
      makeContactDetail({ id: Number(params.id) }),
    );
  }),

  http.post(url('/contacts'), async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(makeContact({ id: 2, ...body }));
  }),

  http.put(url('/contacts/:id'), async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(makeContact({ id: Number(params.id), ...body }));
  }),

  http.delete(url('/contacts/:id'), () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(url('/contacts/:id/tags'), () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
