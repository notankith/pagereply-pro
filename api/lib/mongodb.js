import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI environment variable');
}

let client = null;
let clientPromise = null;

export async function getMongoClient() {
  if (client) return client;
  if (!clientPromise) {
    const c = new MongoClient(MONGODB_URI);
    clientPromise = c.connect().then(() => {
      client = c;
      return client;
    });
  }
  client = await clientPromise;
  return client;
}

export function getDb(dbName = 'replybot') {
  if (!client) throw new Error('MongoDB client not connected');
  return client.db(dbName);
}

export { ObjectId };
