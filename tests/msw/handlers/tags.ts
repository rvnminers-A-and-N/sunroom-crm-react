import { http, HttpResponse } from 'msw';
import { url } from './url';
import { makeTag } from '../data/factories';

export const tagsHandlers = [
  http.get(url('/tags'), () => {
    return HttpResponse.json([makeTag()]);
  }),

  http.post(url('/tags'), async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(makeTag({ id: 2, ...body }));
  }),

  http.put(url('/tags/:id'), async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(makeTag({ id: Number(params.id), ...body }));
  }),

  http.delete(url('/tags/:id'), () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
