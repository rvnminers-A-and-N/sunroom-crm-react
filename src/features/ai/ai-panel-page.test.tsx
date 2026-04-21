import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../tests/msw/server';
import { url } from '../../../tests/msw/handlers/url';
import { renderWithProviders } from '../../../tests/utils/render';
import AiPanelPage from './ai-panel-page';

/**
 * Helper: creates an MSW-compatible SSE streaming response.
 * Emits each token as `data: {"token":"..."}\n\n` followed by `data: [DONE]\n\n`.
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

/**
 * Helper: creates an SSE response that never completes (for pending/spinner tests).
 */
function sseStreamPending() {
  const stream = new ReadableStream({
    start() {
      // Never enqueue or close — simulates infinite pending stream
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

describe('AiPanelPage', () => {
  it('renders the page header and tabs', () => {
    renderWithProviders(<AiPanelPage />);
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Smart Search/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Summarize/ })).toBeInTheDocument();
  });

  it('disables the Search button when the query is empty or whitespace', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AiPanelPage />);

    const button = screen.getByRole('button', { name: 'Search' });
    expect(button).toBeDisabled();

    const input = screen.getByPlaceholderText(/Who did I talk to/);
    await user.type(input, '   ');
    expect(button).toBeDisabled();
  });

  it('returns early from handleSearch when the query is whitespace via Enter', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AiPanelPage />);

    const input = screen.getByPlaceholderText(/Who did I talk to/);
    await user.type(input, '   ');
    await user.keyboard('{Enter}');
    // No spinner should appear because stream was not called
    expect(document.querySelector('.animate-spin')).toBeNull();
  });

  it('runs the search and renders the streamed text', async () => {
    server.use(
      http.post(url('/ai/search/stream'), () =>
        sseStreamResponse(['Looking', ' for', ' VIPs']),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<AiPanelPage />);

    const input = screen.getByPlaceholderText(/Who did I talk to/);
    await user.type(input, 'find vips');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByText('Looking for VIPs')).toBeInTheDocument();
  });

  it('runs the search via the Enter key', async () => {
    server.use(
      http.post(url('/ai/search/stream'), () =>
        sseStreamResponse(['enter-search']),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<AiPanelPage />);

    const input = screen.getByPlaceholderText(/Who did I talk to/);
    await user.type(input, 'enter test');
    await user.keyboard('{Enter}');
    expect(await screen.findByText('enter-search')).toBeInTheDocument();
  });

  it('shows the Results heading when streaming search', async () => {
    server.use(
      http.post(url('/ai/search/stream'), () =>
        sseStreamResponse(['No', ' results', ' found']),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<AiPanelPage />);

    await user.type(screen.getByPlaceholderText(/Who did I talk to/), 'nothing');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByText('No results found')).toBeInTheDocument();
    expect(screen.getByText('Results')).toBeInTheDocument();
  });

  it('renders multiple tokens concatenated from search stream', async () => {
    server.use(
      http.post(url('/ai/search/stream'), () =>
        sseStreamResponse(['Solo', ' Person', ' found']),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<AiPanelPage />);

    await user.type(screen.getByPlaceholderText(/Who did I talk to/), 'plain');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByText('Solo Person found')).toBeInTheDocument();
  });

  it('shows a spinner on the Search button while streaming', async () => {
    server.use(
      http.post(url('/ai/search/stream'), () => sseStreamPending()),
    );

    const user = userEvent.setup();
    renderWithProviders(<AiPanelPage />);

    await user.type(screen.getByPlaceholderText(/Who did I talk to/), 'pending');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeNull();
    });
  });

  it('returns early from handleSummarize when the text is whitespace', async () => {
    let streamCalled = false;
    server.use(
      http.post(url('/ai/summarize/stream'), () => {
        streamCalled = true;
        return sseStreamResponse(['should not happen']);
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<AiPanelPage />);

    await user.click(screen.getByRole('tab', { name: /Summarize/ }));
    await user.type(
      screen.getByPlaceholderText(/Paste your meeting notes/),
      '   ',
    );

    // Find the button, attach a synthetic call. React filters click events
    // on disabled buttons, so we extract the React onClick prop directly
    // from the fiber and invoke it to hit the early-return guard.
    const button = screen.getByRole('button', { name: /Summarize/ });
    const fiberKey = Object.keys(button).find((k) =>
      k.startsWith('__reactProps$'),
    ) as keyof typeof button | undefined;
    if (!fiberKey) throw new Error('React props fiber key not found');
    const props = (button as unknown as Record<string, { onClick?: () => void }>)[
      fiberKey as string
    ];
    props?.onClick?.();

    await new Promise((r) => setTimeout(r, 30));
    expect(streamCalled).toBe(false);
  });

  it('disables the Summarize button until text is entered', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AiPanelPage />);

    await user.click(screen.getByRole('tab', { name: /Summarize/ }));
    const button = screen.getByRole('button', { name: /Summarize/ });
    expect(button).toBeDisabled();

    const textarea = screen.getByPlaceholderText(/Paste your meeting notes/);
    await user.type(textarea, '   ');
    expect(button).toBeDisabled();
  });

  it('runs summarize and shows the summary text', async () => {
    server.use(
      http.post(url('/ai/summarize/stream'), () =>
        sseStreamResponse(['Three', ' key', ' points']),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<AiPanelPage />);

    await user.click(screen.getByRole('tab', { name: /Summarize/ }));
    await user.type(
      screen.getByPlaceholderText(/Paste your meeting notes/),
      'a long block of text',
    );
    await user.click(screen.getByRole('button', { name: /Summarize/ }));

    expect(await screen.findByText('Three key points')).toBeInTheDocument();
    expect(screen.getByText('Summary')).toBeInTheDocument();
  });

  it('shows a spinner on the Summarize button while streaming', async () => {
    server.use(
      http.post(url('/ai/summarize/stream'), () => sseStreamPending()),
    );

    const user = userEvent.setup();
    renderWithProviders(<AiPanelPage />);

    await user.click(screen.getByRole('tab', { name: /Summarize/ }));
    await user.type(
      screen.getByPlaceholderText(/Paste your meeting notes/),
      'something',
    );
    await user.click(screen.getByRole('button', { name: /Summarize/ }));

    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeNull();
    });
  });
});
