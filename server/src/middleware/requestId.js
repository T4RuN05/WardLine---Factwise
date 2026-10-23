export function requestId(req, res, next) {
  const id =
    req.headers['x-request-id'] ||
    `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
}
