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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const action = pathParts[pathParts.length - 1] || url.searchParams.get('action');
  
  let client;
  
  try {
    client = await getMongoClient();
    const db = client.database('replybot');
    
    // GET endpoints
    if (req.method === 'GET') {
      switch (action) {
        case 'pages': {
          const pagesCollection = db.collection('pages');
          const pages = await pagesCollection.find({}).toArray();
          return new Response(JSON.stringify(pages), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        case 'stats': {
          const commentsCollection = db.collection('comments');
          const pagesCollection = db.collection('pages');
          
          const pageId = url.searchParams.get('pageId');
          const filter = pageId ? { pageId } : {};
          
          const totalComments = await commentsCollection.countDocuments(filter);
          const totalReplies = await commentsCollection.countDocuments({ ...filter, status: 'replied' });
          const emojiReplies = await commentsCollection.countDocuments({ ...filter, replyType: 'emoji' });
          const aiReplies = await commentsCollection.countDocuments({ ...filter, replyType: 'ai' });
          const pending = await commentsCollection.countDocuments({ ...filter, status: 'pending' });
          const skipped = await commentsCollection.countDocuments({ ...filter, status: 'skipped' });
          const failed = await commentsCollection.countDocuments({ ...filter, status: 'failed' });
          const totalPages = await pagesCollection.countDocuments({});
          const activePages = await pagesCollection.countDocuments({ status: 'active' });
          
          return new Response(JSON.stringify({
            totalComments,
            totalReplies,
            emojiReplies,
            aiReplies,
            pending,
            skipped,
            failed,
            totalPages,
            activePages,
            replyRate: totalComments > 0 ? Math.round((totalReplies / totalComments) * 100) : 0,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        case 'activity': {
          const commentsCollection = db.collection('comments');
          const limit = parseInt(url.searchParams.get('limit') || '50');
          const status = url.searchParams.get('status');
          const pageId = url.searchParams.get('pageId');
          
          const filter: any = {};
          if (status && status !== 'all') filter.status = status;
          if (pageId) filter.pageId = pageId;
          
          const activities = await commentsCollection
            .find(filter)
            .sort({ receivedAt: -1 })
            .limit(limit)
            .toArray();
          
          return new Response(JSON.stringify(activities), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        case 'settings': {
          const settingsCollection = db.collection('settings');
          const settings = await settingsCollection.findOne({ type: 'global' });
          return new Response(JSON.stringify(settings || {}), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        case 'runs': {
          const runsCollection = db.collection('runs');
          const limit = parseInt(url.searchParams.get('limit') || '10');
          const runs = await runsCollection
            .find({})
            .sort({ timestamp: -1 })
            .limit(limit)
            .toArray();
          return new Response(JSON.stringify(runs), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        case 'chart-data': {
          const commentsCollection = db.collection('comments');
          const days = parseInt(url.searchParams.get('days') || '7');
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - days);
          
          // Aggregate by 6-hour windows
          const pipeline = [
            { $match: { status: 'replied', repliedAt: { $gte: startDate } } },
            {
              $group: {
                _id: {
                  date: { $dateToString: { format: '%Y-%m-%d', date: '$repliedAt' } },
                  window: { 
                    $multiply: [
                      { $floor: { $divide: [{ $hour: '$repliedAt' }, 6] } },
                      6
                    ]
                  }
                },
                emoji: { $sum: { $cond: [{ $eq: ['$replyType', 'emoji'] }, 1, 0] } },
                ai: { $sum: { $cond: [{ $eq: ['$replyType', 'ai'] }, 1, 0] } },
              }
            },
            { $sort: { '_id.date': 1, '_id.window': 1 } }
          ];
          
          const chartData = await commentsCollection.aggregate(pipeline).toArray();
          return new Response(JSON.stringify(chartData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        default:
          return new Response(JSON.stringify({ error: 'Unknown action' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
      }
    }
    
    // POST endpoints
    if (req.method === 'POST') {
      const body = await req.json();
      
      switch (action) {
        case 'pages': {
          const pagesCollection = db.collection('pages');
          const page = {
            ...body,
            createdAt: new Date(),
            activatedAt: new Date(),
            status: 'active',
            autoReply: true,
          };
          const result = await pagesCollection.insertOne(page);
          return new Response(JSON.stringify({ id: result.toString(), ...page }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        case 'settings': {
          const settingsCollection = db.collection('settings');
          await settingsCollection.updateOne(
            { type: 'global' },
            { $set: { ...body, type: 'global', updatedAt: new Date() } },
            { upsert: true }
          );
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        default:
          return new Response(JSON.stringify({ error: 'Unknown action' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
      }
    }
    
    // PUT endpoints
    if (req.method === 'PUT') {
      const body = await req.json();
      
      if (action === 'pages' && body.id) {
        const pagesCollection = db.collection('pages');
        const { id, ...updateData } = body;
        await pagesCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { ...updateData, updatedAt: new Date() } }
        );
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
    // DELETE endpoints  
    if (req.method === 'DELETE') {
      const id = url.searchParams.get('id');
      
      if (action === 'pages' && id) {
        const pagesCollection = db.collection('pages');
        await pagesCollection.deleteOne({ _id: new ObjectId(id) });
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error: unknown) {
    console.error('API error:', error);
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
});
