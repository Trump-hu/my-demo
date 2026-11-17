import taskService from '../services/task.service.js';
import { success, paginate } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';

class TaskController {
  async list(req, res, next) {
    try {
      const { page, pageSize } = parsePagination(req.query);
      const result = await taskService.list({
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
      const data = await taskService.save(req.body);
      return success(res, data, '保存成功');
    } catch (err) {
      next(err);
    }
  }

  async remove(req, res, next) {
    try {
      await taskService.remove(req.params.id);
      return success(res, null, '删除成功');
    } catch (err) {
      next(err);
    }
  }

  async start(req, res, next) {
    try {
      await taskService.start(req.params.id);
      return success(res, null, '任务已启动');
    } catch (err) {
      next(err);
    }
  }

  async stop(req, res, next) {
    try {
      await taskService.stop(req.params.id);
      return success(res, null, '任务已停止');
    } catch (err) {
      next(err);
    }
  }
}

export default new TaskController();
