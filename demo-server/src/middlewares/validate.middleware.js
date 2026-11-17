import { validationResult } from 'express-validator';
import { fail } from '../utils/response.js';

/**
 * 配合 express-validator 使用的校验中间件
 * 用法：
 *   router.post('/', body('username').notEmpty(), validate, controller.create)
 */
export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, '参数校验失败', 422, 422, { errors: errors.array() });
  }
  next();
}
