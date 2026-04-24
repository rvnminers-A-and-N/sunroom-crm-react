import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { http, HttpResponse, delay } from 'msw';
import { server } from '../../../tests/msw/server';
import { url } from '../../../tests/msw/handlers/url';
import {
  useSummarizeStream,
  useSmartSearchStream,
  useDealInsightsStream,
} from './use-ai-stream';

/**
 * Helper: creates an MSW-compatible SSE streaming response.
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

// --------------- useSummarizeStream ---------------

describe('useSummarizeStream', () => {
  it('sets error state when the stream fails (covers lines 31-32)', async () => {
    server.use(
      http.post(url('/ai/summarize/stream'), () =>
        new HttpResponse(null, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useSummarizeStream());

    await act(async () => {
      await result.current.stream('some text');
    });

    expect(result.current.error).toBe('Stream request failed: 500');
    expect(result.current.isStreaming).toBe(false);
  });

  it('cancel can be called safely (covers line 40)', () => {
    const { result } = renderHook(() => useSummarizeStream());

    expect(() => {
      act(() => {
        result.current.cancel();
      });
    }).not.toThrow();
  });

  it('ignores AbortError when stream is cancelled (covers line 31 false branch)', async () => {
    server.use(
      http.post(url('/ai/summarize/stream'), async () => {
        await delay('infinite');
        return sseStreamResponse(['never']);
      }),
    );

    const { result } = renderHook(() => useSummarizeStream());

    // Start the stream (don't await -- it will be aborted)
    let streamPromise: Promise<void>;
    act(() => {
      streamPromise = result.current.stream('some text');
    });

    // Wait for isStreaming to become true
    await waitFor(() => {
      expect(result.current.isStreaming).toBe(true);
    });

    // Cancel the stream (triggers AbortError)
    act(() => {
      result.current.cancel();
    });

    // Wait for the stream promise to settle
    await act(async () => {
      await streamPromise!;
    });

    // AbortError should NOT set the error state
    expect(result.current.error).toBeNull();
    expect(result.current.isStreaming).toBe(false);
  });
});

// --------------- useSmartSearchStream ---------------

describe('useSmartSearchStream', () => {
  it('sets error state when the stream fails (covers lines 72-73)', async () => {
    server.use(
      http.post(url('/ai/search/stream'), () =>
        new HttpResponse(null, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useSmartSearchStream());

    await act(async () => {
      await result.current.stream('find something');
    });

    expect(result.current.error).toBe('Stream request failed: 500');
    expect(result.current.isStreaming).toBe(false);
  });

  it('cancel can be called safely (covers line 81)', () => {
    const { result } = renderHook(() => useSmartSearchStream());

    expect(() => {
      act(() => {
        result.current.cancel();
      });
    }).not.toThrow();
  });

  it('ignores AbortError when stream is cancelled (covers line 72 false branch)', async () => {
    server.use(
      http.post(url('/ai/search/stream'), async () => {
        await delay('infinite');
        return sseStreamResponse(['never']);
      }),
    );

    const { result } = renderHook(() => useSmartSearchStream());

    let streamPromise: Promise<void>;
    act(() => {
      streamPromise = result.current.stream('find something');
    });

    await waitFor(() => {
      expect(result.current.isStreaming).toBe(true);
    });

    act(() => {
      result.current.cancel();
    });

    await act(async () => {
      await streamPromise!;
    });

    expect(result.current.error).toBeNull();
    expect(result.current.isStreaming).toBe(false);
  });
});

// --------------- useDealInsightsStream ---------------

describe('useDealInsightsStream', () => {
  it('streams tokens and accumulates text for a given dealId', async () => {
    server.use(
      http.post(url('/ai/deal-insights/42/stream'), () =>
        sseStreamResponse(['Deal', ' looks', ' promising']),
      ),
    );

    const { result } = renderHook(() => useDealInsightsStream());

    expect(result.current.text).toBe('');
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.error).toBeNull();

    await act(async () => {
      await result.current.stream(42);
    });

    expect(result.current.text).toBe('Deal looks promising');
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets error state when the stream fails', async () => {
    server.use(
      http.post(url('/ai/deal-insights/99/stream'), () =>
        new HttpResponse(null, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useDealInsightsStream());

    await act(async () => {
      await result.current.stream(99);
    });

    expect(result.current.error).toBe('Stream request failed: 500');
    expect(result.current.isStreaming).toBe(false);
  });

  it('cancel can be called safely when not streaming (covers line 122)', () => {
    const { result } = renderHook(() => useDealInsightsStream());

    expect(() => {
      act(() => {
        result.current.cancel();
      });
    }).not.toThrow();
  });

  it('calling stream a second time aborts the previous stream (covers line 94)', async () => {
    server.use(
      http.post(url('/ai/deal-insights/1/stream'), () =>
        sseStreamResponse(['first']),
      ),
      http.post(url('/ai/deal-insights/2/stream'), () =>
        sseStreamResponse(['second']),
      ),
    );

    const { result } = renderHook(() => useDealInsightsStream());

    // Call stream twice -- the second call aborts the first controller (line 94)
    await act(async () => {
      const first = result.current.stream(1);
      const second = result.current.stream(2);
      await Promise.allSettled([first, second]);
    });

    // The last stream's result should be the final text
    expect(result.current.text).toBe('second');
    expect(result.current.isStreaming).toBe(false);
  });

  it('ignores AbortError when stream is cancelled (covers line 113 false branch)', async () => {
    server.use(
      http.post(url('/ai/deal-insights/42/stream'), async () => {
        await delay('infinite');
        return sseStreamResponse(['never']);
      }),
    );

    const { result } = renderHook(() => useDealInsightsStream());

    let streamPromise: Promise<void>;
    act(() => {
      streamPromise = result.current.stream(42);
    });

    await waitFor(() => {
      expect(result.current.isStreaming).toBe(true);
    });

    act(() => {
      result.current.cancel();
    });

    await act(async () => {
      await streamPromise!;
    });

    expect(result.current.error).toBeNull();
    expect(result.current.isStreaming).toBe(false);
  });
});
