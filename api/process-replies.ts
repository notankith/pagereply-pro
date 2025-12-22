import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMongoClient, ObjectId } from './lib/mongodb';
import { handleCors, jsonResponse, errorResponse } from './lib/cors';

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
    errors: [] as string[],
  };

  try {
    const body = req.body || {};
    const shadowMode = body.shadowMode || false;
    const manualRun = body.manual || false;

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

    // Get active pages
    const pages = await pagesCollection.find({ status: 'active', autoReply: true }).toArray();
    console.log(`Found ${pages.length} active pages with auto-reply enabled`);

    let totalReplies = 0;

    for (const page of pages) {
      if (totalReplies >= maxRepliesPerRun) {
        console.log(`Reached max replies limit (${maxRepliesPerRun}), stopping`);
        break;
      }

      console.log(`Processing page: ${page.name} (${page.pageId})`);

      // Get pending comments
      const pendingComments = await commentsCollection
        .find({
          pageId: page.pageId,
          status: 'pending',
          createdTime: { $gte: new Date(page.activatedAt || 0) },
        })
        .toArray();

      console.log(`Found ${pendingComments.length} pending comments for ${page.name}`);

      // Track replied users per post
      const repliedUsers = new Map<string, Set<string>>();

      for (const comment of pendingComments) {
        if (totalReplies >= maxRepliesPerRun) break;

        results.processed++;

        try {
          // Skip if already replied to user on this post
          const postKey = comment.postId as string;
          if (!repliedUsers.has(postKey)) {
            repliedUsers.set(postKey, new Set());
          }

          if (repliedUsers.get(postKey)!.has(comment.fromId as string)) {
            await commentsCollection.updateOne(
              { _id: comment._id },
              { $set: { status: 'skipped', skipReason: 'Already replied to user on this post' } }
            );
            results.skipped++;
            continue;
          }

          // Determine reply type
          const isShort = isShortComment(
            comment.message as string,
            (settings.shortCommentThresholdWords as number) || 6,
            (settings.shortCommentThresholdChars as number) || 40
          );

          let replyMessage: string;
          let replyType: string;

          if (isShort) {
            replyMessage = getEmojiReply();
            replyType = 'emoji';
          } else {
            replyMessage = await generateAIReply(comment.message as string, settings);
            replyType = 'ai';
          }

          console.log(`Generated ${replyType} reply for ${comment.commentId}: ${replyMessage.substring(0, 50)}...`);

          let replyCommentId = null;

          if (!shadowMode) {
            replyCommentId = await postReply(page.accessToken as string, comment.commentId as string, replyMessage);
            console.log(`Posted reply ${replyCommentId}`);
          } else {
            console.log('[SHADOW MODE] Would have posted reply');
          }

          // Update comment status
          await commentsCollection.updateOne(
            { _id: comment._id },
            {
              $set: {
                status: 'replied',
                replyType,
                replyMessage,
                replyCommentId,
                repliedAt: new Date(),
                shadowMode,
              },
            }
          );

          repliedUsers.get(postKey)!.add(comment.fromId as string);
          totalReplies++;
          results.replied++;

          // Random delay between replies
          await randomDelay(minDelay, maxDelay);
        } catch (error) {
          console.error(`Error processing comment ${comment.commentId}:`, error);
          const errMessage = error instanceof Error ? error.message : 'Unknown error';
          results.failed++;
          results.errors.push(`${comment.commentId}: ${errMessage}`);

          await commentsCollection.updateOne(
            { _id: comment._id },
            { $set: { status: 'failed', skipReason: errMessage } }
          );

          // Auto-pause on excessive errors
          if (results.failed >= ((settings.errorThreshold as number) || 5)) {
            console.log('Error threshold reached, auto-pausing page');
            await pagesCollection.updateOne(
              { _id: page._id },
              { $set: { status: 'paused', pauseReason: 'Auto-paused due to errors' } }
            );
            break;
          }
        }
      }
    }

    // Log the run
    await runsCollection.insertOne({
      timestamp: new Date(),
      shadowMode,
      manualRun,
      results,
    });

    console.log('Job completed:', results);
    return jsonResponse(res, { success: true, results });
  } catch (error) {
    console.error('Process replies error:', error);
    return errorResponse(res, error instanceof Error ? error.message : 'Unknown error');
  }
}
