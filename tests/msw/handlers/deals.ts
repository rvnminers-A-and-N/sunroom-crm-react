import { http, HttpResponse } from 'msw';
import { url } from './url';
import {
  makeDeal,
  makeDealDetail,
  makePaginated,
  makePipeline,
} from '../data/factories';

export const dealsHandlers = [
  http.get(url('/deals'), () => {
    return HttpResponse.json(makePaginated([makeDeal()]));
  }),

  http.get(url('/deals/pipeline'), () => {
    return HttpResponse.json(makePipeline());
  }),

  http.get(url('/deals/:id'), ({ params }) => {
    return HttpResponse.json(makeDealDetail({ id: Number(params.id) }));
  }),

  http.post(url('/deals'), async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(makeDeal({ id: 2, ...body }));
  }),

  http.put(url('/deals/:id'), async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(makeDeal({ id: Number(params.id), ...body }));
  }),

  http.delete(url('/deals/:id'), () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
