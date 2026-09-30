// Simple script to apply SQL Server schema using `mssql` library.
// Usage: set environment variables (DB_SERVER or DB_HOST, DB_PORT, DB_USER,
// DB_PASSWORD or DB_PASS, DB_DATABASE or DB_NAME) then run:
// node database/apply_schema.js

const fs = require('fs');
const path = require('path');
const sql = require('mssql');

function loadLocalEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) {
      continue;
    }

    const key = match[1];
    const value = match[2].replace(/\r$/, '').trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function run() {
  loadLocalEnv();

  const serverRaw = process.env.DB_SERVER || process.env.DB_HOST || 'localhost';
  let server = serverRaw;
  let instanceName;
  const port = parseInt(process.env.DB_PORT || '1433', 10);
  const user = process.env.DB_USER || 'sa';
  const password = process.env.DB_PASSWORD || process.env.DB_PASS || 'YourPassword';
  const database = process.env.DB_DATABASE || process.env.DB_NAME || 'master';

  if (serverRaw.includes('\\')) {
    [server, instanceName] = serverRaw.split('\\');
  }

  const config = {
    server: server.trim(),
    port,
    user: user,
    password: password,
    database: database,
    options: {
      encrypt: false,
      trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
      enableArithAbort: true
    }
  };

  if (instanceName && !process.env.DB_PORT) {
    config.options.instanceName = instanceName.trim();
  }

  const filePath = path.join(__dirname, 'sql-server-schema.sql');
  if (!fs.existsSync(filePath)) {
    console.error('Schema file not found:', filePath);
    process.exit(1);
  }

  const sqlText = fs.readFileSync(filePath, 'utf8');

  let pool;
  try {
    pool = await sql.connect(config);
    console.log('Connected to SQL Server at', `${config.server}:${config.port}`);
    console.log('Applying schema...');
    await pool.request().batch(sqlText);
    console.log('Schema applied successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error applying schema:', err.message || err);
    process.exit(2);
  } finally {
    if (pool) {
      try { await pool.close(); } catch (e) { /* ignore */ }
    }
  }
}

run();
