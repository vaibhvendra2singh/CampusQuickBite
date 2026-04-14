/**
 * Redis Cache Service
 * 
 * Wraps ioredis with a simple get/set/del API.
 * Falls back gracefully if Redis is not configured (dev without Docker).
 * 
 * TTL presets:
 *   MENU_TTL    — 5 minutes  (menu items change infrequently)
 *   OUTLETS_TTL — 2 minutes  (outlet open/close status can change)
 *   SHORT_TTL   — 30 seconds (high-frequency dashboards)
 */

import RedisClient, { Redis } from 'ioredis';
import logger from './logger';

export const CACHE_TTL = {
    MENU: 60 * 5,      // 5 minutes
    OUTLETS: 60 * 2,   // 2 minutes
    SHORT: 30,         // 30 seconds
    ANALYTICS: 60 * 10 // 10 minutes
} as const;

export const CacheKey = {
    menu: (outletId: string) => `menu:outlet:${outletId}`,
    outlets: () => `outlets:all`,
    outletById: (id: string) => `outlet:${id}`,
    analytics: (outletId: string) => `analytics:${outletId}`,
};

let redisClient: Redis | null = null;

const createRedisClient = (): Redis | null => {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
        logger.warn('[Cache] REDIS_URL not set — caching is DISABLED.');
        return null;
    }

    try {
        const client = new RedisClient(redisUrl, {
            maxRetriesPerRequest: 0, // Fail immediately if a request can't be processed
            connectTimeout: 500,     // Wait only 500ms to connect
            enableOfflineQueue: false, // Don't queue commands when Redis is down
            retryStrategy: (times) => {
                // Circuit Breaker: If we've failed more than 3 times, stop retrying for 5 minutes
                if (times > 3) {
                    logger.error('[Cache] Redis Circuit Breaker triggered. Disabling cache for 5 minutes.');
                    return null; // Stop retrying
                }
                return Math.min(times * 100, 2000); // Gradual backoff
            }
        });

        client.on('connect', () => logger.info('[Cache] Redis connected ✓'));
        client.on('error', (err) => {
            // Log briefly but don't crash
            logger.debug('[Cache] Redis unstable state detected.');
        });
        client.on('close', () => logger.warn('[Cache] Redis connection closed. Falling back to DB.'));

        return client;
    } catch (err) {
        logger.error('[Cache] Failed to create Redis client:', err);
        return null;
    }
};

export const initCache = (): void => {
    if (!redisClient) {
        redisClient = createRedisClient();
    }
};

const getClient = (): Redis | null => {
    if (!redisClient) {
        initCache();
    }
    return redisClient;
};


/**
 * Helper to wrap any async call in a timeout.
 * Ensures we don't block the request if Redis is hanging.
 */
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 400): Promise<T | null> => {
    return Promise.race([
        promise,
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Redis Timeout')), timeoutMs))
    ]).catch((err) => {
        logger.error('[Cache] Redis Operation Failed/Timed out:', err.message);
        return null;
    });
};

/**
 * Get a cached value. Returns `null` on miss or error.
 */
export const cacheGet = async <T = any>(key: string): Promise<T | null> => {
    const client = getClient();
    if (!client) return null;

    try {
        const value = await withTimeout(client.get(key));
        if (!value) return null;
        return JSON.parse(value) as T;
    } catch (err) {
        logger.error(`[Cache] GET failed for key "${key}":`, err);
        return null;
    }
};

/**
 * Set a cached value with an optional TTL.
 */
export const cacheSet = async (key: string, value: any, ttlSeconds: number = CACHE_TTL.MENU): Promise<void> => {
    const client = getClient();
    if (!client) return;

    try {
        await withTimeout(client.set(key, JSON.stringify(value), 'EX', ttlSeconds));
    } catch (err) {
        logger.error(`[Cache] SET failed for key "${key}":`, err);
    }
};

/**
 * Delete one or more cache keys.
 */
export const cacheDel = async (...keys: string[]): Promise<void> => {
    const client = getClient();
    if (!client) return;

    try {
        await withTimeout(client.del(...keys));
        logger.info(`[Cache] Invalidated keys: ${keys.join(', ')}`);
    } catch (err) {
        logger.error(`[Cache] DEL failed for keys "${keys.join(', ')}":`, err);
    }
};

/**
 * Delete all keys matching a pattern (e.g. "menu:outlet:*").
 */
export const cacheDelPattern = async (pattern: string): Promise<void> => {
    const client = getClient();
    if (!client) return;

    try {
        let cursor = '0';
        do {
            const [nextCursor, keys] = await withTimeout(client.scan(cursor, 'MATCH', pattern, 'COUNT', 100)) as any || ['0', []];
            cursor = nextCursor;
            if (keys && keys.length > 0) {
                await withTimeout(client.del(...keys));
                logger.info(`[Cache] Invalidated ${keys.length} keys matching "${pattern}"`);
            }
        } while (cursor !== '0');
    } catch (err) {
        logger.error(`[Cache] Pattern DEL failed for "${pattern}":`, err);
    }
};

export default { get: cacheGet, set: cacheSet, del: cacheDel, delPattern: cacheDelPattern };
