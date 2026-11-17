import { Op } from 'sequelize';
import Process from '../models/process.model.js';
import { formatDateTime } from '../utils/date.js';

// 将数据库记录格式化为前端期望的字段
function formatProcess(p) {
  const d = p.toJSON();
  return {
    id: d.id,
    code: d.code,
    name: d.name,
    category: d.category,
    status: d.status,
    version: d.version,
    robotCount: d.robotCount,
    runCount: d.runCount,
    successRate: d.successRate,
    creator: d.creator,
    description: d.description,
    createTime: d.createdAt ? formatDateTime(d.createdAt) : '',
    updateTime: d.updatedAt ? formatDateTime(d.updatedAt) : '',
  };
}

class ProcessService {
  async list({ page, pageSize, keyword, category, status }) {
    const where = {};
    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { code: { [Op.like]: `%${keyword}%` } },
      ];
    }
    if (category) where.category = category;
    if (status) where.status = status;

    const { rows, count } = await Process.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['id', 'DESC']],
    });
    return {
      list: rows.map(formatProcess),
      total: count,
      page,
      pageSize,
    };
  }

  async detail(id) {
    const p = await Process.findByPk(id);
    if (!p) return null;
    return formatProcess(p);
  }

  async save(data) {
    if (data.id) {
      const p = await Process.findByPk(data.id);
      if (!p) {
        const err = new Error('流程不存在');
        err.status = 404;
        throw err;
      }
      const patch = {};
      ['name', 'category', 'status', 'version', 'robotCount', 'description'].forEach((k) => {
        if (data[k] !== undefined) patch[k] = data[k];
      });
      await p.update(patch);
      return formatProcess(p);
    }
    // 新增
    const count = await Process.count();
    const code = `FLOW-${String(count + 1).padStart(4, '0')}`;
    const p = await Process.create({
      code,
      name: data.name,
      category: data.category || '',
      status: data.status || 'draft',
      version: data.version || 'v1.0.0',
      robotCount: data.robotCount || 0,
      runCount: 0,
      successRate: 100,
      creator: data.creator || '当前用户',
      description: data.description || '',
    });
    return formatProcess(p);
  }

  async remove(id) {
    const p = await Process.findByPk(id);
    if (!p) {
      const err = new Error('流程不存在');
      err.status = 404;
      throw err;
    }
    await p.destroy();
    return true;
  }

  // 流程实时监控
  async getMonitor(id) {
    const p = await Process.findByPk(id);
    if (!p) return null;
    const item = formatProcess(p);

    const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const runningInstances = Array.from({ length: randomInt(0, 5) }, (_, i) => ({
      instanceId: `INS-${Date.now()}-${i}`,
      robotName: `机器人节点 ${randomInt(1, 38)}`,
      status: randomPick(['running', 'running', 'running', 'starting', 'queued']),
      progress: randomInt(10, 95),
      currentStep: randomInt(1, 10),
      totalSteps: randomInt(8, 20),
      startTime: formatDateTime(Date.now() - randomInt(1, 30) * 60000),
      elapsed: randomInt(60, 1800),
      cpu: randomInt(10, 60),
      memory: randomInt(20, 70),
      log: `正在执行步骤 ${randomInt(1, 10)}：${randomPick(['打开页面', '提取数据', '写入数据库', '发送请求', '解析文件'])}`,
    }));

    return {
      processId: item.id,
      processName: item.name,
      processCode: item.code,
      status: item.status,
      version: item.version,
      runningCount: runningInstances.length,
      todayRunCount: randomInt(5, 50),
      todaySuccessCount: randomInt(3, 45),
      todayFailCount: randomInt(0, 8),
      avgDuration: randomInt(120, 1800),
      avgCpu: randomInt(15, 50),
      avgMemory: randomInt(30, 60),
      instances: runningInstances,
      updateTime: formatDateTime(Date.now()),
    };
  }

  // 流程效能分析
  async getEfficiency(id, range = '7d') {
    const p = await Process.findByPk(id);
    if (!p) return null;
    const item = formatProcess(p);

    const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;

    const trendData = Array.from({ length: days }, (_, i) => {
      const date = new Date(Date.now() - (days - 1 - i) * 86400000);
      const pad = (n) => String(n).padStart(2, '0');
      return {
        date: `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
        success: randomInt(5, 40),
        failed: randomInt(0, 8),
        running: randomInt(0, 5),
      };
    });

    const durationData = Array.from({ length: days }, () => ({
      avg: randomInt(120, 600),
      max: randomInt(600, 1800),
      min: randomInt(60, 200),
    }));

    const hourlyDist = Array.from({ length: 24 }, (_, h) => {
      const base = h >= 9 && h <= 18 ? 15 : h >= 19 && h <= 22 ? 8 : 2;
      return randomInt(base, base + 15);
    });

    const stepPerformance = Array.from({ length: randomInt(6, 12) }, (_, i) => ({
      step: `步骤${i + 1}`,
      stepName: randomPick(['打开页面', '点击元素', '输入文本', '等待加载', '数据提取', '条件判断', '写入数据库', '发送请求']),
      avgDuration: randomInt(5, 120),
      runCount: randomInt(50, 500),
      failCount: randomInt(0, 20),
    }));

    const successRateTrend = trendData.map((d) => {
      const total = d.success + d.failed;
      return total > 0 ? Math.round((d.success / total) * 1000) / 10 : 100;
    });

    return {
      processId: item.id,
      processName: item.name,
      range,
      trendData,
      durationData,
      hourlyDist,
      stepPerformance,
      successRateTrend,
      totalRun: randomInt(500, 5000),
      totalSuccess: randomInt(450, 4900),
      totalFailed: randomInt(10, 200),
      avgSuccessRate: randomInt(88, 99),
      avgDuration: randomInt(180, 600),
      maxDuration: randomInt(800, 1800),
      minDuration: randomInt(60, 180),
      robotDist: Array.from({ length: 5 }, (_, i) => ({
        robotName: `机器人节点 ${i + 1}`,
        runCount: randomInt(50, 300),
        successRate: randomInt(85, 100),
      })),
    };
  }
}

export default new ProcessService();
