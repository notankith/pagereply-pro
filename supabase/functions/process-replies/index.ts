import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { MongoClient } from "https://deno.land/x/mongo@v0.32.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

// MongoDB connection
async function getMongoClient() {
  const uri = Deno.env.get('MONGODB_URI');
  if (!uri) throw new Error('MONGODB_URI not configured');
  
  const client = new MongoClient();
  await client.connect(uri);
  return client;
}

// Classify comment as short or deep
function isShortComment(message: string, thresholdWords = 6, thresholdChars = 40): boolean {
  const wordCount = message.trim().split(/\s+/).length;
  const charCount = message.length;
  return wordCount <= thresholdWords || charCount < thresholdChars;
}

// Get random emoji reply
function getEmojiReply(): string {
  const emojis = ['❤️', '🙌', '👏', '🔥', '💯', '✨', '👍', '😊', '🎉', '💪'];
  return emojis[Math.floor(Math.random() * emojis.length)];
}

// Generate AI reply using OpenAI
async function generateAIReply(comment: string, settings: any): Promise<string> {
  const systemPrompt = settings?.aiTone || 
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
        { role: 'user', content: `Reply to this Facebook comment: "${comment}"` }
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

// Post reply to Facebook
async function postReply(pageAccessToken: string, commentId: string, message: string): Promise<string> {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${commentId}/comments`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
  return data.id; // Return the reply comment ID
}

// Random delay between min and max seconds
function randomDelay(minSeconds: number, maxSeconds: number): Promise<void> {
  const delay = Math.floor(Math.random() * (maxSeconds - minSeconds + 1) + minSeconds) * 1000;
  return new Promise(resolve => setTimeout(resolve, delay));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  let client;
  const results = {
    processed: 0,
    replied: 0,
    skipped: 0,
    failed: 0,
    errors: [] as string[],
  };
  
  try {
    const body = await req.json().catch(() => ({}));
    const shadowMode = body.shadowMode || false;
    const manualRun = body.manual || false;
    
    console.log(`Starting reply cron job - Shadow mode: ${shadowMode}, Manual: ${manualRun}`);
    
    client = await getMongoClient();
    const db = client.database('replybot');
    const pagesCollection = db.collection('pages');
    const commentsCollection = db.collection('comments');
    const settingsCollection = db.collection('settings');
    
    // Get global settings
    const settings = await settingsCollection.findOne({ type: 'global' }) || {};
    const maxRepliesPerRun = settings.maxRepliesPerRun || 100;
    const minDelay = settings.minDelay || 5;
    const maxDelay = settings.maxDelay || 20;
    
    // Check global pause
    if (settings.globalPause && !manualRun) {
      console.log('Global pause is active, skipping run');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Skipped due to global pause',
        results 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Get all active pages
    const pages = await pagesCollection.find({ status: 'active', autoReply: true }).toArray();
    console.log(`Found ${pages.length} active pages with auto-reply enabled`);
    
    let totalReplies = 0;
    
    for (const page of pages) {
      if (totalReplies >= maxRepliesPerRun) {
        console.log(`Reached max replies limit (${maxRepliesPerRun}), stopping`);
        break;
      }
      
      console.log(`Processing page: ${page.name} (${page.pageId})`);
      
      // Get pending comments for this page
      const pendingComments = await commentsCollection.find({
        pageId: page.pageId,
        status: 'pending',
        createdTime: { $gte: new Date(page.activatedAt || 0) }, // Only comments after activation
      }).toArray();
      
      console.log(`Found ${pendingComments.length} pending comments for ${page.name}`);
      
      // Track users we've replied to per post (one reply per user per post)
      const repliedUsers = new Map<string, Set<string>>();
      
      for (const comment of pendingComments) {
        if (totalReplies >= maxRepliesPerRun) break;
        
        results.processed++;
        
        try {
          // Skip if already replied to this user on this post
          const postUserKey = `${comment.postId}`;
          if (!repliedUsers.has(postUserKey)) {
            repliedUsers.set(postUserKey, new Set());
          }
          
          if (repliedUsers.get(postUserKey)!.has(comment.fromId)) {
            await commentsCollection.updateOne(
              { _id: comment._id },
              { $set: { status: 'skipped', skipReason: 'Already replied to user on this post' } }
            );
            results.skipped++;
            continue;
          }
          
          // Determine reply type
          const isShort = isShortComment(comment.message, 
            settings.shortCommentThresholdWords || 6,
            settings.shortCommentThresholdChars || 40
          );
          
          let replyMessage: string;
          let replyType: string;
          
          if (isShort) {
            replyMessage = getEmojiReply();
            replyType = 'emoji';
          } else {
            replyMessage = await generateAIReply(comment.message, settings);
            replyType = 'ai';
          }
          
          console.log(`Generated ${replyType} reply for comment ${comment.commentId}: ${replyMessage.substring(0, 50)}...`);
          
          let replyCommentId = null;
          
          if (!shadowMode) {
            // Post the reply to Facebook
            replyCommentId = await postReply(page.accessToken, comment.commentId, replyMessage);
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
              } 
            }
          );
          
          repliedUsers.get(postUserKey)!.add(comment.fromId);
          totalReplies++;
          results.replied++;
          
          // Random delay between replies
          await randomDelay(minDelay, maxDelay);
          
        } catch (error: unknown) {
          console.error(`Error processing comment ${comment.commentId}:`, error);
          const errMessage = error instanceof Error ? error.message : 'Unknown error';
          results.failed++;
          results.errors.push(`${comment.commentId}: ${errMessage}`);
          
          await commentsCollection.updateOne(
            { _id: comment._id },
            { $set: { status: 'failed', skipReason: errMessage } }
          );
          
          // Check if we should auto-pause due to errors
          if (results.failed >= (settings.errorThreshold || 5)) {
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
    const runsCollection = db.collection('runs');
    await runsCollection.insertOne({
      timestamp: new Date(),
      shadowMode,
      manualRun,
      results,
    });
    
    console.log('Cron job completed:', results);
    
    return new Response(JSON.stringify({ 
      success: true, 
      results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error: unknown) {
    console.error('Cron job error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: message,
      results 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } finally {
    if (client) {
      client.close();
    }
  }
});
