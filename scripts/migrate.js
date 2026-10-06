import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL tidak ditemukan di .env');
    process.exit(1);
  }

  console.log('⏳ Menghubungkan ke PostgreSQL...');
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  console.log('⏳ Menjalankan migrasi Drizzle dari folder ./drizzle ...');
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('✅ Migrasi database BERHASIL!');
  } catch (err) {
    console.error('❌ Gagal menjalankan migrasi:', err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();
