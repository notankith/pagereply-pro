import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config({ path: '.env.local' });

const GRAPH = process.env.FB_GRAPH_URL || 'https://graph.facebook.com/v24.0';

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set in .env.local');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('replybot');
  const page = await db.collection('pages').findOne({ status: 'active' });
  if (!page) {
    console.error('No active pages found in DB');
    await client.close();
    process.exit(1);
  }

  console.log('Using page:', page.name, page.pageId);
  const token = page.accessToken;
  if (!token) {
    console.error('Page has no accessToken field');
    await client.close();
    process.exit(1);
  }

  // Fetch recent posts
  const postsRes = await fetch(`${GRAPH}/${page.pageId}/posts?limit=5&fields=id&access_token=${encodeURIComponent(token)}`);
  const postsText = await postsRes.text();
  console.log('posts status:', postsRes.status);
  console.log('posts body:', postsText);

  let postId = null;
  try {
    const parsed = JSON.parse(postsText);
    postId = parsed?.data?.[0]?.id;
  } catch (e) {
    // ignore
  }

  if (!postId) {
    console.error('No postId available to comment on');
    await client.close();
    process.exit(1);
  }

  console.log('Posting test comment to post:', postId);
  const msg = 'Test reply from local script';
  // Check if page already commented on this post to avoid duplicate
  try {
    const checkRes = await fetch(`${GRAPH}/${postId}/comments?fields=from&limit=500&access_token=${encodeURIComponent(token)}`);
    if (checkRes.ok) {
      const checkText = await checkRes.text();
      const parsed = JSON.parse(checkText || '{}');
      const comments = parsed.data || [];
      const pageComment = comments.find(c => c.from && c.from.id === page.pageId);
      if (pageComment) {
        console.log('Page already commented on this post, skipping test post.');
        await client.close();
        process.exit(0);
      }
    }
  } catch (e) {
    console.warn('Could not verify existing comments, proceeding to post:', e);
  }

  const postRes = await fetch(`${GRAPH}/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: msg, access_token: token }),
  });

  const postText = await postRes.text();
  console.log('post comment status:', postRes.status);
  console.log('post comment body:', postText);

  await client.close();
}

main().catch(e => { console.error(e); process.exit(1); });
