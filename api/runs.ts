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
    const runsCollection = db.collection('runs');

    const limit = parseInt(req.query.limit as string) || 10;

    const runs = await runsCollection
      .find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    return jsonResponse(res, runs);
  } catch (error) {
    console.error('Runs API error:', error);
    return errorResponse(res, error instanceof Error ? error.message : 'Unknown error');
  }
}
