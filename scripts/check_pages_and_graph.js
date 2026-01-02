import { MongoClient } from 'mongodb';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI missing in .env.local');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('replybot');
  const pages = await db.collection('pages').find({}).toArray();
  console.log('Pages in DB:', pages.length);
  if (pages.length === 0) {
    await client.close();
    return;
  }

  for (const p of pages) {
    console.log('\n---');
    console.log('name:', p.name);
    console.log('pageId:', p.pageId);
    console.log('accessToken:', (p.accessToken || '').slice(0, 12) + '...');

    const graphBase = process.env.FB_GRAPH_URL || 'https://graph.facebook.com/v24.0';
    try {
      const postsRes = await fetch(`${graphBase}/${p.pageId}/posts?limit=5&fields=id&access_token=${encodeURIComponent(p.accessToken)}`);
      const postsText = await postsRes.text();
      console.log('posts status:', postsRes.status);
      console.log('posts body:', postsText);

      // If posts exist, try a comments fetch for first post
      try {
        const parsed = JSON.parse(postsText);
        const postId = parsed?.data?.[0]?.id;
        if (postId) {
          const commentsRes = await fetch(`${graphBase}/${postId}/comments?fields=id,message,from&limit=5&access_token=${encodeURIComponent(p.accessToken)}`);
          const commentsText = await commentsRes.text();
          console.log('comments status:', commentsRes.status);
          console.log('comments body:', commentsText);
        }
      } catch (e) {
        // ignore
      }
    } catch (err) {
      console.error('Graph fetch error for page', p.pageId, err);
    }
  }

  await client.close();
}

main().catch(e=>{console.error(e); process.exit(1);});
