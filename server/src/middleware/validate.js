import { DomainError, ErrorCodes } from '../domain/errors.js';

export function validate({ body, query, params }) {
  return (req, res, next) => {
    try {
      if (body) {
        req.body = body.parse(req.body);
      }
      if (query) {
        req.query = query.parse(req.query);
      }
      if (params) {
        req.params = params.parse(req.params);
      }
      next();
    } catch (err) {
      if (err.errors) {
        const fieldErrors = {};
        for (const issue of err.errors) {
          const path = issue.path.join('.') || 'root';
          fieldErrors[path] = issue.message;
        }
        return next(
          new DomainError(
            ErrorCodes.INVALID_STATE,
            'Request validation failed.',
            400,
            { fields: fieldErrors }
          )
        );
      }
      next(err);
    }
  };
}
