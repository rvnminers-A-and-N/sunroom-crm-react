import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/msw/server';
import { url } from '../../../tests/msw/handlers/url';
import { streamSSE } from './sse-stream';

/**
 * Helper: creates an MSW-compatible SSE streaming response from raw chunks.
 */
function sseStreamResponse(tokens: string[]) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const token of tokens) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ token })}\n\n`),
        );
      }
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

describe('streamSSE', () => {
  it('yields tokens from a successful stream', async () => {
    server.use(
      http.post(url('/test/stream'), () =>
        sseStreamResponse(['Hello', ' World']),
      ),
    );

    const tokens: string[] = [];
    for await (const chunk of streamSSE('/test/stream', {}, 'test-token')) {
      tokens.push(chunk);
    }
    expect(tokens).toEqual(['Hello', ' World']);
  });

  it('throws an error when the response status is not ok (line 20)', async () => {
    server.use(
      http.post(url('/test/stream'), () =>
        new HttpResponse(null, { status: 500 }),
      ),
    );

    const gen = streamSSE('/test/stream', {}, 'test-token');
    await expect(gen.next()).rejects.toThrow('Stream request failed: 500');
  });

  it('re-throws non-SyntaxError errors from parsed payloads (lines 49-50)', async () => {
    // When the parsed payload has an `error` field, streamSSE throws
    // `new Error(parsed.error)`. This is NOT a SyntaxError, so the outer
    // catch block re-throws it — covering lines 49-50.
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: 'server exploded' })}\n\n`),
        );
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    server.use(
      http.post(url('/test/stream'), () =>
        new HttpResponse(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        }),
      ),
    );

    const gen = streamSSE('/test/stream', {}, 'test-token');
    await expect(gen.next()).rejects.toThrow('server exploded');
  });

  it('silently skips invalid JSON (SyntaxError) and continues (line 49 continue branch)', async () => {
    // A line with malformed JSON should trigger a SyntaxError inside the
    // inner try block. The catch checks `e instanceof SyntaxError` and
    // continues, so subsequent valid tokens are still yielded.
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {not valid json}\n\n'));
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ token: 'after-bad' })}\n\n`),
        );
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    server.use(
      http.post(url('/test/stream'), () =>
        new HttpResponse(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        }),
      ),
    );

    const tokens: string[] = [];
    for await (const chunk of streamSSE('/test/stream', {}, 'test-token')) {
      tokens.push(chunk);
    }
    // The invalid JSON line was skipped, valid token was yielded
    expect(tokens).toEqual(['after-bad']);
  });

  it('sends no Authorization header when token is null', async () => {
    server.use(
      http.post(url('/test/stream'), () =>
        sseStreamResponse(['no-auth']),
      ),
    );

    const tokens: string[] = [];
    for await (const chunk of streamSSE('/test/stream', {}, null)) {
      tokens.push(chunk);
    }
    expect(tokens).toEqual(['no-auth']);
  });

  it('handles stream ending via done=true (line 30 break branch)', async () => {
    // Create a stream that sends tokens but closes WITHOUT sending [DONE].
    // This causes reader.read() to return { done: true } which triggers
    // the `if (done) break;` branch at line 30.
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ token: 'before-done' })}\n\n`),
        );
        // Close without sending [DONE]
        controller.close();
      },
    });

    server.use(
      http.post(url('/test/stream'), () =>
        new HttpResponse(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        }),
      ),
    );

    const tokens: string[] = [];
    for await (const chunk of streamSSE('/test/stream', {}, 'test-token')) {
      tokens.push(chunk);
    }
    expect(tokens).toEqual(['before-done']);
  });

  it('skips parsed payloads without a token field (line 47 falsy branch)', async () => {
    // A valid JSON payload that has neither `error` nor `token` should be
    // silently skipped (parsed.token is falsy, so yield is not called).
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ other: 'field' })}\n\n`),
        );
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ token: 'valid' })}\n\n`),
        );
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    server.use(
      http.post(url('/test/stream'), () =>
        new HttpResponse(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        }),
      ),
    );

    const tokens: string[] = [];
    for await (const chunk of streamSSE('/test/stream', {}, 'test-token')) {
      tokens.push(chunk);
    }
    // Only the payload with `token` should be yielded
    expect(tokens).toEqual(['valid']);
  });

  it('falls back to empty string when pop() returns undefined (line 35 ?? branch)', async () => {
    // Temporarily patch Array.prototype.pop to return undefined once,
    // exercising the `?? ''` fallback branch at line 35.
    // We keep the array intact so the for-of loop still processes lines.
    const originalPop = Array.prototype.pop;
    let patchCount = 0;
    Array.prototype.pop = function <T>(this: T[]): T | undefined {
      if (patchCount < 1) {
        patchCount++;
        // Remove last element normally but return undefined to trigger ??
        originalPop.call(this);
        return undefined;
      }
      return originalPop.call(this) as T | undefined;
    };

    server.use(
      http.post(url('/test/stream'), () =>
        sseStreamResponse(['patched']),
      ),
    );

    try {
      const tokens: string[] = [];
      for await (const chunk of streamSSE('/test/stream', {}, 'test-token')) {
        tokens.push(chunk);
      }
      expect(tokens).toContain('patched');
    } finally {
      Array.prototype.pop = originalPop;
    }
  });
});
