import { describe, it, expect } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse, delay } from 'msw';
import { server } from '../../../tests/msw/server';
import { url } from '../../../tests/msw/handlers/url';
import { renderWithProviders } from '../../../tests/utils/render';
import { makeContact, makeActivity } from '../../../tests/msw/data/factories';
import AiPanelPage from './ai-panel-page';

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
    // No spinner should appear because mutate was not called
    expect(document.querySelector('.animate-spin')).toBeNull();
  });

  it('runs the search via the Search button and renders interpretation, contacts and activities', async () => {
    server.use(
      http.post(url('/ai/search'), () =>
        HttpResponse.json({
          interpretation: 'Looking for VIPs',
          contacts: [
            makeContact({
              id: 1,
              firstName: 'Jane',
              lastName: 'Doe',
              companyName: 'Acme Inc',
            }),
          ],
          activities: [
            makeActivity({
              id: 1,
              subject: 'Quarterly call',
              type: 'Call',
            }),
          ],
        }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<AiPanelPage />);

    const input = screen.getByPlaceholderText(/Who did I talk to/);
    await user.type(input, 'find vips');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByText('Looking for VIPs')).toBeInTheDocument();
    expect(screen.getByText(/Jane.*Doe/)).toBeInTheDocument();
    expect(screen.getByText('Acme Inc')).toBeInTheDocument();
    expect(screen.getByText('Contacts (1)')).toBeInTheDocument();
    expect(screen.getByText('Activities (1)')).toBeInTheDocument();
    expect(screen.getByText('Quarterly call')).toBeInTheDocument();
  });

  it('runs the search via the Enter key', async () => {
    server.use(
      http.post(url('/ai/search'), () =>
        HttpResponse.json({
          interpretation: 'enter-search',
          contacts: [],
          activities: [],
        }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<AiPanelPage />);

    const input = screen.getByPlaceholderText(/Who did I talk to/);
    await user.type(input, 'enter test');
    await user.keyboard('{Enter}');
    expect(await screen.findByText('enter-search')).toBeInTheDocument();
  });

  it('shows the no-results message when contacts and activities are empty', async () => {
    server.use(
      http.post(url('/ai/search'), () =>
        HttpResponse.json({
          interpretation: '',
          contacts: [],
          activities: [],
        }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<AiPanelPage />);

    await user.type(screen.getByPlaceholderText(/Who did I talk to/), 'nothing');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(
      await screen.findByText(/No results found/),
    ).toBeInTheDocument();
  });

  it('omits the company line for contacts without a companyName', async () => {
    server.use(
      http.post(url('/ai/search'), () =>
        HttpResponse.json({
          interpretation: 'plain',
          contacts: [
            makeContact({
              id: 2,
              firstName: 'Solo',
              lastName: 'Person',
              companyName: null,
            }),
          ],
          activities: [],
        }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<AiPanelPage />);

    await user.type(screen.getByPlaceholderText(/Who did I talk to/), 'plain');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByText(/Solo.*Person/)).toBeInTheDocument();
    // No company name span rendered
    expect(screen.queryByText('Acme Inc')).not.toBeInTheDocument();
  });

  it('shows a spinner on the Search button while pending', async () => {
    server.use(
      http.post(url('/ai/search'), async () => {
        await delay('infinite');
        return HttpResponse.json({
          interpretation: '',
          contacts: [],
          activities: [],
        });
      }),
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
    let postCalled = false;
    server.use(
      http.post(url('/ai/summarize'), () => {
        postCalled = true;
        return HttpResponse.json({ summary: '' });
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
    expect(postCalled).toBe(false);
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

  it('runs summarize and shows the summary card', async () => {
    server.use(
      http.post(url('/ai/summarize'), () =>
        HttpResponse.json({ summary: 'Three key points' }),
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

  it('shows a spinner on the Summarize button while pending', async () => {
    server.use(
      http.post(url('/ai/summarize'), async () => {
        await delay('infinite');
        return HttpResponse.json({ summary: '' });
      }),
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
