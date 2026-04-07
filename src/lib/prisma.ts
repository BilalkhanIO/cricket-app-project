import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

// Prisma Postgres (db.prisma.io) requires the Accelerate proxy URL at runtime.
// The direct postgres:// URL only works for prisma migrate / prisma db push.
const isAccelerateUrl = (value?: string) =>
    Boolean(value && value.startsWith("prisma+postgres://"));

const isPostgresUrl = (value?: string) =>
    Boolean(value && /^(postgres|postgresql):\/\//.test(value));

// If DATABASE_URL is not set, fall back to env candidates in priority order.
if (!process.env.DATABASE_URL) {
    const candidates = [
        process.env.DATABASE_URL_PRISMA_DATABASE_URL, // prisma+postgres:// (preferred)
        process.env.DATABASE_URL_POSTGRES_URL,         // postgres:// (direct, last resort)
        process.env.POSTGRES_URL,
        process.env.POSTGRES_URL_NON_POOLING,
        process.env.POSTGRES_PRISMA_URL,
    ];
    process.env.DATABASE_URL =
        candidates.find(isAccelerateUrl) ?? candidates.find(isPostgresUrl);
}

if (!process.env.DIRECT_URL) {
    const directCandidates = [
        process.env.DATABASE_URL_POSTGRES_URL,
        process.env.POSTGRES_URL_NON_POOLING,
        process.env.POSTGRES_URL,
        process.env.POSTGRES_PRISMA_URL,
    ];
    process.env.DIRECT_URL = directCandidates.find(isPostgresUrl);
}

const globalForPrisma = globalThis as unknown as {
    prisma: ReturnType<typeof buildClient> | undefined;
};

function buildClient() {
    return new PrismaClient({ log: ["error"] }).$extends(withAccelerate());
}

export const prisma = globalForPrisma.prisma ?? buildClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
