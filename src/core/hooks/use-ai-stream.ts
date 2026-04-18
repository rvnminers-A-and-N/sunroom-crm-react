import { useState, useCallback, useRef } from 'react';
import { useAuthStore } from '@core/stores/auth-store';
import { streamSSE } from '@core/api/sse-stream';

export function useSummarizeStream() {
  const [text, setText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stream = useCallback(async (input: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setText('');
    setError(null);
    setIsStreaming(true);

    try {
      const token = useAuthStore.getState().token;
      for await (const chunk of streamSSE(
        '/ai/summarize/stream',
        { text: input },
        token,
        controller.signal,
      )) {
        setText((prev) => prev + chunk);
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setError((e as Error).message);
      }
    } finally {
      setIsStreaming(false);
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { text, isStreaming, error, stream, cancel };
}

export function useSmartSearchStream() {
  const [text, setText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stream = useCallback(async (query: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setText('');
    setError(null);
    setIsStreaming(true);

    try {
      const token = useAuthStore.getState().token;
      for await (const chunk of streamSSE(
        '/ai/search/stream',
        { query },
        token,
        controller.signal,
      )) {
        setText((prev) => prev + chunk);
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setError((e as Error).message);
      }
    } finally {
      setIsStreaming(false);
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { text, isStreaming, error, stream, cancel };
}

export function useDealInsightsStream() {
  const [text, setText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stream = useCallback(async (dealId: number) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setText('');
    setError(null);
    setIsStreaming(true);

    try {
      const token = useAuthStore.getState().token;
      for await (const chunk of streamSSE(
        `/ai/deal-insights/${dealId}/stream`,
        {},
        token,
        controller.signal,
      )) {
        setText((prev) => prev + chunk);
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setError((e as Error).message);
      }
    } finally {
      setIsStreaming(false);
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { text, isStreaming, error, stream, cancel };
}
