import { useState } from 'react';
import {
  Sparkles,
  Search,
  Brain,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@shared/components/page-header';
import { useSummarizeStream, useSmartSearchStream, useDealInsightsStream } from '@core/hooks/use-ai-stream';

export default function AiPanelPage() {
  // Smart Search state
  const [searchQuery, setSearchQuery] = useState('');
  const smartSearch = useSmartSearchStream();

  // Summarize state
  const [summarizeText, setSummarizeText] = useState('');
  const summarize = useSummarizeStream();

  // Deal Insights state
  const [dealId, setDealId] = useState('');
  const dealInsights = useDealInsightsStream();

  function handleSearch() {
    if (!searchQuery.trim()) return;
    smartSearch.stream(searchQuery);
  }

  function handleSummarize() {
    if (!summarizeText.trim()) return;
    summarize.stream(summarizeText);
  }

  function handleGenerateInsights() {
    const id = parseInt(dealId, 10);
    if (isNaN(id) || id <= 0) return;
    dealInsights.stream(id);
  }

  return (
    <div>
      <PageHeader
        title="AI Assistant"
        subtitle="Smart search and text summarization powered by AI"
      />

      <Tabs defaultValue="search">
        <TabsList>
          <TabsTrigger value="search">
            <Search className="h-4 w-4 mr-1.5" />
            Smart Search
          </TabsTrigger>
          <TabsTrigger value="summarize">
            <Sparkles className="h-4 w-4 mr-1.5" />
            Summarize
          </TabsTrigger>
          <TabsTrigger value="insights">
            <TrendingUp className="h-4 w-4 mr-1.5" />
            Deal Insights
          </TabsTrigger>
        </TabsList>

        {/* Smart Search Tab */}
        <TabsContent value="search" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-4">
                Ask natural language questions about your contacts and
                activities.
              </p>

              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="e.g. Who did I talk to last week?"
                    className="pl-9"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={smartSearch.isStreaming || !searchQuery.trim()}
                  className="bg-sr-primary hover:bg-sr-primary-dark"
                >
                  {smartSearch.isStreaming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Search'
                  )}
                </Button>
              </div>

              {(smartSearch.text || smartSearch.isStreaming) && (
                <div className="mt-6 rounded-lg bg-muted/50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-4 w-4 text-sr-primary" />
                    <h4 className="text-sm font-semibold">Results</h4>
                    {smartSearch.isStreaming && (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">
                    {smartSearch.text}
                    {smartSearch.isStreaming && (
                      <span className="inline-block w-1.5 h-4 bg-sr-primary animate-pulse ml-0.5 align-text-bottom" />
                    )}
                  </p>
                </div>
              )}

              {smartSearch.error && (
                <p className="mt-4 text-sm text-destructive">{smartSearch.error}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Summarize Tab */}
        <TabsContent value="summarize" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-4">
                Paste meeting notes, emails, or any text to get a concise
                summary.
              </p>

              <Textarea
                value={summarizeText}
                onChange={(e) => setSummarizeText(e.target.value)}
                placeholder="Paste your meeting notes, email thread, or any text here..."
                rows={6}
                className="mb-4"
              />

              <Button
                onClick={handleSummarize}
                disabled={summarize.isStreaming || !summarizeText.trim()}
                className="bg-sr-primary hover:bg-sr-primary-dark"
              >
                {summarize.isStreaming ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {summarize.isStreaming ? 'Summarizing...' : 'Summarize'}
              </Button>

              {(summarize.text || summarize.isStreaming) && (
                <div className="mt-6 rounded-lg bg-muted/50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-sr-gold" />
                    <h4 className="text-sm font-semibold">Summary</h4>
                    {summarize.isStreaming && (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">
                    {summarize.text}
                    {summarize.isStreaming && (
                      <span className="inline-block w-1.5 h-4 bg-sr-primary animate-pulse ml-0.5 align-text-bottom" />
                    )}
                  </p>
                </div>
              )}

              {summarize.error && (
                <p className="mt-4 text-sm text-destructive">{summarize.error}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deal Insights Tab */}
        <TabsContent value="insights" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-4">
                Enter a deal ID to generate AI-powered insights and
                recommendations.
              </p>

              <div className="flex gap-3">
                <div className="relative flex-1">
                  <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={dealId}
                    onChange={(e) => setDealId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateInsights()}
                    placeholder="Enter deal ID..."
                    className="pl-9"
                  />
                </div>
                <Button
                  onClick={handleGenerateInsights}
                  disabled={dealInsights.isStreaming || !dealId.trim() || isNaN(parseInt(dealId, 10)) || parseInt(dealId, 10) <= 0}
                  className="bg-sr-primary hover:bg-sr-primary-dark"
                >
                  {dealInsights.isStreaming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Generate Insights'
                  )}
                </Button>
              </div>

              {(dealInsights.text || dealInsights.isStreaming) && (
                <div className="mt-6 rounded-lg bg-muted/50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-sr-primary" />
                    <h4 className="text-sm font-semibold">Insights</h4>
                    {dealInsights.isStreaming && (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">
                    {dealInsights.text}
                    {dealInsights.isStreaming && (
                      <span className="inline-block w-1.5 h-4 bg-sr-primary animate-pulse ml-0.5 align-text-bottom" />
                    )}
                  </p>
                </div>
              )}

              {dealInsights.error && (
                <p className="mt-4 text-sm text-destructive">{dealInsights.error}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
