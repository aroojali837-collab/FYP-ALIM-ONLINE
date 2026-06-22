require('fs')
  .readFileSync('.env.local', 'utf8')
  .split(/\r?\n/)
  .forEach((line) => {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2];
    }
  });

const useNativeDriver = process.env.DB_DRIVER === 'msnodesqlv8';
const sql = useNativeDriver ? require('mssql/msnodesqlv8') : require('mssql');

const serverRaw = process.env.DB_SERVER || 'DESKTOP-3MPA2LA\\SQLEXPRESS01';
let server = serverRaw;
let instanceName;
const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined;

if (serverRaw.includes('\\')) {
  [server, instanceName] = serverRaw.split('\\');
}

const config = {
  server,
  database: process.env.DB_DATABASE || 'alim_online',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: false,
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
    instanceName,
    enableArithAbort: true,
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
};

if (port && Number.isFinite(port)) {
  config.port = port;
} else if (instanceName) {
  config.options.instanceName = instanceName;
}

if (useNativeDriver) {
  config.connectionString = [
    'Driver={ODBC Driver 18 for SQL Server}',
    `Server=${port ? `${server},${port}` : serverRaw}`,
    `Database=${config.database}`,
    `UID=${config.user}`,
    `PWD=${config.password}`,
    'Encrypt=no',
    'TrustServerCertificate=yes',
  ].join(';');
}
console.log('start');
sql.connect(config)
  .then(pool => pool.request().query('SELECT 1 AS connected').then(r => {
    console.log('SUCCESS', JSON.stringify(r.recordset));
    return pool.close();
  }))
  .catch(e => {
    console.error('ERR', e.message);
    if (e.stack) console.error(e.stack.split('\n').slice(0,5).join('\n'));
    process.exit(1);
  });
