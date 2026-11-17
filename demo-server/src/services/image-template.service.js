import fsp from 'node:fs/promises';
import path from 'node:path';
import { Op } from 'sequelize';

import ImageTemplate from '../models/image-template.model.js';
import User from '../models/user.model.js';
import { uploadConfig } from '../config/index.js';
import { formatDateTime } from '../utils/date.js';

// 预览图与配置都通过 JSON 提交（dataURL / JSON 字符串），限制单次体积
const PREVIEW_RE = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=\s]+)$/;
const MAX_PREVIEW_BYTES = 8 * 1024 * 1024;
const MAX_CONFIG_LENGTH = 20 * 1024 * 1024;
const MIN_SIZE = 100;
const MAX_SIZE = 5000;

// 图片类型可选值（前端下拉与此保持一致）
export const IMAGE_TYPES = ['图片', '草稿', '海报', '图标', '其他'];
const DEFAULT_TYPE = '图片';

const rootDir = () => path.join(uploadConfig.dir, 'image-templates');
const templateDir = (id) => path.join(rootDir(), String(id));

function httpError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function parsePreview(dataUrl) {
  const m = PREVIEW_RE.exec(String(dataUrl || '').trim());
  if (!m) throw httpError('预览图格式不正确');
  const buffer = Buffer.from(m[2], 'base64');
  if (!buffer.length) throw httpError('预览图内容为空');
  if (buffer.length > MAX_PREVIEW_BYTES) throw httpError('预览图过大', 413);
  return { ext: m[1] === 'png' ? '.png' : '.jpg', buffer };
}

async function writePreview(id, dataUrl) {
  const { ext, buffer } = parsePreview(dataUrl);
  const dir = templateDir(id);
  await fsp.mkdir(dir, { recursive: true });
  // 扩展名可能在 png/jpg 之间变化，先清理旧文件
  const existing = await fsp.readdir(dir).catch(() => []);
  await Promise.all(
    existing
      .filter((f) => f.startsWith('preview.'))
      .map((f) => fsp.rm(path.join(dir, f), { force: true })),
  );
  const filePath = path.join(dir, `preview${ext}`);
  await fsp.writeFile(filePath, buffer);
  return { path: filePath, size: buffer.length };
}

function normalizePayload(data) {
  const name = String(data.name || '').trim();
  if (!name) throw httpError('名称不能为空');
  if (name.length > 128) throw httpError('名称不能超过 128 个字符');

  const type = String(data.type || '').trim() || DEFAULT_TYPE;
  if (!IMAGE_TYPES.includes(type)) {
    throw httpError(`图片类型仅支持：${IMAGE_TYPES.join('、')}`);
  }

  const width = Number(data.width);
  const height = Number(data.height);
  if (!Number.isInteger(width) || width < MIN_SIZE || width > MAX_SIZE) {
    throw httpError(`宽度需在 ${MIN_SIZE}~${MAX_SIZE} 之间`);
  }
  if (!Number.isInteger(height) || height < MIN_SIZE || height > MAX_SIZE) {
    throw httpError(`高度需在 ${MIN_SIZE}~${MAX_SIZE} 之间`);
  }

  const quality = Number(data.quality);
  if (!Number.isInteger(quality) || quality < 1 || quality > 100) {
    throw httpError('质量需在 1~100 之间');
  }

  let config = data.config;
  if (typeof config === 'string') {
    try {
      config = JSON.parse(config);
    } catch {
      throw httpError('合成配置不是合法的 JSON');
    }
  }
  if (!config || typeof config !== 'object' || Array.isArray(config)) config = {};
  const configText = JSON.stringify(config);
  if (configText.length > MAX_CONFIG_LENGTH) throw httpError('合成配置过大', 413);

  return { name, type, width, height, quality, configText };
}

// 批量解析创建人/更新人 ID 对应的用户名（优先昵称）
async function loadUserMap(records) {
  const ids = [...new Set(records.flatMap((r) => [r.creator, r.updater]).filter(Boolean))];
  if (!ids.length) return new Map();
  const users = await User.findAll({ where: { id: ids }, attributes: ['id', 'username', 'nickname'] });
  return new Map(users.map((u) => [String(u.id), u.nickname || u.username]));
}

