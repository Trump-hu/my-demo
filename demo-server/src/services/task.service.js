import { Op } from 'sequelize';
import Task from '../models/task.model.js';
import { formatDateTime } from '../utils/date.js';

function formatTask(t) {
  const d = t.toJSON();
  return {
    id: d.id,
    name: d.name,
    processName: d.processName,
    robotName: d.robotName,
    status: d.status,
    priority: d.priority,
    triggerType: d.triggerType,
    cron: d.cron,
    startTime: d.startTime ? formatDateTime(d.startTime) : null,
    endTime: d.endTime ? formatDateTime(d.endTime) : null,
    duration: d.duration,
    creator: d.creator,
    createTime: d.createdAt ? formatDateTime(d.createdAt) : '',
  };
}

class TaskService {
  async list({ page, pageSize, keyword, status }) {
    const where = {};
    if (keyword) {
      where.name = { [Op.like]: `%${keyword}%` };
    }
    if (status) where.status = status;

    const { rows, count } = await Task.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['id', 'DESC']],
    });
    return {
      list: rows.map(formatTask),
      total: count,
      page,
      pageSize,
    };
  }

  async save(data) {
    if (data.id) {
      const t = await Task.findByPk(data.id);
      if (!t) {
        const err = new Error('任务不存在');
        err.status = 404;
        throw err;
      }
      const patch = {};
      ['name', 'processName', 'robotName', 'status', 'priority', 'triggerType', 'cron'].forEach((k) => {
        if (data[k] !== undefined) patch[k] = data[k];
      });
      await t.update(patch);
      return formatTask(t);
    }
    const t = await Task.create({
      name: data.name,
      processName: data.processName || '',
      robotName: data.robotName || '',
      status: 'pending',
      priority: data.priority || 'medium',
      triggerType: data.triggerType || 'manual',
      cron: data.cron || '',
      creator: data.creator || '当前用户',
    });
    return formatTask(t);
  }

  async remove(id) {
    const t = await Task.findByPk(id);
    if (!t) {
      const err = new Error('任务不存在');
      err.status = 404;
      throw err;
    }
    await t.destroy();
    return true;
  }

  async start(id) {
    const t = await Task.findByPk(id);
    if (!t) {
      const err = new Error('任务不存在');
      err.status = 404;
      throw err;
    }
    await t.update({ status: 'running', startTime: new Date(), endTime: null });
    return formatTask(t);
  }

  async stop(id) {
    const t = await Task.findByPk(id);
    if (!t) {
      const err = new Error('任务不存在');
      err.status = 404;
      throw err;
    }
    await t.update({ status: 'stopped', endTime: new Date() });
    return formatTask(t);
  }
}

export default new TaskService();
