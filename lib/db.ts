import { Pool } from 'pg';

let dbPool: Pool | null = null;

export const getDb = () => {
  if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
    return null;
  }

  if (!dbPool) {
    dbPool = new Pool({
      connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
      max: 10,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    });
  }
  return dbPool;
};
