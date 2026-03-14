import { PrismaClient } from "@prisma/client";

// Map common provider-specific env vars to Prisma's expected names.
const isPostgresUrl = (value?: string) =>
  Boolean(value && /^(postgres|postgresql):\/\//.test(value));

if (!process.env.DATABASE_URL) {
  const databaseUrlCandidates = [
    process.env.DATABASE_URL_POSTGRES_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.POSTGRES_PRISMA_URL,
    process.env.DATABASE_URL_PRISMA_DATABASE_URL,
  ];
  process.env.DATABASE_URL = databaseUrlCandidates.find(isPostgresUrl);
}

if (!process.env.DIRECT_URL) {
  const directUrlCandidates = [
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.DATABASE_URL_POSTGRES_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
  ];
  process.env.DIRECT_URL = directUrlCandidates.find(isPostgresUrl);
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
