import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMongoClient } from './lib/mongodb.js';
import { handleCors, jsonResponse, errorResponse } from './lib/cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  try {
    const client = await getMongoClient();
    const db = client.db('replybot');
    const settingsCollection = db.collection('settings');

    // GET - Retrieve settings
    if (req.method === 'GET') {
      const settings = await settingsCollection.findOne({ type: 'global' });
      return jsonResponse(res, settings || {});
    }

    // POST - Update settings
    if (req.method === 'POST') {
      const body = req.body;
      await settingsCollection.updateOne(
        { type: 'global' },
        { $set: { ...body, type: 'global', updatedAt: new Date() } },
        { upsert: true }
      );
      return jsonResponse(res, { success: true });
    }

    return errorResponse(res, 'Method not allowed', 405);
  } catch (error) {
    console.error('Settings API error:', error);
    return errorResponse(res, error instanceof Error ? error.message : 'Unknown error');
  }
}
