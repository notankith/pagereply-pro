import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMongoClient } from './lib/mongodb';
import { handleCors, jsonResponse, errorResponse } from './lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  try {
    const client = await getMongoClient();
    const db = client.db('replybot');
    
    // Simple ping to verify connection
    await db.command({ ping: 1 });

    return jsonResponse(res, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      mongodb: 'connected',
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return errorResponse(res, 'MongoDB connection failed');
  }
}
