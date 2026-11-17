import imageTemplateService from '../services/image-template.service.js';
import { success, paginate } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';

class ImageTemplateController {
  /**
   * 合成记录列表
   * GET /api/image-template/list?page=&pageSize=&keyword=
   */
  async list(req, res, next) {
    try {
      const { page, pageSize } = parsePagination(req.query);
      const result = await imageTemplateService.list({
        page,
        pageSize,
        keyword: req.query.keyword,
        type: req.query.type,
      });
      return paginate(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * 合成详情（含合成配置，用于编辑）
   * GET /api/image-template/detail/:id
   */
  async detail(req, res, next) {
    try {
      const data = await imageTemplateService.detail(req.params.id);
      return success(res, data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * 新增 / 更新合成记录
   * POST /api/image-template/save
   * body: { id?, name, width, height, quality, config, preview(Base64) }
   */
  async save(req, res, next) {
    try {
      const data = await imageTemplateService.save(req.body || {}, req.userId ? String(req.userId) : '');
      return success(res, data, '保存成功');
    } catch (err) {
      next(err);
    }
  }

  /**
   * 一键复制合成记录
   * POST /api/image-template/copy/:id
   */
  async copy(req, res, next) {
    try {
      const data = await imageTemplateService.copy(req.params.id, req.userId ? String(req.userId) : '');
      return success(res, data, '复制成功');
    } catch (err) {
      next(err);
    }
  }

  /**
   * 删除合成记录（同时删除预览图）
   * DELETE /api/image-template/delete/:id
   */
  async remove(req, res, next) {
    try {
      await imageTemplateService.remove(req.params.id);
      return success(res, null, '删除成功');
    } catch (err) {
      next(err);
    }
  }

  /**
   * 预览图（卡片图片 / 编辑回显）
   * GET /api/image-template/preview/:id
   */
  async preview(req, res, next) {
    try {
      const { filePath } = await imageTemplateService.getPreviewInfo(req.params.id);
      res.setHeader('Cache-Control', 'private, max-age=60');
      return res.sendFile(filePath, (err) => {
        if (err) next(err);
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new ImageTemplateController();
