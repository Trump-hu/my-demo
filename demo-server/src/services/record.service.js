import { Op } from 'sequelize';
import Record from '../models/record.model.js';
import { formatDateTime } from '../utils/date.js';

function formatRecord(r) {
  const d = r.toJSON();
  return {
    id: d.id,
    taskName: d.taskName,
    processName: d.processName,
    robotName: d.robotName,
    status: d.status,
    startTime: d.startTime ? formatDateTime(d.startTime) : null,
    endTime: d.endTime ? formatDateTime(d.endTime) : null,
    duration: d.duration,
    logCount: d.logCount,
    errorMsg: d.errorMsg,
    operator: d.operator,
  };
}

class RecordService {
  async list({ page, pageSize, keyword, status, dateRange }) {
    const where = {};
    if (keyword) {
      where[Op.or] = [
        { taskName: { [Op.like]: `%${keyword}%` } },
        { processName: { [Op.like]: `%${keyword}%` } },
      ];
    }
    if (status) where.status = status;
    if (dateRange && dateRange.length === 2) {
      where.startTime = { [Op.between]: [new Date(dateRange[0]), new Date(dateRange[1])] };
    }

    const { rows, count } = await Record.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['id', 'DESC']],
    });
    return {
      list: rows.map(formatRecord),
      total: count,
      page,
      pageSize,
    };
  }
}

export default new RecordService();
