import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
loadEnv({ path: resolve(process.cwd(), '../../.env') });
loadEnv(); // also try local .env
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL no definida');
  const sql = postgres(url, { max: 1 });
  const db = drizzle(sql);
  console.log('Aplicando migraciones...');
  await migrate(db, { migrationsFolder: './migrations' });
  console.log('OK ✔');
  await sql.end();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
