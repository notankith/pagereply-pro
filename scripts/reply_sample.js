#!/usr/bin/env node
/*
Simple sample script to post a reply (comment) to a Facebook object (post or comment).
Usage:
  node scripts/reply_sample.js --object-id <POST_OR_COMMENT_ID> --message "Thanks!" [--token <PAGE_TOKEN>]

You can also set the PAGE_ACCESS_TOKEN environment variable instead of passing --token.
*/

function getArg(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
}

const objectId = getArg('--object-id') || getArg('--comment-id') || getArg('--post-id');
const message = getArg('--message') || getArg('--msg') || 'Thanks!';
const token = getArg('--token') || process.env.PAGE_ACCESS_TOKEN || process.env.ACCESS_TOKEN;
const GRAPH = process.env.FB_GRAPH_URL || 'https://graph.facebook.com/v24.0';

if (!objectId) {
  console.error('Error: --object-id (post or comment id) is required');
  process.exit(1);
}
if (!token) {
  console.error('Error: Page access token not provided. Use --token or set PAGE_ACCESS_TOKEN env var.');
  process.exit(1);
}

(async () => {
  try {
    const url = `${GRAPH}/${objectId}/comments`;

    // Before posting, check if page already replied to this object (comment or post)
    try {
      const checkRes = await fetch(`${GRAPH}/${objectId}/comments?fields=from&limit=500&access_token=${encodeURIComponent(token)}`);
      if (checkRes.ok) {
        const checkText = await checkRes.text();
        const parsed = JSON.parse(checkText || '{}');
        const comments = parsed.data || [];
        const pageReply = comments.find(c => c.from && c.from.id === process.env.PAGE_ID);
        if (pageReply) {
          console.log('Page already replied to this object, skipping.');
          process.exit(0);
        }
      }
    } catch (e) {
      // ignore and proceed
    }

    const body = JSON.stringify({ message, access_token: token });

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    const text = await res.text();
    if (!res.ok) {
      console.error('Facebook API error', res.status, text);
      process.exit(2);
    }

    try {
      const data = JSON.parse(text);
      console.log('Reply posted:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('Reply posted, raw response:', text);
    }
  } catch (err) {
    console.error('Request failed:', err);
    process.exit(3);
  }
})();
