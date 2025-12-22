import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMongoClient, ObjectId } from './lib/mongodb.js';
import { handleCors, jsonResponse, errorResponse } from './lib/cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  try {
    const client = await getMongoClient();
    const db = client.db('replybot');
    const pagesCollection = db.collection('pages');

    // GET - List all pages
    if (req.method === 'GET') {
      const pages = await pagesCollection.find({}).toArray();
      return jsonResponse(res, pages);
    }

    // POST - Create new page
    if (req.method === 'POST') {
      const body = req.body;
      const page = {
        ...body,
        createdAt: new Date(),
        activatedAt: new Date(),
        status: body.status || 'active',
        autoReply: body.autoReply !== undefined ? body.autoReply : true,
      };
      const result = await pagesCollection.insertOne(page);
      return jsonResponse(res, { _id: result.insertedId.toString(), ...page });
    }

    // PUT - Update page
    if (req.method === 'PUT') {
      const { id, ...updateData } = req.body;
      if (!id) {
        return errorResponse(res, 'Page ID required', 400);
      }
      await pagesCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { ...updateData, updatedAt: new Date() } }
      );
      return jsonResponse(res, { success: true });
    }

    // DELETE - Remove page
    if (req.method === 'DELETE') {
      const id = req.query.id as string;
      if (!id) {
        return errorResponse(res, 'Page ID required', 400);
      }
      await pagesCollection.deleteOne({ _id: new ObjectId(id) });
      return jsonResponse(res, { success: true });
    }

    return errorResponse(res, 'Method not allowed', 405);
  } catch (error) {
    console.error('Pages API error:', error);
    return errorResponse(res, error instanceof Error ? error.message : 'Unknown error');
  }
}
