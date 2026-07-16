import { Pool } from 'pg';
import { registerType } from 'pgvector/pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'digitaltwin',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgrespassword',
});

// Initialize pgvector when the pool connects
pool.on('connect', async (client) => {
  await registerType(client);
});

export default pool;
