/**
 * Infinity Gym Center — Migration + Backfill runner
 *
 * Usage:
 *   1. Set SUPABASE_DB_URL (postgresql://postgres:password@db.xxx.supabase.co:5432/postgres)
 *      Or set individual env vars: PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE
 *   2. node scripts/migrate-and-backfill.js
 *
 * Alternatively, copy-paste the SQL files from supabase/migrations/013_*.sql
 * and 014_*.sql into the Supabase Dashboard SQL Editor.
 */

import { readFileSync, existsSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import pg from "pg"

const __dirname = dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = resolve(__dirname, "..", "supabase", "migrations")

const MIGRATIONS = ["013_reception_coach_privileges.sql", "014_auto_subscriptions_and_settings.sql"]

async function applyMigration(pool, filePath, name) {
  console.log(`\n📦 Applying ${name}...`)
  const sql = readFileSync(filePath, "utf8")
  try {
    await pool.query(sql)
    console.log(`✅ ${name} applied successfully`)
  } catch (err) {
    // Ignore "already exists" type errors for idempotency
    if (err.message?.includes("already exists") || err.message?.includes("duplicate")) {
      console.log(`⚠️  ${name}: some objects already exist (idempotent)`)
    } else {
      throw err
    }
  }
}

async function runBackfill() {
  console.log(`\n📦 Running backfill-subscriptions...`)
  const { default: backfill } = await import("./backfill-subscriptions.mjs")
  // backfill reads env vars directly
}

async function main() {
  const dbUrl = process.env.SUPABASE_DB_URL
  if (!dbUrl) {
    console.log(`
❌ SUPABASE_DB_URL not set.

To apply migrations via Supabase Dashboard:
  1. Open https://supabase.com/dashboard/project/ozlhyunylifenywugefz
  2. Go to SQL Editor
  3. Copy-paste the contents of:
     - supabase/migrations/013_reception_coach_privileges.sql
     - supabase/migrations/014_auto_subscriptions_and_settings.sql
  4. Run them in order
  5. Then run: node scripts/backfill-subscriptions.mjs

Or set SUPABASE_DB_URL and run this script again.
`)
    process.exit(1)
  }

  const pool = new pg.Pool({ connectionString: dbUrl })

  try {
    console.log("🔌 Connected to database")

    for (const file of MIGRATIONS) {
      const filePath = resolve(MIGRATIONS_DIR, file)
      if (!existsSync(filePath)) {
        console.warn(`⚠️  File not found: ${filePath}`)
        continue
      }
      await applyMigration(pool, filePath, file)
    }

    console.log(`\n✅ All migrations applied successfully`)
  } catch (err) {
    console.error(`\n❌ Migration failed:`, err.message)
    process.exit(1)
  } finally {
    await pool.end()
  }

  console.log(`\n📦 Running backfill script...`)
  await runBackfill()

  console.log(`\n🎉 All done!`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
