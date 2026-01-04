import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMongoClient, ObjectId } from './lib/mongodb.js';
import { handleCors, jsonResponse, errorResponse } from './lib/cors.js';

const GRAPH = process.env.FB_GRAPH_URL || 'https://graph.facebook.com/v24.0';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

function isShortComment(message: string, thresholdWords = 6, thresholdChars = 40): boolean {
  const wordCount = message.trim().split(/\s+/).length;
  const charCount = message.length;
  return wordCount <= thresholdWords || charCount < thresholdChars;
}

function getEmojiReply(): string {
  const emojis = ['❤️', '🙌', '👏', '🔥', '💯', '✨', '👍', '😊', '🎉', '💪'];
  return emojis[Math.floor(Math.random() * emojis.length)];
}

async function generateAIReply(comment: string, settings: Record<string, unknown>): Promise<string> {
  const systemPrompt = (settings?.aiTone as string) ||
    "You are a friendly and helpful social media manager. Respond to comments in a warm, professional manner. Keep responses concise but engaging. Never be defensive or argumentative. Keep your response under 100 words.";

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Reply to this Facebook comment: "${comment}"` },
      ],
      max_tokens: 150,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('OpenAI API error:', error);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

async function postReply(pageAccessToken: string, commentId: string, message: string): Promise<string> {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${commentId}/comments`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        access_token: pageAccessToken,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Facebook API error:', error);
    throw new Error(`Facebook API error: ${response.status}`);
  }

  const data = await response.json();
  return data.id;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomDelay(minSeconds: number, maxSeconds: number): Promise<void> {
  const ms = Math.floor(Math.random() * (maxSeconds - minSeconds + 1) + minSeconds) * 1000;
  return delay(ms);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return errorResponse(res, 'Method not allowed', 405);
  }

  const results = {
    processed: 0,
    replied: 0,
    skipped: 0,
    failed: 0,
    totalCommentsFound: 0,
    errors: [] as string[],
  };
  const rawResponses: Array<{ endpoint: string; status?: number; body: unknown }> = [];

  try {
    const body = req.body || {};
    const shadowMode = body.shadowMode || false;
    const manualRun = body.manual || false;
    const targetPageId = body.pageId || null; // optional: restrict to a specific page
    const targetPostId = body.postId || null; // optional: restrict to a single post/reel
    const scanLimit = Number(body.limit || 100);

    console.log(`Starting reply job - Shadow: ${shadowMode}, Manual: ${manualRun}`);

    const client = await getMongoClient();
    const db = client.db('replybot');
    const pagesCollection = db.collection('pages');
    const commentsCollection = db.collection('comments');
    const settingsCollection = db.collection('settings');
    const runsCollection = db.collection('runs');

    // Get global settings
    const settings = (await settingsCollection.findOne({ type: 'global' })) || {};
    const maxRepliesPerRun = (settings.maxRepliesPerRun as number) || 100;
    const minDelay = (settings.minDelay as number) || 5;
    const maxDelay = (settings.maxDelay as number) || 20;

    // Check global pause
    if (settings.globalPause && !manualRun) {
      console.log('Global pause is active, skipping run');
      return jsonResponse(res, { success: true, message: 'Skipped due to global pause', results });
    }

    // Determine which pages to process
    let pages = [] as any[];
    if (targetPageId) {
      const p = await pagesCollection.findOne({ pageId: targetPageId });
      if (p) pages = [p];
    } else {
      pages = await pagesCollection.find({ status: 'active', autoReply: true }).toArray();
    }

    // Support overriding the page access token via the request body for manual debugging/testing
    const overrideToken = (body.accessToken as string) || null;
    console.log(`Found ${pages.length} pages to process`);

    let totalReplies = 0;

    const EMOJIS = ['🔥', '😂', '💀', '😮‍💨', '👀', '💯', '😎', '🙌', '🤝'];

    async function getLastPostsAndReels(pageId: string, accessToken: string, limit = 100, contentType = 'post') {
      // Prefer the requested contentType when possible. Reels endpoint availability may vary,
      // so we try the reels endpoint first for 'reel', then fall back to posts.
      const endpoints = [] as string[];
      if (contentType === 'reel') {
        endpoints.push(`${GRAPH}/${pageId}/reels?limit=${limit}&fields=id&access_token=${encodeURIComponent(accessToken || '')}`);
      }
      // Always include posts as a fallback
      endpoints.push(`${GRAPH}/${pageId}/posts?limit=${limit}&fields=id&access_token=${encodeURIComponent(accessToken || '')}`);

      for (const url of endpoints) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          const data = await res.json();
          const ids = (data.data || []).map((p: any) => p.id).filter(Boolean);
          if (ids.length > 0) return ids;
        } catch (err) {
          // try next endpoint
        }
      }
      return [];
    }

    async function getComments(postId: string, accessToken: string) {
      // Fetch ALL comments using pagination
      const allComments: any[] = [];
      let url = `${GRAPH}/${postId}/comments?filter=stream&fields=id,message,from,comments.limit(10){from}&limit=100&access_token=${encodeURIComponent(
        accessToken || ''
      )}`;
      
      while (url) {
        const res = await fetch(url);
        const text = await res.text().catch(() => '');
        if (!res.ok) {
          let body: unknown = text;
          try { body = JSON.parse(text); } catch {};
          rawResponses.push({ endpoint: url, status: res.status, body });
          results.errors.push(`getComments ${postId}: ${res.status}`);
          console.error('getComments failed', postId, res.status, text);
          break;
        }
        const data = JSON.parse(text || '{}');
        if (!data || !data.data) {
          rawResponses.push({ endpoint: url, status: res.status, body: data });
          break;
        }
        allComments.push(...(data.data || []));
        
        // Check for next page
        url = data.paging?.next || '';
      }
      
      console.log(`Fetched ${allComments.length} total comments for post ${postId}`);
      return allComments;
    }

    async function alreadyReplied(commentId: string, pageId: string, accessToken: string) {
      const url = `${GRAPH}/${commentId}/comments?fields=from&access_token=${encodeURIComponent(accessToken)}`;
      const res = await fetch(url);
      const text = await res.text().catch(() => '');
      if (!res.ok) {
        let body: unknown = text;
        try { body = JSON.parse(text); } catch {}
        rawResponses.push({ endpoint: url, status: res.status, body });
        results.errors.push(`alreadyReplied ${commentId}: ${res.status}`);
        console.error('alreadyReplied failed', commentId, res.status, text);
        return false;
      }
      let data: any = {};
      try { data = JSON.parse(text || '{}'); } catch (e) { data = {}; }
      for (const r of (data.data || [])) {
        if (r.from && r.from.id === pageId) return true;
      }
      return false;
    }

    async function postReply(accessToken: string, commentId: string, message: string) {
      const url = `${GRAPH}/${commentId}/comments`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, access_token: accessToken }),
      });
      const text = await res.text().catch(() => '');
      let parsed: unknown = text;
      try { parsed = JSON.parse(text || '{}'); } catch {}
      if (!res.ok) {
        rawResponses.push({ endpoint: url, status: res.status, body: parsed });
        console.error('postReply failed', commentId, res.status, text);
        throw new Error(`Facebook API error: ${res.status} ${text}`);
      }
      rawResponses.push({ endpoint: url, status: res.status, body: parsed });
      return (parsed as any).id;
    }

    for (const page of pages) {
      if (totalReplies >= maxRepliesPerRun) {
        console.log(`Reached max replies limit (${maxRepliesPerRun}), stopping`);
        break;
      }

      // If an override token was provided, use it for this run (helpful for local debugging)
      if (overrideToken) {
        page.accessToken = overrideToken;
      }

      // Diagnostic: record whether token exists and its length (do not log full token)
      rawResponses.push({ endpoint: 'page_token_check', body: { pageId: page.pageId, hasToken: Boolean(page.accessToken), tokenLength: page.accessToken ? (page.accessToken as string).length : 0 } });

      console.log(`Processing page: ${page.name} (${page.pageId}) natively in Node`);

      if (!page.accessToken) {
        console.error(`No access token available for page ${page.pageId}; skipping page`);
        results.errors.push(`page:${page.pageId}: missing access token`);
        continue;
      }

      try {
        let pendingPosts: string[] = [];
        if (targetPostId) {
          // Resolve possible post/reel id formats. The user may input a short id (e.g. 759435313843656)
          // or a full id like {pageId}_{postId}. Try common variants until we find comments.
          const candidates = [targetPostId];
          if (!targetPostId.includes('_')) {
            candidates.push(`${page.pageId}_${targetPostId}`);
          }

          // If contentType provided (post|reel), we still attempt same endpoints; backend will try candidates.
          for (const candidate of candidates) {
            try {
              const testComments = await getComments(candidate, page.accessToken as string);
              if (testComments && testComments.length > 0) {
                pendingPosts = [candidate];
                break;
              }
            } catch (err) {
              // ignore and try next candidate
            }
          }

          // If none found, fallback to raw targetPostId
          if (pendingPosts.length === 0) pendingPosts = [targetPostId];
        } else {
          const contentType = (body.contentType as string) || 'post';
          pendingPosts = await getLastPostsAndReels(page.pageId as string, page.accessToken as string, scanLimit, contentType);
        }
        console.log(`Found ${pendingPosts.length} posts/reels for page ${page.name}`);

        for (const postId of pendingPosts) {
          if (totalReplies >= maxRepliesPerRun) break;

          // Always pass the page access token when fetching comments
          const comments = await getComments(postId as string, page.accessToken as string);
          
          // Track total comments found before processing
          results.totalCommentsFound += comments.length;
          console.log(`Post ${postId}: Found ${comments.length} comments (Total so far: ${results.totalCommentsFound})`);

          for (const c of comments) {
            if (totalReplies >= maxRepliesPerRun) break;
            results.processed++;

            const cid = c.id as string;
            const fromId = c.from?.id as string | undefined;
            const commentPostId = (c as any).post_id || postId as string;

            try {
              // First, check nested replies returned with the comment to avoid an extra API call
              let didReply = false;
              try {
                const nested = (c as any).comments?.data || [];
                if (nested.some((r: any) => r.from && r.from.id === page.pageId)) {
                  didReply = true;
                }
              } catch (e) {
                // ignore and fallback to API check
              }

              if (!didReply) {
                didReply = await alreadyReplied(cid, page.pageId as string, page.accessToken as string);
              }

              if (didReply) {
                results.skipped++;
                await commentsCollection.updateOne(
                  { commentId: cid },
                  { $set: { status: 'skipped', skipReason: 'Already replied', postId: commentPostId, pageId: page.pageId } },
                  { upsert: true }
                );
                continue;
              }

              const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
              let replyCommentId: string | null = null;

              if (!shadowMode) {
                replyCommentId = await postReply(page.accessToken as string, cid, emoji);
                console.log(`Posted reply ${replyCommentId} to comment ${cid}`);
              } else {
                console.log('[SHADOW MODE] Would post reply to', cid);
              }

              await commentsCollection.updateOne(
                { commentId: cid },
                { $set: { status: 'replied', replyType: 'emoji', replyMessage: emoji, replyCommentId, repliedAt: new Date(), shadowMode, postId: commentPostId, pageId: page.pageId, fromId } },
                { upsert: true }
              );

              results.replied++;
              totalReplies++;

              await randomDelay(minDelay, maxDelay);
            } catch (err) {
              console.error('Error replying to comment', cid, err);
              results.failed++;
              results.errors.push(`${cid}: ${err instanceof Error ? err.message : String(err)}`);
            }
          }
        }
      } catch (err) {
        console.error('Error processing page', page.pageId, err);
        results.failed++;
        results.errors.push(`page:${page.pageId}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // Log the run
    await runsCollection.insertOne({
      timestamp: new Date(),
      shadowMode,
      manualRun,
      results,
      rawResponses,
    });

    console.log('Job completed:', results, { rawResponsesCount: rawResponses.length });
    return jsonResponse(res, { success: true, results, rawResponses });
  } catch (error) {
    console.error('Process replies error:', error);
    return errorResponse(res, error instanceof Error ? error.message : 'Unknown error');
  }
}
