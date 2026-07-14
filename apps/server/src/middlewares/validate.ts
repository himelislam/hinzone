import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodTypeAny } from 'zod';

export interface ValidationSchemas {
  readonly body?: ZodTypeAny;
  readonly query?: ZodTypeAny;
  readonly params?: ZodTypeAny;
  readonly headers?: ZodTypeAny;
}

export const validate = (schemas: ValidationSchemas): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body) as unknown;
      }

      // ZodTypeAny erases the schema's specific output type, so Zod's .parse() return type
      // is inherently `any` here, while Express types req.query/req.params as ParsedQs and
      // ParamsDictionary rather than `any`. That boundary can't be made fully type-safe without
      // parametrizing every route's Request<> generics individually against z.infer<>.
      //
      // Express 5 also defines req.query as a getter with no setter (computed live from the raw
      // URL), so a plain `req.query = ...` assignment throws at runtime; the property must be
      // redefined instead.
      if (schemas.query) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const parsedQuery = schemas.query.parse(req.query);
        Object.defineProperty(req, 'query', {
          value: parsedQuery,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }

      if (schemas.params) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        req.params = schemas.params.parse(req.params);
      }

      if (schemas.headers) {
        schemas.headers.parse(req.headers);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
