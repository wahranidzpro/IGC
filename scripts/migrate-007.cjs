/* eslint-disable @typescript-eslint/no-require-imports */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const PROJECT_REF = 'vakoyofojhsefkffjhox';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(q) {
  return new Promise(resolve => rl.question(q, resolve));
}

async function main() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║  Infinity Gym — Migration 007 (RFID Access)  ║');
  console.log('╚═══════════════════════════════════════════════╝');
  console.log('');

  const dbPassword = process.env.SUPABASE_DB_PASSWORD || await ask('🔑 Entrez le mot de passe de la base Supabase : ');

  const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '007_rfid_access.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('❌ Fichier migration introuvable:', sqlPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf-8');

  console.log('📄 Fichier SQL chargé (' + (sql.length / 1024).toFixed(1) + ' KB)');
  console.log('🔌 Connexion à Supabase...');

  const client = new Client({
    host: 'aws-0-us-west-1.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.' + PROJECT_REF,
    password: dbPassword,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    console.log('✅ Connecté à Supabase PostgreSQL');
    console.log('⚙️  Exécution de la migration...');
    await client.query(sql);
    console.log('✅ Migration 007 exécutée avec succès !');
    console.log('');
    console.log('📋 Tables créées/mises à jour :');
    console.log('   - blocked_cards');
    console.log('   - access_restrictions');
    console.log('   - access_logs (colonnes ajoutées)');
    console.log('   - turnstile_members (colonne rfid_uid ajoutée)');
    console.log('   - Fonctions : check_rfid_access, log_rfid_access');
    console.log('   - Indexes, RLS, Realtime activés');
  } catch (err) {
    console.error('❌ Erreur:', err.message);
    console.log('');
    console.log('💡 Alternative : copiez le fichier suivant dans le SQL Editor Supabase :');
    console.log('   https://supabase.com/dashboard/project/' + PROJECT_REF + '/sql/new');
    console.log('   Fichier : supabase/migrations/007_rfid_access.sql');
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
    rl.close();
  }
}

main();
