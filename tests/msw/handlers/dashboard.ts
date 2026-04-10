import { http, HttpResponse } from 'msw';
import { url } from './url';
import { makeDashboard } from '../data/factories';

export const dashboardHandlers = [
  http.get(url('/dashboard'), () => {
    return HttpResponse.json(makeDashboard());
  }),
];
