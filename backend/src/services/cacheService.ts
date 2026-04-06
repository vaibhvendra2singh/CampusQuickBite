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
        logger.warn('[Cache] REDIS_URL not set — caching is DISABLED. Set REDIS_URL to enable.');
        return null;
    }

    try {
        const client = new RedisClient(redisUrl, {
            maxRetriesPerRequest: 1, // Don't retry endlessly
            connectTimeout: 500,     // 500ms instead of 5s
            lazyConnect: true,
        });

        client.on('connect', () => logger.info('[Cache] Redis connected ✓'));
        client.on('error', (err) => logger.error('[Cache] Redis error:', { message: err.message }));
        client.on('close', () => logger.warn('[Cache] Redis connection closed'));

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
 * Get a cached value. Returns `null` on miss or error.
 */
export const cacheGet = async <T = any>(key: string): Promise<T | null> => {
    const client = getClient();
    if (!client) return null;

    try {
        const value = await client.get(key);
        if (!value) return null;
        return JSON.parse(value) as T;
    } catch (err) {
        logger.error(`[Cache] GET failed for key "${key}":`, err);
        return null;
    }
};

/**
 * Set a cached value with an optional TTL.
 * @param key Cache key
 * @param value Serializable JS value
 * @param ttlSeconds TTL in seconds (default: 5 minutes)
 */
export const cacheSet = async (key: string, value: any, ttlSeconds: number = CACHE_TTL.MENU): Promise<void> => {
    const client = getClient();
    if (!client) return;

    try {
        await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
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
        await client.del(...keys);
        logger.info(`[Cache] Invalidated keys: ${keys.join(', ')}`);
    } catch (err) {
        logger.error(`[Cache] DEL failed for keys "${keys.join(', ')}":`, err);
    }
};

/**
 * Delete all keys matching a pattern (e.g. "menu:outlet:*").
 * Use sparingly — SCAN is O(n) on keyspace.
 */
export const cacheDelPattern = async (pattern: string): Promise<void> => {
    const client = getClient();
    if (!client) return;

    try {
        let cursor = '0';
        do {
            const [nextCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
            cursor = nextCursor;
            if (keys.length > 0) {
                await client.del(...keys);
                logger.info(`[Cache] Invalidated ${keys.length} keys matching "${pattern}"`);
            }
        } while (cursor !== '0');
    } catch (err) {
        logger.error(`[Cache] Pattern DEL failed for "${pattern}":`, err);
    }
};

export default { get: cacheGet, set: cacheSet, del: cacheDel, delPattern: cacheDelPattern };
