import { config } from "dotenv";
import type { PrismaConfig } from "prisma";

// Next.js uses .env.local — load it explicitly for Prisma CLI
config({ path: ".env.local" });

export default {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
} satisfies PrismaConfig;
