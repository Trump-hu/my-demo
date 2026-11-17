import { verifyToken } from '../utils/jwt.js';
import { fail } from '../utils/response.js';

/**
 * 校验 JWT 的中间件
 * 用法：router.get('/profile', auth(), userController.profile)
 */
export function auth() {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return fail(res, '未提供认证令牌', 401, 401);
    }
    try {
      const decoded = verifyToken(token);
      req.userId = decoded.id;
      req.userRole = decoded.role;
      next();
    } catch (err) {
      return fail(res, '认证令牌无效或已过期', 401, 401);
    }
  };
}

/**
 * 角色校验中间件
 * 用法：router.delete('/:id', auth(), requireRole('admin'), userController.remove)
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return fail(res, '权限不足', 403, 403);
    }
    next();
  };
}
