import { http, HttpResponse } from 'msw';
import { url } from './url';
import {
  makeCompany,
  makeCompanyDetail,
  makePaginated,
} from '../data/factories';

export const companiesHandlers = [
  http.get(url('/companies'), () => {
    return HttpResponse.json(makePaginated([makeCompany()]));
  }),

  http.get(url('/companies/:id'), ({ params }) => {
    return HttpResponse.json(
      makeCompanyDetail({ id: Number(params.id) }),
    );
  }),

  http.post(url('/companies'), async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(makeCompany({ id: 2, ...body }));
  }),

  http.put(url('/companies/:id'), async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(makeCompany({ id: Number(params.id), ...body }));
  }),

  http.delete(url('/companies/:id'), () => {
    return new HttpResponse(null, { status: 204 });
  }),
];
