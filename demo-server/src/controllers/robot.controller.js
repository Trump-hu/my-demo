import robotService from '../services/robot.service.js';
import { success, paginate } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';

class RobotController {
  async list(req, res, next) {
    try {
      const { page, pageSize } = parsePagination(req.query);
      const result = await robotService.list({
        page,
        pageSize,
        keyword: req.query.keyword,
        status: req.query.status,
      });
      return paginate(res, result);
    } catch (err) {
      next(err);
    }
  }

  async save(req, res, next) {
    try {
      const data = await robotService.save(req.body);
      return success(res, data, '保存成功');
    } catch (err) {
      next(err);
    }
  }

  async remove(req, res, next) {
    try {
      await robotService.remove(req.params.id);
      return success(res, null, '删除成功');
    } catch (err) {
      next(err);
    }
  }
}

export default new RobotController();
