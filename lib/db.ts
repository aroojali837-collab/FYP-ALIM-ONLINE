import type { config, ConnectionPool } from "mssql";
import sql from "mssql";

declare global {
  var sqlPoolPromise: Promise<ConnectionPool> | undefined;
}

const dbServerRaw = process.env.DB_SERVER ?? "DESKTOP-3MPA2LA\\SQLEXPRESS01";
const database = process.env.DB_DATABASE ?? "alim_online";
const trustServerCertificate = process.env.DB_TRUST_SERVER_CERTIFICATE !== "false";

function parseServer(server: string) {
  let host = server;
  let instanceName: string | undefined;
  let port: number | undefined;

  if (server.includes("\\")) {
    [host, instanceName] = server.split("\\");
  }

  if (host.includes(",")) {
    const [hostOnly, portString] = host.split(",");
    host = hostOnly;
    const parsedPort = Number(portString);
    if (!Number.isNaN(parsedPort)) {
      port = parsedPort;
    }
  }

  return { host, instanceName, port };
}

function getConnectionConfig(): config {
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASSWORD;
  const trustedConnection = process.env.DB_TRUSTED_CONNECTION !== "false";
  const dbPortEnv = process.env.DB_PORT;
  const { host, instanceName, port: parsedPort } = parseServer(dbServerRaw);
  const port = dbPortEnv ? Number(dbPortEnv) : parsedPort;

  if (!dbUser || !dbPassword) {
    throw new Error(
      "DB_USER and DB_PASSWORD must be provided in .env.local for SQL authentication. Windows trusted auth is not supported in this Next.js dev setup."
    );
  }

  const config: config = {
    server: host,
    database,
    user: dbUser,
    password: dbPassword,
    options: {
      encrypt: false,
      trustServerCertificate,
      enableArithAbort: true,
    },
    connectionTimeout: 30000,
    requestTimeout: 30000,
  };

  if (port && Number.isFinite(port)) {
    config.port = port;
  } else if (instanceName) {
    config.options = {
      ...config.options,
      instanceName,
    };
  }

  return config;
}

export async function getDbPool() {
  if (!global.sqlPoolPromise) {
    global.sqlPoolPromise = sql.connect(getConnectionConfig()).catch((err) => {
      console.error("Database connection error:", {
        message: err.message,
        server: dbServerRaw,
        database,
        errorCode: err.code,
      });
      throw err;
    });
  }

  return global.sqlPoolPromise;
}

export { sql };
