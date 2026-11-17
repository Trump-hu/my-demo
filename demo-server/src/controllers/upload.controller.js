import uploadService from '../services/upload.service.js';
import { success, paginate } from '../utils/response.js';
import { parsePagination } from '../utils/pagination.js';

class UploadController {
  /**
   * 秒传 / 断点续传检查
   * POST /api/upload/check
   * body: { hash, fileName, fileSize, chunkSize }
   */
  async check(req, res, next) {
    try {
      const { hash, fileName, fileSize, chunkSize } = req.body || {};
      const data = await uploadService.check({ hash, fileName, fileSize, chunkSize });
      return success(res, data, data.exists ? '文件已存在，可秒传' : '需要上传');
    } catch (err) {
      next(err);
    }
  }

  /**
   * 上传单个分片
   * POST /api/upload/chunk?hash=&index=&totalChunks=&chunkSize=&fileName=&fileSize=
   * body: application/octet-stream 原始分片字节
   */
  async chunk(req, res, next) {
    try {
      const data = await uploadService.saveChunk({
        hash: req.query.hash,
        index: req.query.index,
        totalChunks: req.query.totalChunks,
        chunkSize: req.query.chunkSize,
        fileName: req.query.fileName,
        fileSize: req.query.fileSize,
        buffer: req.body,
        creator: req.userId ? String(req.userId) : '',
      });
      return success(res, data, '分片上传成功');
    } catch (err) {
      next(err);
    }
  }

  /**
   * 查询上传进度（断点续传）
   * GET /api/upload/progress?hash=
   */
  async progress(req, res, next) {
    try {
      const data = await uploadService.progress(req.query.hash);
      return success(res, data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * 合并分片
   * POST /api/upload/merge
   * body: { hash }
   */
  async merge(req, res, next) {
    try {
      const data = await uploadService.merge({ hash: (req.body || {}).hash });
      return success(res, data, '合并成功');
    } catch (err) {
      next(err);
    }
  }

  /**
   * 上传记录列表
   * GET /api/upload/list?page=&pageSize=&keyword=&status=
   */
  async list(req, res, next) {
    try {
      const { page, pageSize } = parsePagination(req.query);
      const result = await uploadService.list({
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

  /**
   * 删除上传记录（同时清理磁盘文件）
   * DELETE /api/upload/delete/:id
   */
  async remove(req, res, next) {
    try {
      await uploadService.remove(req.params.id);
      return success(res, null, '删除成功');
    } catch (err) {
      next(err);
    }
  }

  /**
   * 下载已合并完成的文件
   * GET /api/upload/download/:id
   */
  async download(req, res, next) {
    try {
      const { filePath, fileName } = await uploadService.getDownloadInfo(req.params.id);
      return res.download(filePath, fileName, (err) => {
        if (err) next(err);
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new UploadController();
