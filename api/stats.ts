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
    const pagesCollection = db.collection('pages');

    const pageId = req.query.pageId as string | undefined;
    const filter = pageId ? { pageId } : {};

    const [
      totalComments,
      totalReplies,
      emojiReplies,
      aiReplies,
      pending,
      skipped,
      failed,
      totalPages,
      activePages,
    ] = await Promise.all([
      commentsCollection.countDocuments(filter),
      commentsCollection.countDocuments({ ...filter, status: 'replied' }),
      commentsCollection.countDocuments({ ...filter, replyType: 'emoji' }),
      commentsCollection.countDocuments({ ...filter, replyType: 'ai' }),
      commentsCollection.countDocuments({ ...filter, status: 'pending' }),
      commentsCollection.countDocuments({ ...filter, status: 'skipped' }),
      commentsCollection.countDocuments({ ...filter, status: 'failed' }),
      pagesCollection.countDocuments({}),
      pagesCollection.countDocuments({ status: 'active' }),
    ]);

    return jsonResponse(res, {
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
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return errorResponse(res, error instanceof Error ? error.message : 'Unknown error');
  }
}
