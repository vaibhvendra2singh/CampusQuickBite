/**
 * Standardized API Response Utility
 * 
 * Every API response in CampusBite will follow this JSON shape:
 * 
 *  Success: { success: true,  data: any,  message: string, meta?: object }
 *  Error:   { success: false, error: string, details?: any }
 * 
 * Usage:
 *   import { sendSuccess, sendError, sendPaginated } from '../utils/response';
 * 
 *   sendSuccess(res, data, 'Order created', 201);
 *   sendError(res, 'Not found', 404);
 *   sendPaginated(res, items, total, page, size);
 */

import { Response } from 'express';

interface PaginationMeta {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}


/**
 * Send a successful response.
 * @param res Express Response
 * @param data Payload to return
 * @param message Human-readable success message
 * @param statusCode HTTP status (default 200)
 * @param meta Optional extra metadata (e.g. pagination)
 */
export const sendSuccess = (
    res: Response,
    data: any = null,
    message: string = 'Success',
    statusCode: number = 200,
    meta?: object
): void => {
    const payload: any = {
        success: true,
        message,
        data,
    };
    if (meta) payload.meta = meta;

    res.status(statusCode).json(payload);
};

/**
 * Send an error response.
 * @param res Express Response
 * @param error Error message string
 * @param statusCode HTTP status (default 500)
 * @param details Optional additional details (validation errors, etc.)
 */
export const sendError = (
    res: Response,
    error: string,
    statusCode: number = 500,
    details?: any
): void => {
    const payload: any = {
        success: false,
        error,
    };
    if (details !== undefined) payload.details = details;

    res.status(statusCode).json(payload);
};

/**
 * Send a paginated list response.
 * @param res Express Response
 * @param items Array of items for the current page
 * @param total Total number of items across all pages
 * @param page Current page index (0-based)
 * @param size Number of items per page
 * @param message Optional message
 */
export const sendPaginated = (
    res: Response,
    items: any[],
    total: number,
    page: number,
    size: number,
    message: string = 'Success'
): void => {
    const totalPages = Math.ceil(total / size);
    const meta: PaginationMeta = {
        page,
        size,
        totalElements: total,
        totalPages,
        hasNext: page < totalPages - 1,
        hasPrev: page > 0,
    };

    sendSuccess(res, items, message, 200, meta);
};
