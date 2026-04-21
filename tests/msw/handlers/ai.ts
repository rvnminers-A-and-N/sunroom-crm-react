import { http, HttpResponse } from 'msw';
import { url } from './url';

function defaultSseResponse(text = 'Default response') {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ token: text })}\n\n`),
      );
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new HttpResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

export const aiHandlers = [
  http.post(url('/ai/summarize'), () => {
    return HttpResponse.json({ summary: 'A short summary.' });
  }),

  http.post(url('/ai/summarize/stream'), () => {
    return defaultSseResponse('A short summary.');
  }),

  http.post(url('/ai/deal-insights/:id'), () => {
    return HttpResponse.json({ insight: 'A useful insight.' });
  }),

  http.post(url('/ai/deal-insights/:id/stream'), () => {
    return defaultSseResponse('A useful insight.');
  }),

  http.post(url('/ai/search'), () => {
    return HttpResponse.json({
      interpretation: 'Searching for things',
      contacts: [],
      activities: [],
    });
  }),

  http.post(url('/ai/search/stream'), () => {
    return defaultSseResponse('Searching for things');
  }),
];
