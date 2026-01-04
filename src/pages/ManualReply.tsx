import React, { useEffect, useState, useRef, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePages, useManualProcessReplies } from '@/hooks/useApi';
import { activityApi } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Play, Square, RefreshCw, MessageCircle, CheckCircle2, Clock } from 'lucide-react';

export default function ManualReply() {
  const { data: pages, isLoading: pagesLoading } = usePages();
  const manual = useManualProcessReplies();

  const [selectedPageId, setSelectedPageId] = useState<string | undefined>(undefined);
  const [postId, setPostId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [type, setType] = useState<'post' | 'reel'>('post');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState({ comments: 0, replied: 0, pending: 0 });
  const [currentTargetPostId, setCurrentTargetPostId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const pollRef = useRef<number | null>(null);
  const selectedPageIdRef = useRef(selectedPageId);
  const currentTargetPostIdRef = useRef(currentTargetPostId);
  const postIdRef = useRef(postId);

  // Keep refs in sync
  useEffect(() => {
    selectedPageIdRef.current = selectedPageId;
  }, [selectedPageId]);

  useEffect(() => {
    currentTargetPostIdRef.current = currentTargetPostId;
  }, [currentTargetPostId]);

  useEffect(() => {
    postIdRef.current = postId;
  }, [postId]);

  useEffect(() => {
    if (!selectedPageId && pages && pages.length > 0) {
      setSelectedPageId(pages[0].pageId);
    }
  }, [pages, selectedPageId]);

  const fetchActivity = useCallback(async () => {
    try {
      const activity = await activityApi.getRecent(200, undefined, selectedPageIdRef.current);
      const target = currentTargetPostIdRef.current || postIdRef.current || null;
      const filtered = target 
        ? activity.filter((a: any) => 
            a.postId === target || 
            a.postId === `${selectedPageIdRef.current}_${target}`
          ) 
        : activity;
      
      const commentsCount = filtered.length;
      const repliedCount = filtered.filter((a: any) => a.status === 'replied').length;
      const pendingCount = filtered.filter((a: any) => a.status === 'pending').length;
      
      setResults({ comments: commentsCount, replied: repliedCount, pending: pendingCount });
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Polling error', err);
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    fetchActivity(); // Immediate fetch
    pollRef.current = window.setInterval(fetchActivity, 2000);
  }, [fetchActivity]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!running) stopPolling();
    return () => stopPolling();
  }, [running, stopPolling]);

  const handleScanLast100 = async () => {
    if (!selectedPageId) {
      toast.error('Select a page first');
      return;
    }
    setRunning(true);
    setCurrentTargetPostId(null);
    setResults({ comments: 0, replied: 0, pending: 0 });
    
    try {
      startPolling();
      const result = await manual.mutateAsync({ 
        pageId: selectedPageId, 
        limit: 100, 
        shadowMode: false, 
        contentType: 'post', 
        accessToken: accessToken || undefined 
      });
      
      // Update results from API response
      if (result?.results) {
        setResults({
          comments: result.results.totalCommentsFound || result.results.processed || 0,
          replied: result.results.replied || 0,
          pending: (result.results.totalCommentsFound || result.results.processed || 0) - (result.results.replied || 0) - (result.results.skipped || 0)
        });
      }
      
      toast.success(`Scan completed: ${result?.results?.totalCommentsFound || result?.processed || 0} comments found, ${result?.results?.replied || 0} replied`);
    } catch (err: any) {
      toast.error(err?.message || 'Scan failed');
      console.error('Scan error', err);
    } finally {
      setRunning(false);
    }
  };

  const handleSingle = async () => {
    if (!selectedPageId) {
      toast.error('Select a page first');
      return;
    }
    if (!postId) {
      toast.error('Enter a Post/Reel ID');
      return;
    }
    
    setRunning(true);
    setCurrentTargetPostId(postId);
    setResults({ comments: 0, replied: 0, pending: 0 });
    
    try {
      startPolling();
      const result = await manual.mutateAsync({ 
        pageId: selectedPageId, 
        postId, 
        limit: 1, 
        shadowMode: false, 
        contentType: type, 
        accessToken: accessToken || undefined 
      });
      
      // Update results from API response
      if (result?.results) {
        setResults({
          comments: result.results.totalCommentsFound || result.results.processed || 0,
          replied: result.results.replied || 0,
          pending: (result.results.totalCommentsFound || result.results.processed || 0) - (result.results.replied || 0) - (result.results.skipped || 0)
        });
      }
      
      toast.success(`Reply completed: ${result?.results?.totalCommentsFound || 0} comments found, ${result?.results?.replied || 0} replied`);
    } catch (err: any) {
      toast.error(err?.message || 'Reply failed');
      console.error('Single reply error', err);
    } finally {
      setRunning(false);
    }
  };

  const handleStop = () => {
    stopPolling();
    setRunning(false);
    toast.warning('Stop requested — server-side cancellation is not supported');
  };

  const selectedPage = pages?.find(p => p.pageId === selectedPageId);

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Manual Reply</h1>
          <p className="text-muted-foreground">Scan recent contents or reply to a single post/reel.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Page</Label>
                <select
                  className="w-full mt-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedPageId || ''}
                  onChange={(e) => setSelectedPageId(e.target.value)}
                  disabled={pagesLoading}
                >
                  <option value="">Select a page</option>
                  {pages?.map((p) => (
                    <option key={p.pageId} value={p.pageId}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Type</Label>
                <div className="flex gap-2 mt-1.5">
                  <Button 
                    size="sm"
                    variant={type === 'post' ? 'default' : 'outline'} 
                    onClick={() => setType('post')}
                  >
                    Post
                  </Button>
                  <Button 
                    size="sm"
                    variant={type === 'reel' ? 'default' : 'outline'} 
                    onClick={() => setType('reel')}
                  >
                    Reel
                  </Button>
                </div>
              </div>
              <div>
                <Label>Post / Reel ID (optional)</Label>
                <Input 
                  className="mt-1.5"
                  placeholder="Enter ID for single reply" 
                  value={postId} 
                  onChange={(e) => setPostId(e.target.value)} 
                />
              </div>
            </div>

            <div>
              <Label>Access Token (optional)</Label>
              <Input 
                className="mt-1.5"
                type="password"
                placeholder="Paste access token for debugging" 
                value={accessToken} 
                onChange={(e) => setAccessToken(e.target.value)} 
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button 
                onClick={handleScanLast100} 
                disabled={running || !selectedPageId}
              >
                {running && !currentTargetPostId ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Scan Last 100
              </Button>
              <Button 
                onClick={handleSingle} 
                disabled={running || !postId || !selectedPageId}
              >
                {running && currentTargetPostId ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Reply to ID
              </Button>
              <Button 
                variant="outline" 
                onClick={handleStop}
                disabled={!running}
              >
                <Square className="mr-2 h-4 w-4" />
                Stop
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Comments Found</span>
              </div>
              <p className="text-3xl font-bold mt-2">{results.comments}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm text-muted-foreground">Replied</span>
              </div>
              <p className="text-3xl font-bold mt-2 text-green-600">{results.replied}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Pending</span>
              </div>
              <p className="text-3xl font-bold mt-2 text-yellow-600">{results.pending}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status</span>
              </div>
              <div className="mt-2">
                <Badge variant={running ? 'default' : 'secondary'}>
                  {running ? 'Running' : 'Idle'}
                </Badge>
                {lastUpdated && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {(currentTargetPostId || selectedPage) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Target</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Page:</strong> {selectedPage?.name || 'Not selected'}
                </p>
                <p>
                  <strong>Target:</strong>{' '}
                  {currentTargetPostId ? (
                    <a 
                      className="text-primary underline" 
                      href={`https://www.facebook.com/${currentTargetPostId}`} 
                      target="_blank" 
                      rel="noreferrer"
                    >
                      {currentTargetPostId}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Multiple posts (bulk scan)</span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
