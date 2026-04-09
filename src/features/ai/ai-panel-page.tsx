import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Search,
  Brain,
  User,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@shared/components/page-header';
import { ActivityIcon } from '@shared/components/activity-icon';
import { useSummarize, useSmartSearch } from '@core/hooks/use-ai';
import type { SmartSearchResponse } from '@core/models/ai';

export default function AiPanelPage() {
  // Smart Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SmartSearchResponse | null>(
    null,
  );
  const smartSearch = useSmartSearch();

  // Summarize state
  const [summarizeText, setSummarizeText] = useState('');
  const [summaryResult, setSummaryResult] = useState<string | null>(null);
  const summarize = useSummarize();

  function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearchResult(null);
    smartSearch.mutate(
      { query: searchQuery },
      { onSuccess: (result) => setSearchResult(result) },
    );
  }

  function handleSummarize() {
    if (!summarizeText.trim()) return;
    setSummaryResult(null);
    summarize.mutate(
      { text: summarizeText },
      { onSuccess: (result) => setSummaryResult(result.summary) },
    );
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
                  disabled={smartSearch.isPending || !searchQuery.trim()}
                  className="bg-sr-primary hover:bg-sr-primary-dark"
                >
                  {smartSearch.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Search'
                  )}
                </Button>
              </div>

              {searchResult && (
                <div className="mt-6 space-y-4">
                  {searchResult.interpretation && (
                    <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                      <Brain className="h-5 w-5 text-sr-primary shrink-0 mt-0.5" />
                      <p className="text-sm">{searchResult.interpretation}</p>
                    </div>
                  )}

                  {searchResult.contacts.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">
                        Contacts ({searchResult.contacts.length})
                      </h4>
                      <div className="space-y-1">
                        {searchResult.contacts.map((c) => (
                          <Link
                            key={c.id}
                            to={`/contacts/${c.id}`}
                            className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-muted/50 transition-colors"
                          >
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {c.firstName} {c.lastName}
                            </span>
                            {c.companyName && (
                              <span className="text-xs text-muted-foreground">
                                {c.companyName}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResult.activities.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">
                        Activities ({searchResult.activities.length})
                      </h4>
                      <div className="space-y-1">
                        {searchResult.activities.map((a) => (
                          <div
                            key={a.id}
                            className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-muted/50 transition-colors"
                          >
                            <ActivityIcon type={a.type} />
                            <span className="text-sm font-medium">
                              {a.subject}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {a.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResult.contacts.length === 0 &&
                    searchResult.activities.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No results found. Try rephrasing your question.
                      </p>
                    )}
                </div>
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
                disabled={summarize.isPending || !summarizeText.trim()}
                className="bg-sr-primary hover:bg-sr-primary-dark"
              >
                {summarize.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Summarize
              </Button>

              {summaryResult && (
                <div className="mt-6 rounded-lg bg-muted/50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-sr-gold" />
                    <h4 className="text-sm font-semibold">Summary</h4>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">
                    {summaryResult}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
