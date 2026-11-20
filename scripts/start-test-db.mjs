// Starts a throwaway local Postgres for the integration tests, using the
// database server that ships with Prisma. Nothing is saved: stopping this
// process (Ctrl+C) throws the data away.
//
//   node scripts/start-test-db.mjs
//
// It prints a connection address. In a second terminal, from the website folder:
//
//   $env:DATABASE_URL = "<that address>"; pnpm prisma migrate deploy      (PowerShell)
//   DATABASE_URL="<that address>" pnpm prisma migrate deploy               (bash)
//   $env:TEST_DATABASE_URL = "<that address>"; pnpm test:integration
//
// Always set DATABASE_URL explicitly for the migrate command, so it can never
// reach your real database through .env.local.

import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
// @prisma/dev is a dependency of the prisma package, so look for it from there.
const fromPrisma = createRequire(require.resolve("prisma/package.json"));
const { startPrismaDevServer } = await import(pathToFileURL(fromPrisma.resolve("@prisma/dev")).href);

const server = await startPrismaDevServer({
  name: "yif-test",
  persistenceMode: "stateless",
  port: 51313,
  databasePort: 51314,
  shadowDatabasePort: 51315,
});

console.log("Throwaway database ready. Connection address:");
console.log(server.database.connectionString);
console.log("Press Ctrl+C to stop it and discard everything.");

const stop = async () => {
  await server.close();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
setInterval(() => {}, 1 << 30);
