import { Op } from 'sequelize';
import Robot from '../models/robot.model.js';
import { formatDateTime } from '../utils/date.js';

function formatRobot(r) {
  const d = r.toJSON();
  return {
    id: d.id,
    code: d.code,
    name: d.name,
    ip: d.ip,
    os: d.os,
    status: d.status,
    cpu: d.cpu,
    memory: d.memory,
    disk: d.disk,
    processCount: d.processCount,
    lastHeartbeat: d.lastHeartbeat ? formatDateTime(d.lastHeartbeat) : '',
    createTime: d.createdAt ? formatDateTime(d.createdAt) : '',
    location: d.location,
  };
}

class RobotService {
  async list({ page, pageSize, keyword, status }) {
    const where = {};
    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { code: { [Op.like]: `%${keyword}%` } },
        { ip: { [Op.like]: `%${keyword}%` } },
      ];
    }
    if (status) where.status = status;

    const { rows, count } = await Robot.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['id', 'DESC']],
    });
    return {
      list: rows.map(formatRobot),
      total: count,
      page,
      pageSize,
    };
  }

  async save(data) {
    if (data.id) {
      const r = await Robot.findByPk(data.id);
      if (!r) {
        const err = new Error('机器人不存在');
        err.status = 404;
        throw err;
      }
      const patch = {};
      ['name', 'ip', 'os', 'status', 'cpu', 'memory', 'disk', 'processCount', 'location'].forEach((k) => {
        if (data[k] !== undefined) patch[k] = data[k];
      });
      patch.lastHeartbeat = new Date();
      await r.update(patch);
      return formatRobot(r);
    }
    const count = await Robot.count();
    const code = `BOT-${String(count + 1).padStart(4, '0')}`;
    const r = await Robot.create({
      code,
      name: data.name,
      ip: data.ip || '',
      os: data.os || '',
      status: data.status || 'offline',
      cpu: 0,
      memory: 0,
      disk: 0,
      processCount: 0,
      lastHeartbeat: new Date(),
      location: data.location || '',
    });
    return formatRobot(r);
  }

  async remove(id) {
    const r = await Robot.findByPk(id);
    if (!r) {
      const err = new Error('机器人不存在');
      err.status = 404;
      throw err;
    }
    await r.destroy();
    return true;
  }
}

export default new RobotService();
