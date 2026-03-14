import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    // Log the full error for server-side debugging
    console.error(`[ERROR] ${req.method} ${req.url}:`, {
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
        details: err.details || null
    });

    const statusCode = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);

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
