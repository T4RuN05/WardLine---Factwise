import { DomainError } from '../domain/errors.js';
import { env } from '../config/env.js';

export function sendSuccess(res, data, status = 200) {
  return res.status(status).json({
    data,
    requestId: res.req?.id || `req_${Date.now()}`,
  });
}

export function errorHandler(err, req, res, next) {
  const reqId = req.id || `req_${Date.now()}`;

  // Log error in development/production if not test
  if (env.NODE_ENV !== 'test') {
    console.error(`[Error] [${reqId}] ${err.name || 'Error'}:`, err.message || err);
  }

  // 1. DomainError
  if (err instanceof DomainError) {
    return res.status(err.status || 400).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details || {},
      },
      requestId: reqId,
    });
  }

  // 2. Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: {
        code: 'INVALID_ID',
        message: `Invalid identifier format for ${err.path}: ${err.value}`,
      },
      requestId: reqId,
    });
  }

  // 3. Mongoose Duplicate Key (code 11000)
  if (err.code === 11000) {
    const keyPattern = err.keyPattern || {};
    let code = 'DUPLICATE_KEY';
    let message = 'A duplicate entry already exists.';

    if (keyPattern.patientId && keyPattern.date) {
      code = 'DUPLICATE_RECORD';
      message = 'An active record already exists for this patient today.';
    } else if (keyPattern.number) {
      code = 'ROOM_OCCUPIED';
      message = 'Room number must be unique.';
    } else if (keyPattern.mrn) {
      code = 'DUPLICATE_MRN';
      message = 'A patient with this MRN already exists.';
    }

    return res.status(409).json({
      error: { code, message, details: err.keyValue || {} },
      requestId: reqId,
    });
  }

  // 3. Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const details = {};
    for (const field of Object.keys(err.errors || {})) {
      details[field] = err.errors[field].message;
    }
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data.',
        details,
      },
      requestId: reqId,
    });
  }

  // 4. Default 500 Internal Error
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected server error occurred. Please try again.',
    },
    requestId: reqId,
  });
}
