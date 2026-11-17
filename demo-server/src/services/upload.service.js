import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Op } from 'sequelize';

import Upload from '../models/upload.model.js';
import { uploadConfig } from '../config/index.js';
import { formatDateTime } from '../utils/date.js';

const TMP_ROOT = path.join(uploadConfig.dir, 'tmp');
const FILE_ROOT = path.join(uploadConfig.dir, 'files');

// 指纹会参与目录名拼接，必须严格校验，避免路径穿越
const HASH_RE = /^[a-f0-9]{16,128}$/i;
// 分片总数上限，防止异常请求
const MAX_TOTAL_CHUNKS = 100000;

// 单进程内的合并互斥锁：同一个 hash 同时只允许一次合并
const mergingHashes = new Set();

function httpError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function assertHash(hash) {
  const value = String(hash || '').trim();
  if (!HASH_RE.test(value)) throw httpError('文件指纹格式不正确');
  return value.toLowerCase();
}

function safeFileName(name) {
  const base = path
    .basename(String(name || ''))
    // eslint-disable-next-line no-control-regex
    .replace(/[\\/:*?"<>|\x00-\x1f]/g, '_')
    .trim();
  if (!base || base === '.' || base === '..') return `file-${Date.now()}`;
  return base.slice(0, 200);
}

const tmpDir = (hash) => path.join(TMP_ROOT, hash);
const chunkPath = (hash, index) => path.join(tmpDir(hash), `${index}.part`);
const finalDir = (hash) => path.join(FILE_ROOT, hash);

async function listUploadedChunks(hash) {
  try {
    const files = await fsp.readdir(tmpDir(hash));
    return files
      .filter((f) => f.endsWith('.part'))
      .map((f) => parseInt(f, 10))
      .filter((n) => Number.isInteger(n) && n >= 0)
      .sort((a, b) => a - b);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function findOrCreateUpload(hash, defaults) {
  let record = await Upload.findOne({ where: { hash } });
  if (record) return record;
  try {
    record = await Upload.create({ hash, ...defaults });
  } catch (err) {
    // 并发上传时多个分片可能同时创建记录，唯一索引冲突后回查即可
    if (err.name !== 'SequelizeUniqueConstraintError') throw err;
    record = await Upload.findOne({ where: { hash } });
  }
  if (!record) throw httpError('创建上传任务失败', 500);
  return record;
}

function formatUpload(u) {
  const d = u.toJSON();
  return {
    id: d.id,
    hash: d.hash,
    fileName: d.fileName,
    fileSize: d.fileSize,
    chunkSize: d.chunkSize,
    totalChunks: d.totalChunks,
    uploadedChunks: d.uploadedChunks,
    status: d.status,
    downloadUrl: d.status === 'completed' ? `/api/upload/download/${d.id}` : '',
    creator: d.creator,
    createTime: d.created_at ? formatDateTime(d.created_at) : '',
    updateTime: d.updated_at ? formatDateTime(d.updated_at) : '',
  };
}

class UploadService {
  /**
   * 秒传 / 断点续传检查
   * - 服务端已存在相同指纹且文件完好：exists = true
   * - 否则返回已上传的分片序号，前端跳过这些分片
   */
  async check({ hash, fileName, fileSize, chunkSize }) {
    const h = assertHash(hash);
    let record = await Upload.findOne({ where: { hash: h } });

    if (record && record.status === 'completed') {
      if (record.storagePath && fs.existsSync(record.storagePath)) {
        return {
          exists: true,
          hash: h,
          uploadedChunks: [],
          upload: formatUpload(record),
        };
      }
      // 元数据还在但物理文件已丢失：清理记录，按新任务处理
      await record.destroy();
      record = null;
    }

    // 切片大小变化后旧分片无法拼装，直接清空重传
    const size = Number(chunkSize) || 0;
    if (record && size && record.chunkSize && size !== record.chunkSize) {
      await fsp.rm(tmpDir(h), { recursive: true, force: true });
      record.uploadedChunks = 0;
      record.chunkSize = size;
      await record.save();
    }

    const uploadedChunks = await listUploadedChunks(h);
    return {
      exists: false,
      hash: h,
      uploadedChunks,
      upload: record
        ? formatUpload(record)
        : {
            hash: h,
            fileName: fileName ? safeFileName(fileName) : '',
            fileSize: Number(fileSize) || 0,
            chunkSize: size,
            totalChunks: 0,
            uploadedChunks: uploadedChunks.length,
            status: 'none',
          },
    };
  }

  /**
   * 保存单个分片（请求体为 application/octet-stream 的原始字节）
   */
  async saveChunk({ hash, index, totalChunks, chunkSize, fileName, fileSize, buffer, creator }) {
    const h = assertHash(hash);
    const idx = Number(index);
    const total = Number(totalChunks);
    const size = Number(chunkSize) || 0;

    if (!Number.isInteger(idx) || idx < 0) throw httpError('分片序号不合法');
    if (!Number.isInteger(total) || total < 1 || total > MAX_TOTAL_CHUNKS) {
      throw httpError('分片总数不合法');
    }
    if (idx >= total) throw httpError('分片序号超出范围');
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      throw httpError('分片内容为空，请以 application/octet-stream 提交分片数据');
    }
    if (size && buffer.length > size) throw httpError('分片大小超过约定值');
    if (uploadConfig.maxFileSize && Number(fileSize) > uploadConfig.maxFileSize) {
      throw httpError('文件大小超过服务端限制', 413);
    }

    const record = await findOrCreateUpload(h, {
      fileName: safeFileName(fileName),
      fileSize: Number(fileSize) || 0,
      chunkSize: size,
      totalChunks: total,
      status: 'uploading',
      creator: creator || '',
    });

    if (record.status === 'completed') throw httpError('文件已上传完成，无需重复上传', 409);
    if (record.status === 'merging') throw httpError('文件正在合并中，请稍后重试', 409);

    await fsp.mkdir(tmpDir(h), { recursive: true });
    await fsp.writeFile(chunkPath(h, idx), buffer);

    const uploaded = await listUploadedChunks(h);
    // 条件更新：不覆盖正在合并/已完成的记录
    const [affected] = await Upload.update(
      {
        fileName: fileName ? safeFileName(fileName) : record.fileName,
        fileSize: Number(fileSize) || record.fileSize,
        chunkSize: size || record.chunkSize,
        totalChunks: total,
        uploadedChunks: uploaded.length,
        status: 'uploading',
      },
      { where: { id: record.id, status: { [Op.in]: ['uploading', 'failed'] } } },
    );
    if (!affected) {
      // affectedRows 为 0 有两种可能：并发请求算出了相同的分片计数（值未变化，分片其实已成功），
      // 或记录已进入合并/完成状态。以数据库中的当前状态为准。
      const latest = await Upload.findByPk(record.id, { attributes: ['status'] });
      if (!latest) throw httpError('上传任务不存在', 404);
      if (latest.status === 'completed') throw httpError('文件已上传完成，无需重复上传', 409);
      if (latest.status === 'merging') throw httpError('文件正在合并中，请稍后重试', 409);
    }

    return {
      hash: h,
      index: idx,
      uploadedChunks: uploaded.length,
      totalChunks: total,
      completed: uploaded.length === total,
    };
  }

  /**
   * 查询上传进度（断点续传）
   */
  async progress(hash) {
    const h = assertHash(hash);
    const record = await Upload.findOne({ where: { hash: h } });
    const uploadedChunks =
      record && record.status === 'completed'
        ? Array.from({ length: record.totalChunks }, (_, i) => i)
        : await listUploadedChunks(h);

    return {
      hash: h,
      status: record ? record.status : 'none',
      totalChunks: record ? record.totalChunks : 0,
      uploadedChunks,
      upload: record ? formatUpload(record) : null,
    };
  }

  /**
   * 合并分片：按序号顺序写入最终文件
   */
  async merge({ hash }) {
    const h = assertHash(hash);
    const record = await Upload.findOne({ where: { hash: h } });
    if (!record) throw httpError('上传任务不存在', 404);
    if (record.status === 'completed') return formatUpload(record);
    if (mergingHashes.has(h)) throw httpError('文件正在合并中，请稍后重试', 409);
    if (!record.totalChunks) throw httpError('上传任务缺少分片信息，无法合并');

    mergingHashes.add(h);
    try {
      const uploaded = new Set(await listUploadedChunks(h));
      const missing = [];
      for (let i = 0; i < record.totalChunks; i++) {
        if (!uploaded.has(i)) missing.push(i);
      }
      if (missing.length) {
        const preview = missing.slice(0, 10).join(',');
        throw httpError(`还有 ${missing.length} 个分片未上传（序号: ${preview}）`);
      }

      record.status = 'merging';
      await record.save();

      await fsp.mkdir(finalDir(h), { recursive: true });
      const target = path.join(finalDir(h), record.fileName);

      await pipeline(
        async function* readParts() {
          for (let i = 0; i < record.totalChunks; i++) {
            for await (const piece of fs.createReadStream(chunkPath(h, i))) {
              yield piece;
            }
          }
        },
        fs.createWriteStream(target),
      );

      const stat = await fsp.stat(target);
      record.storagePath = target;
      record.fileSize = stat.size;
      record.uploadedChunks = record.totalChunks;
      record.status = 'completed';
      await record.save();

      await fsp.rm(tmpDir(h), { recursive: true, force: true });
      return formatUpload(record);
    } catch (err) {
      if (record.status === 'merging') {
        record.status = 'uploading';
        await record.save().catch(() => {});
      }
      throw err;
    } finally {
      mergingHashes.delete(h);
    }
  }

  /**
   * 已上传文件列表
   */
  async list({ page, pageSize, keyword, status }) {
    const where = {};
    if (keyword) where.fileName = { [Op.like]: `%${keyword}%` };
    if (status) where.status = status;

    const { rows, count } = await Upload.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['id', 'DESC']],
    });
    return {
      list: rows.map(formatUpload),
      total: count,
      page,
      pageSize,
    };
  }

  /**
   * 删除上传记录及磁盘上的分片 / 合并文件
   */
  async remove(id) {
    const record = await Upload.findByPk(id);
    if (!record) throw httpError('上传记录不存在', 404);

    await fsp.rm(tmpDir(record.hash), { recursive: true, force: true });
    await fsp.rm(finalDir(record.hash), { recursive: true, force: true });
    await record.destroy();
    return true;
  }

  /**
   * 获取下载所需的元信息
   */
  async getDownloadInfo(id) {
    const record = await Upload.findByPk(id);
    if (!record) throw httpError('上传记录不存在', 404);
    if (record.status !== 'completed' || !record.storagePath) {
      throw httpError('文件尚未上传完成', 400);
    }
    if (!fs.existsSync(record.storagePath)) throw httpError('文件不存在或已被清理', 404);
    return { filePath: record.storagePath, fileName: record.fileName };
  }
}

export default new UploadService();
