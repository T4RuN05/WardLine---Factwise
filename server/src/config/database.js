import mongoose from 'mongoose';
import { env } from './env.js';

let isReplicaSet = null;

export async function connectDatabase() {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    console.log(`[Database] Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`);
    
    // Check if replica set is supported for transactions
    try {
      const adminDb = mongoose.connection.db.admin();
      const status = await adminDb.command({ replSetGetStatus: 1 }).catch(() => null);
      isReplicaSet = !!status && status.ok === 1;
    } catch {
      isReplicaSet = false;
    }
    
    console.log(`[Database] Transactions supported (replica set): ${isReplicaSet}`);
    return conn;
  } catch (error) {
    console.error('[Database] Connection error:', error.message);
    throw error;
  }
}

/**
 * Executes a callback within a MongoDB transaction if replica set is active,
 * or runs directly if running on a standalone development instance.
 */
export async function withTransaction(callback) {
  if (isReplicaSet) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const result = await callback(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } else {
    // Standalone fallback for local dev when no replica set is configured
    return await callback(null);
  }
}
