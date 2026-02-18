import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })
      // Merge validated values back
      if (validated.body !== undefined) req.body = validated.body
      if (validated.query !== undefined) (req as Request & { query: unknown }).query = validated.query
      if (validated.params !== undefined) req.params = validated.params
      next()
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: err.errors.map(e => ({
            field: e.path.filter(p => p !== 'body' && p !== 'query' && p !== 'params').join('.'),
            message: e.message,
          })),
        })
      } else {
        next(err)
      }
    }
  }
}
