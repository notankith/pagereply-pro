import { MongoClient, ObjectId } from 'mongodb';

// MongoDB singleton connection for Vercel serverless
let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI environment variable');
}

export async function getMongoClient(): Promise<MongoClient> {
  if (client) {
    return client;
  }

  if (!clientPromise) {
    client = new MongoClient(MONGODB_URI!);
    clientPromise = client.connect();
  }

  client = await clientPromise;
  return client;
}

export function getDb(dbName = 'replybot') {
  if (!client) {
    throw new Error('MongoDB client not connected');
  }
  return client.db(dbName);
}

export { ObjectId };
