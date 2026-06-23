const fs = require('fs');

// Robust .env parser that safely handles hidden Windows carriage returns (\r)
if (fs.existsSync('.env.local')) {
  fs.readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .forEach((line) => {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (match) {
        const key = match[1];
        const value = match[2].replace(/\r$/, '').trim(); // Strips hidden trailing \r
        
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
}

const sql = require('mssql');

const serverRaw = process.env.DB_SERVER || 'DESKTOP-3MPA2LA\\SQLEXPRESS01';
let server = serverRaw;
let instanceName;
const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined;

// Correctly split server and instance name
if (serverRaw.includes('\\')) {
  [server, instanceName] = serverRaw.split('\\');
}

const config = {
  server: server.trim(),
  database: (process.env.DB_DATABASE || 'alim_online').trim(),
  user: process.env.DB_USER ? process.env.DB_USER.trim() : undefined,
  password: process.env.DB_PASSWORD ? process.env.DB_PASSWORD.trim() : undefined,
  options: {
    encrypt: false, // Set to true if connecting to Azure
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
    enableArithAbort: true,
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
};

// Route connection targets dynamically
if (port && Number.isFinite(port)) {
  config.port = port;
} else if (instanceName) {
  config.options.instanceName = instanceName.trim();
}

console.log('start');
console.log(`Connecting to Server: "${config.server}" | Instance: "${config.options.instanceName || 'default'}"`);

sql.connect(config)
  .then(pool => pool.request().query('SELECT 1 AS connected').then(r => {
    console.log('SUCCESS:', JSON.stringify(r.recordset));
    return pool.close();
  }))
  .catch(e => {
    console.error('ERR:', e.message);
    if (e.stack) console.error(e.stack.split('\n').slice(0, 5).join('\n'));
    process.exit(1);
  });