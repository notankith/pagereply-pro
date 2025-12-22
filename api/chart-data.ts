import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMongoClient } from './lib/mongodb';
import { handleCors, jsonResponse, errorResponse } from './lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return errorResponse(res, 'Method not allowed', 405);
  }

  try {
    const client = await getMongoClient();
    const db = client.db('replybot');
    const commentsCollection = db.collection('comments');

    const days = parseInt(req.query.days as string) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const pipeline = [
      { $match: { status: 'replied', repliedAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$repliedAt' } },
            window: {
              $multiply: [
                { $floor: { $divide: [{ $hour: '$repliedAt' }, 6] } },
                6,
              ],
            },
          },
          emoji: { $sum: { $cond: [{ $eq: ['$replyType', 'emoji'] }, 1, 0] } },
          ai: { $sum: { $cond: [{ $eq: ['$replyType', 'ai'] }, 1, 0] } },
        },
      },
      { $sort: { '_id.date': 1, '_id.window': 1 } as const },
    ];

    const chartData = await commentsCollection.aggregate(pipeline).toArray();
    return jsonResponse(res, chartData);
  } catch (error) {
    console.error('Chart data API error:', error);
    return errorResponse(res, error instanceof Error ? error.message : 'Unknown error');
  }
}
