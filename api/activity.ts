import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMongoClient } from './lib/mongodb.js';
import { handleCors, jsonResponse, errorResponse } from './lib/cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return errorResponse(res, 'Method not allowed', 405);
  }

  try {
    const client = await getMongoClient();
    const db = client.db('replybot');
    const commentsCollection = db.collection('comments');

    const limit = parseInt(req.query.limit as string) || 50;
    const status = req.query.status as string | undefined;
    const pageId = req.query.pageId as string | undefined;

    const filter: Record<string, unknown> = {};
    if (status && status !== 'all') filter.status = status;
    if (pageId) filter.pageId = pageId;

    const activities = await commentsCollection
      .find(filter)
      .sort({ receivedAt: -1 })
      .limit(limit)
      .toArray();

    return jsonResponse(res, activities);
  } catch (error) {
    console.error('Activity API error:', error);
    return errorResponse(res, error instanceof Error ? error.message : 'Unknown error');
  }
}
