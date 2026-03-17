import { Request, Response, NextFunction } from 'express';
import logger from '../services/logger';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);

    // Filter sensitive info from production logs but keep enough for debugging
    logger.error(`${req.method} ${req.url} - Status ${statusCode} - ${err.message}`, {
        ip: req.ip,
        method: req.method,
        url: req.url,
        statusCode,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
        details: err.details || null
    });

    // Provide generic message for 500 errors to avoid leaking implementation details
    let message = err.message;
    if (statusCode === 500 && process.env.NODE_ENV === 'production') {
        message = 'Internal Server Error';
    }

    res.status(statusCode).json({
        error: message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
        ...(err.details && { details: err.details })
    });
};
