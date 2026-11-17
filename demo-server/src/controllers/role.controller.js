import roleService from '../services/role.service.js';
import { success, paginate } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';

class RoleController {
  async list(req, res, next) {
    try {
      const { page, pageSize } = parsePagination(req.query);
      const result = await roleService.list({
        page,
        pageSize,
        keyword: req.query.keyword,
      });
      return paginate(res, result);
    } catch (err) {
      next(err);
    }
  }

  async options(req, res, next) {
    try {
      const data = await roleService.options();
      return success(res, data);
    } catch (err) {
      next(err);
    }
  }

  async save(req, res, next) {
    try {
      const data = await roleService.save(req.body);
      return success(res, data, '保存成功');
    } catch (err) {
      next(err);
    }
  }

  async remove(req, res, next) {
    try {
      await roleService.remove(req.params.id);
      return success(res, null, '删除成功');
    } catch (err) {
      next(err);
    }
  }

  async permissionTree(req, res, next) {
    try {
      const data = roleService.getPermissionTree();
      return success(res, data);
    } catch (err) {
      next(err);
    }
  }
}

export default new RoleController();
