import React, { useEffect, useState, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePages, useManualProcessReplies } from '@/hooks/useApi';
import { activityApi, runsApi } from '@/lib/api';
import { toast } from 'sonner';

export default function ManualReply() {
  const { data: pages } = usePages();
  const manual = useManualProcessReplies();

  const [selectedPageId, setSelectedPageId] = useState<string | undefined>(undefined);
  const [postId, setPostId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [type, setType] = useState<'post' | 'reel'>('post');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState({ comments: 0, replied: 0 });
  const [currentTargetPostId, setCurrentTargetPostId] = useState<string | null>(null);

  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    if (!selectedPageId && pages && pages.length > 0) {
      setSelectedPageId(pages[0].pageId);
    }
  }, [pages]);

  // minimal UI; avoid extra logs

  const startPolling = () => {
    if (pollRef.current) return;
    pollRef.current = window.setInterval(async () => {
      try {
        // Poll only the activity for the selected page and derive three values:
        // which post (currentTargetPostId), how many comments, and how many replies.
        const activity = await activityApi.getRecent(200, undefined, selectedPageId);
        // If a specific post is targeted, filter activity to that post
        const target = currentTargetPostId || (postId || null);
        const filtered = target ? activity.filter((a: any) => a.postId === target || a.postId === `${selectedPageId}_${target}`) : activity;
        const commentsCount = filtered.length;
        const repliedCount = filtered.filter((a: any) => a.status === 'replied').length;
        setResults({ comments: commentsCount, replied: repliedCount });
      } catch (err) {
        console.error('Polling error', err);
      }
    }, 2000);
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => {
    if (!running) stopPolling();
    return () => stopPolling();
  }, [running]);

  const handleScanLast100 = async () => {
    if (!selectedPageId) return toast.error('Select a page first');
    setRunning(true);
    // starting bulk scan
    // scanning multiple posts
    setCurrentTargetPostId(null);
    try {
      const promise = manual.mutateAsync({ pageId: selectedPageId, limit: 100, shadowMode: false, contentType: 'post', accessToken: accessToken || undefined });
      startPolling();
      await toast.promise(promise, {
        loading: 'Scanning last 100 contents...',
        success: 'Scan completed',
        error: 'Scan failed',
      });
      // finished
    } catch (err) {
      console.error('Scan error', err);
    } finally {
      setRunning(false);
    }
  };

  const handleSingle = async () => {
    if (!selectedPageId) return toast.error('Select a page first');
    if (!postId) return toast.error('Enter a Post/Reel ID');
    setRunning(true);
    setCurrentTargetPostId(postId);
    try {
        const promise = manual.mutateAsync({ pageId: selectedPageId, postId, limit: 1, shadowMode: false, contentType: type, accessToken: accessToken || undefined });
      startPolling();
      await toast.promise(promise, {
        loading: 'Replying...',
        success: 'Reply posted',
        error: 'Reply failed',
      });
      // finished
    } catch (err) {
      console.error('Single reply error', err);
    } finally {
      setRunning(false);
    }
  };

  const handleStop = () => {
    // best-effort: stop polling and mark as stopped. Server-side cancellation not implemented.
    stopPolling();
    setRunning(false);
    // stop requested
    toast('Stop requested — server-side cancellation is not supported', { type: 'warning' });
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-2">Manual Reply</h1>
        <p className="text-muted-foreground mb-4">Scan recent contents or reply to a single post/reel. This works independently from automated flows.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="col-span-1">
            <Label>Page</Label>
            <select
              className="w-full rounded border p-2"
              value={selectedPageId}
              onChange={(e) => setSelectedPageId(e.target.value)}
            >
              <option value="">Select a page</option>
              {pages?.map((p) => (
                <option key={p.pageId} value={p.pageId}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Type</Label>
            <div className="flex gap-2 mt-2">
              <Button variant={type === 'post' ? 'default' : 'outline'} onClick={() => setType('post')}>Post</Button>
              <Button variant={type === 'reel' ? 'default' : 'outline'} onClick={() => setType('reel')}>Reel</Button>
            </div>
          </div>
          <div>
            <Label>Post / Reel ID (optional)</Label>
            <Input placeholder="Enter ID for single reply" value={postId} onChange={(e) => setPostId(e.target.value)} />
          </div>
        </div>

        <div className="mb-4">
          <Label>Access Token (optional)</Label>
          <Input placeholder="Paste access token for debugging" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} />
        </div>

        <div className="flex items-center gap-3 mb-6">
          <Button onClick={handleScanLast100} disabled={running}>Scan Last 100 Contents</Button>
          <Button onClick={handleSingle} disabled={running || !postId}>Reply to ID</Button>
          <Button variant="ghost" onClick={handleStop}>Stop</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-secondary/10 rounded">
            <h4 className="text-sm font-medium">Live Polling</h4>
            <p>
              <strong>Post:</strong>{' '}
              {currentTargetPostId ? (
                <a className="text-primary underline" href={`https://www.facebook.com/${currentTargetPostId}`} target="_blank" rel="noreferrer">{currentTargetPostId}</a>
              ) : (
                <span>Multiple posts (scanning)</span>
              )}
            </p>
            <p><strong>Comments found:</strong> {results.comments}</p>
            <p><strong>Replied:</strong> {results.replied} of {results.comments}</p>
            <p>Status: {running ? 'Running' : 'Idle'}</p>
          </div>
          {/* Live Log removed for cleaner UI */}
        </div>
        {/* Server responses removed for concise display */}
      </div>
    </DashboardLayout>
  );
}
