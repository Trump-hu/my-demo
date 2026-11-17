import processService from '../services/process.service.js';
import { success, paginate } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';

class ProcessController {
  async list(req, res, next) {
    try {
      const { page, pageSize } = parsePagination(req.query);
      const result = await processService.list({
        page,
        pageSize,
        keyword: req.query.keyword,
        category: req.query.category,
        status: req.query.status,
      });
      return paginate(res, result);
    } catch (err) {
      next(err);
    }
  }

  async detail(req, res, next) {
    try {
      const data = await processService.detail(req.params.id);
      return success(res, data);
    } catch (err) {
      next(err);
    }
  }

  async save(req, res, next) {
    try {
      const data = await processService.save(req.body);
      return success(res, data, '保存成功');
    } catch (err) {
      next(err);
    }
  }

  async remove(req, res, next) {
    try {
      await processService.remove(req.params.id);
      return success(res, null, '删除成功');
    } catch (err) {
      next(err);
    }
  }

  async monitor(req, res, next) {
    try {
      const data = await processService.getMonitor(req.params.id);
      return success(res, data);
    } catch (err) {
      next(err);
    }
  }

  async efficiency(req, res, next) {
    try {
      const data = await processService.getEfficiency(req.params.id, req.query.range);
      return success(res, data);
    } catch (err) {
      next(err);
    }
  }
}

export default new ProcessController();
