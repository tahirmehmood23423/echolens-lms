import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7 config: connection URLs live here, not in schema.prisma's
// datasource block. Migrations must use DIRECT_URL (the direct port-5432
// connection), not DATABASE_URL (the pgbouncer pooler) - pooled connections
// don't support the prepared statements/advisory locks migrate needs.
// DATABASE_URL stays in .env for the app's own runtime use.
export default defineConfig({
  schema: "schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
