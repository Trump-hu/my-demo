import recordService from '../services/record.service.js';
import { paginate } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';

class RecordController {
  async list(req, res, next) {
    try {
      const { page, pageSize } = parsePagination(req.query);
      // dateRange 前端传逗号分隔字符串
      let dateRange = null;
      if (req.query.dateRange) {
        dateRange = Array.isArray(req.query.dateRange)
          ? req.query.dateRange
          : req.query.dateRange.split(',');
      }
      const result = await recordService.list({
        page,
        pageSize,
        keyword: req.query.keyword,
        status: req.query.status,
        dateRange,
      });
      return paginate(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export default new RecordController();
