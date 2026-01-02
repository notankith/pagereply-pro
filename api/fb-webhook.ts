import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMongoClient } from './lib/mongodb.js';
import { handleCors, jsonResponse, errorResponse } from './lib/cors.js';

const GRAPH = process.env.FB_GRAPH_URL || 'https://graph.facebook.com/v24.0';

const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'replybot_verify_token';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET - Facebook webhook verification
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'] as string;
    const token = req.query['hub.verify_token'] as string;
    const challenge = req.query['hub.challenge'] as string;

    if (mode === 'subscribe' && token === FB_VERIFY_TOKEN) {
      console.log('Webhook verified successfully');
      return res.status(200).send(challenge);
    }

    console.error('Webhook verification failed');
    return res.status(403).send('Forbidden');
  }

  // POST - Incoming webhook events
  if (req.method === 'POST') {
    try {
      const body = req.body;
      console.log('Received webhook:', JSON.stringify(body, null, 2));

      if (body.object !== 'page') {
        return errorResponse(res, 'Not a page event', 400);
      }

      const client = await getMongoClient();
      const db = client.db('replybot');
      const commentsCollection = db.collection('comments');
      const pagesCollection = db.collection('pages');

      for (const entry of body.entry || []) {
        const pageId = entry.id;

        // Check if page is registered and active
        const page = await pagesCollection.findOne({ pageId, status: 'active' });
        if (!page) {
          console.log(`Page ${pageId} not registered or inactive, skipping`);
          continue;
        }

        for (const change of entry.changes || []) {
          if (change.field === 'feed' && change.value.item === 'comment') {
            const value = change.value;

            // Skip self-comments from the page
            if (value.from.id === pageId) {
              console.log('Skipping self-comment from page');
              continue;
            }

            // Check if comment already exists (idempotency)
            const existingComment = await commentsCollection.findOne({
              commentId: value.comment_id,
            });

            if (existingComment) {
              console.log(`Comment ${value.comment_id} already exists, skipping`);
              continue;
            }

            // Check whether the page has already replied to this comment via Graph API.
            // If so, store as skipped to avoid double-reply across manual/auto systems.
            try {
              const token = page.accessToken as string | undefined;
              if (token) {
                const url = `${GRAPH}/${value.comment_id}/comments?fields=from&access_token=${encodeURIComponent(token)}`;
                const resp = await fetch(url);
                if (resp.ok) {
                  const data = await resp.json().catch(() => ({}));
                  const replies = data.data || [];
                  const pageReplied = replies.some((r: any) => r.from && r.from.id === page.pageId);
                  if (pageReplied) {
                    const comment = {
                      commentId: value.comment_id,
                      postId: value.post_id,
                      pageId: pageId,
                      fromId: value.from.id,
                      fromName: value.from.name || 'Unknown',
                      message: value.message || '',
                      createdTime: new Date(value.created_time * 1000),
                      receivedAt: new Date(),
                      status: 'skipped',
                      replyType: null,
                      replyCommentId: null,
                      repliedAt: null,
                      skipReason: 'Already replied by page',
                    };
                    await commentsCollection.insertOne(comment);
                    console.log(`Stored comment ${value.comment_id} as skipped (page already replied)`);
                    continue;
                  }
                }
              }
            } catch (err) {
              console.error('Error checking existing replies for comment', value.comment_id, err);
              // fall through and store as pending so it can be processed later
            }

            // Store the comment
            const comment = {
              commentId: value.comment_id,
              postId: value.post_id,
              pageId: pageId,
              fromId: value.from.id,
              fromName: value.from.name || 'Unknown',
              message: value.message || '',
              createdTime: new Date(value.created_time * 1000),
              receivedAt: new Date(),
              status: 'pending',
              replyType: null,
              replyCommentId: null,
              repliedAt: null,
              skipReason: null,
            };

            await commentsCollection.insertOne(comment);
            console.log(`Stored comment ${value.comment_id} from ${value.from.name}`);
          }
        }
      }

      return jsonResponse(res, { success: true });
    } catch (error) {
      console.error('Webhook processing error:', error);
      return errorResponse(res, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  return errorResponse(res, 'Method not allowed', 405);
}
