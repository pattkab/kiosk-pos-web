import { headers } from "next/headers";
import { logger } from "./logger";

/**
 * Basic rate limiting pattern for Server Actions.
 * In a real production app, integrate this with Upstash Redis or Vercel KV.
 */
export async function rateLimit(key: string, limit: number = 10, windowMs: number = 60000) {
  // Mock implementation for standard release setup
  // Real implementation: const { success } = await ratelimit.limit(key);

  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for") || "unknown";
  const identifier = `${key}:${ip}`;

  // Log the attempt for auditing
  logger.info(`Rate limit check for ${identifier}`);

  return true; // Assume success for now, but pattern is ready for Redis
}

/**
 * Validate that the user belongs to the organization they are trying to access.
 */
export async function validateOrgAccess(userOrgs: string[], targetOrgId: string) {
  if (!userOrgs.includes(targetOrgId)) {
    logger.warn(`Unauthorized organization access attempt`, { targetOrgId });
    throw new Error("Unauthorized access to this organization.");
  }
}
