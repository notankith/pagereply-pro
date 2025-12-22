import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { MongoClient, ObjectId } from "https://deno.land/x/mongo@v0.32.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// MongoDB connection
async function getMongoClient() {
  const uri = Deno.env.get('MONGODB_URI');
  if (!uri) throw new Error('MONGODB_URI not configured');
  
  const client = new MongoClient();
  await client.connect(uri);
  return client;
}

// Verify Facebook webhook challenge
function handleVerification(url: URL): Response {
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  
  // You should set this verify token in your Facebook App settings
  const VERIFY_TOKEN = Deno.env.get('FB_VERIFY_TOKEN') || 'replybot_verify_token';
  
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verified successfully');
    return new Response(challenge, { status: 200 });
  }
  
  console.error('Webhook verification failed');
  return new Response('Forbidden', { status: 403 });
}

serve(async (req) => {
  const url = new URL(req.url);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Handle Facebook webhook verification (GET request)
  if (req.method === 'GET') {
    return handleVerification(url);
  }
  
  // Handle incoming webhook events (POST request)
  if (req.method === 'POST') {
    let client;
    
    try {
      const body = await req.json();
      console.log('Received webhook:', JSON.stringify(body, null, 2));
      
      // Verify this is a page event
      if (body.object !== 'page') {
        return new Response('Not a page event', { status: 400 });
      }
      
      client = await getMongoClient();
      const db = client.database('replybot');
      const commentsCollection = db.collection('comments');
      const pagesCollection = db.collection('pages');
      
      // Process each entry
      for (const entry of body.entry || []) {
        const pageId = entry.id;
        
        // Check if this page is registered and active
        const page = await pagesCollection.findOne({ pageId, status: 'active' });
        if (!page) {
          console.log(`Page ${pageId} not registered or inactive, skipping`);
          continue;
        }
        
        // Process messaging/changes
        for (const change of entry.changes || []) {
          if (change.field === 'feed' && change.value.item === 'comment') {
            const value = change.value;
            
            // Skip if it's from the page itself (self-comment)
            if (value.from.id === pageId) {
              console.log('Skipping self-comment from page');
              continue;
            }
            
            // Check if comment already exists
            const existingComment = await commentsCollection.findOne({ 
              commentId: value.comment_id 
            });
            
            if (existingComment) {
              console.log(`Comment ${value.comment_id} already exists, skipping`);
              continue;
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
              status: 'pending', // pending, replied, skipped, failed
              replyType: null, // emoji, ai
              replyCommentId: null,
              repliedAt: null,
              skipReason: null,
            };
            
            await commentsCollection.insertOne(comment);
            console.log(`Stored comment ${value.comment_id} from ${value.from.name}`);
          }
        }
      }
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
      
    } catch (error: unknown) {
      console.error('Webhook processing error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } finally {
      if (client) {
        client.close();
      }
    }
  }
  
  return new Response('Method not allowed', { status: 405 });
});
