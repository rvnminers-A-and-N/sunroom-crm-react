import { http, HttpResponse } from 'msw';
import { url } from './url';

export const aiHandlers = [
  http.post(url('/ai/summarize'), () => {
    return HttpResponse.json({ summary: 'A short summary.' });
  }),

  http.post(url('/ai/deal-insights/:id'), () => {
    return HttpResponse.json({ insight: 'A useful insight.' });
  }),

  http.post(url('/ai/search'), () => {
    return HttpResponse.json({
      interpretation: 'Searching for things',
      contacts: [],
      activities: [],
    });
  }),
];
