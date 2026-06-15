/**
 * mongodb.ts — MongoDB Atlas connection singleton
 *
 * Uses the official MongoDB Node.js driver with connection pooling.
 * Caches the client across hot-reloads in development.
 */

import { MongoClient, Db, type MongoClientOptions } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME   = process.env.MONGO_DB_NAME || 'obe_platform';

if (!MONGO_URI) {
  throw new Error(
    'MONGO_URI is not defined. Add it to .env.local:\n' +
    'MONGO_URI=mongodb+srv://...'
  );
}

const options: MongoClientOptions = {
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 30_000,
  connectTimeoutMS: 10_000,
  serverSelectionTimeoutMS: 10_000,
  retryWrites: true,
  retryReads: true,
};

// ── Global cache (survives Next.js hot-reload in dev) ───────────────
interface MongoGlobal {
  _mongoClient?: MongoClient;
  _mongoClientPromise?: Promise<MongoClient>;
}

const g = globalThis as unknown as MongoGlobal;

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // Reuse client across HMR reloads
  if (!g._mongoClientPromise) {
    client = new MongoClient(MONGO_URI, options);
    g._mongoClientPromise = client.connect();
    g._mongoClient = client;
  }
  clientPromise = g._mongoClientPromise;
} else {
  client = new MongoClient(MONGO_URI, options);
  clientPromise = client.connect();
}

export { clientPromise };

/**
 * Get a ready-to-use Db instance.
 * Awaits the connection if not yet established.
 */
export async function getDb(): Promise<Db> {
  const c = await clientPromise;
  return c.db(DB_NAME);
}

/**
 * Collection names used across the platform.
 */
export const COLLECTIONS = {
  USERS:      'users',
  COURSES:    'courses',
  PROGRAMS:   'programs',
  SYLLABI:    'syllabi',
  PROJECTS:   'projects',
  FEEDBACK:   'feedback',
  AUDIT_LOG:  'audit_log',
} as const;
