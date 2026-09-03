import { MongoClient, type Db } from "mongodb";

/**
 * One MongoDB connection per process, reused across requests.
 *
 * ⚠️ CACHED ON `globalThis`, AND THAT IS NOT A HACK. In development Next hot-reloads this
 * module on every save; a plain module-level variable is re-initialised each time, so a
 * morning's editing opens a hundred connections and Atlas starts refusing them with
 * "connection limit exceeded" — a failure that looks like a database outage and is actually
 * a dev-server artefact. The global survives module replacement, so the pool does too.
 *
 * ⚠️ NOTHING HERE THROWS AT IMPORT. A missing `MONGODB_URI` must not take down the landing
 * page — it must make the one route that needs a database answer honestly. Callers check
 * `mongoConfigured` and answer 503 with a reason.
 */

const URI = process.env.MONGODB_URI ?? "";
const DB_NAME = process.env.MONGODB_DB ?? "innovgeist";

export const mongoConfigured = Boolean(URI);

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function clientPromise(): Promise<MongoClient> {
  if (!URI) throw new Error("MONGODB_URI is not set");
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(URI, {
      // Keep the pool small: a serverless instance handles a handful of concurrent
      // requests, and every idle socket is one the cluster counts against its cap.
      maxPoolSize: 10,
      retryWrites: true,
    }).connect();
  }
  return global._mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  return (await clientPromise()).db(DB_NAME);
}

/**
 * Indexes, created once per process on first use.
 *
 * Mongo's `createIndex` is idempotent, so calling it repeatedly is cheap and safe; the
 * `ensured` flag just avoids a round trip on every request. This is deliberately not a
 * migration step — there is nothing to migrate, and a route that self-heals its indexes
 * cannot drift from a schema file somebody forgot to run.
 */
let ensured = false;

export async function ensureEnquiryIndexes(db: Db): Promise<void> {
  if (ensured) return;
  const enquiries = db.collection("enquiries");
  await Promise.all([
    enquiries.createIndex({ createdAt: -1 }),
    enquiries.createIndex({ email: 1 }),
    enquiries.createIndex({ source: 1, createdAt: -1 }),
  ]);
  ensured = true;
}
