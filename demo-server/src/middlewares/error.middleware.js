import { fail } from '../utils/response.js';

export function notFoundHandler(req, res) {
  return fail(res, `路由不存在: ${req.method} ${req.originalUrl}`, 404, 404);
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error('[error]', err);
  const status = err.status || 500;
  return res.status(status).json({
    code: status,
    message: err.message || '服务器内部错误',
    data: null,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
