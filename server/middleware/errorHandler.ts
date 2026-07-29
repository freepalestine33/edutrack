import type { Request, Response, NextFunction } from 'express'

/**
 * Global error‑handling middleware.
 * Catches unhandled throws from async route handlers and returns a
 * consistent JSON error response instead of crashing the process.
 *
 * Must be registered AFTER all route handlers:
 *   app.use(globalErrorHandler)
 */
export function globalErrorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error('Unhandled error:', err)
  const status = (err as any).statusCode ?? 500
  res.status(status).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error',
  })
}