function formatTemplate(t, { withConfig = false, userMap = new Map() } = {}) {
  const d = t.toJSON();
  // console.log('formatTemplate d:', d);
  const out = {
    id: d.id,
    name: d.name,
    type: d.type || DEFAULT_TYPE,
    width: d.width,
    height: d.height,
    quality: d.quality,
    fileSize: d.fileSize,
    hasPreview: !!d.previewPath,
    creator: d.creator,
    image: d.config ? JSON.parse(d.config)?.base : null, // 合成配置中可能没有 image 字段
    creatorName: userMap.get(String(d.creator)) || d.creator || '—',
    updater: d.updater,
    updaterName: userMap.get(String(d.updater)) || d.updater || '—',
    createTime: d.created_at ? formatDateTime(d.created_at) : '',
    updateTime: d.updated_at ? formatDateTime(d.updated_at) : '',
  };
  if (withConfig) {
    try {
      out.config = d.config ? JSON.parse(d.config) : {};
    } catch {
      out.config = {};
    }
  }
  return out;
}

class ImageTemplateService {
  async list({ page, pageSize, keyword, type }) {
    const where = {};
    if (keyword) where.name = { [Op.like]: `%${keyword}%` };
    if (type) where.type = type;

    const { rows, count } = await ImageTemplate.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['id', 'DESC']],
    });
    const userMap = await loadUserMap(rows);
    return {
      list: rows.map((r) => formatTemplate(r, { userMap })),
      total: count,
      page,
      pageSize,
    };
  }

  async detail(id) {
    const record = await ImageTemplate.findByPk(id);
    if (!record) throw httpError('合成记录不存在', 404);
    const userMap = await loadUserMap([record]);
    return formatTemplate(record, { withConfig: true, userMap });
  }

  async save(data, operator) {
    const { name, type, width, height, quality, configText } = normalizePayload(data);
    const isUpdate = !!data.id;
    const userId = operator || '';

    let record;
    if (isUpdate) {
      record = await ImageTemplate.findByPk(data.id);
      if (!record) throw httpError('合成记录不存在', 404);
      await record.update({ name, type, width, height, quality, config: configText, updater: userId });
    } else {
      if (!data.preview) throw httpError('缺少合成预览图');
      record = await ImageTemplate.create({
        name,
        type,
        width,
        height,
        quality,
        config: configText,
        creator: userId,
        updater: userId,
        previewPath: '',
        fileSize: 0,
      });
    }

    if (data.preview) {
      const written = await writePreview(record.id, data.preview);
      await record.update({ previewPath: written.path, fileSize: written.size });
    } else if (!record.previewPath) {
      throw httpError('缺少合成预览图');
    }

    const userMap = await loadUserMap([record]);
    return formatTemplate(record, { withConfig: true, userMap });
  }

  async remove(id) {
    const record = await ImageTemplate.findByPk(id);
    if (!record) throw httpError('合成记录不存在', 404);
    await fsp.rm(templateDir(record.id), { recursive: true, force: true });
    await record.destroy();
    return true;
  }

  /**
   * 一键复制：复制配置与预览图，生成一条新记录
   */
  async copy(id, operator) {
    const source = await ImageTemplate.findByPk(id);
    if (!source) throw httpError('合成记录不存在', 404);
    if (!source.previewPath) throw httpError('原记录缺少预览图，无法复制', 400);
    try {
      await fsp.access(source.previewPath);
    } catch {
      throw httpError('原记录预览图文件不存在或已被清理', 404);
    }

    const userId = operator || '';
    const name = `${source.name}-副本`.slice(0, 128);
    const target = await ImageTemplate.create({
      name,
      type: source.type || DEFAULT_TYPE,
      width: source.width,
      height: source.height,
      quality: source.quality,
      config: source.config,
      creator: userId || source.creator || '',
      updater: userId || source.creator || '',
      previewPath: '',
      fileSize: 0,
    });

    const ext = path.extname(source.previewPath) || '.jpg';
    const filePath = path.join(templateDir(target.id), `preview${ext}`);
    await fsp.mkdir(templateDir(target.id), { recursive: true });
    await fsp.copyFile(source.previewPath, filePath);
    const stat = await fsp.stat(filePath);
    await target.update({ previewPath: filePath, fileSize: stat.size });

    const userMap = await loadUserMap([target]);
    return formatTemplate(target, { withConfig: true, userMap });
  }

  async getPreviewInfo(id) {
    const record = await ImageTemplate.findByPk(id);
    if (!record) throw httpError('合成记录不存在', 404);
    if (!record.previewPath) throw httpError('该记录还没有合成预览图', 404);
    try {
      await fsp.access(record.previewPath);
    } catch {
      throw httpError('预览图文件不存在或已被清理', 404);
    }
    return { filePath: record.previewPath, name: `${record.name}${path.extname(record.previewPath) || '.jpg'}` };
  }
}

export default new ImageTemplateService();
