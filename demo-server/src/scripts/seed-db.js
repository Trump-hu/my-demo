/**
 * 种子数据脚本
 * 用法: npm run db:seed
 * 说明: 插入测试账号及各业务模块的示例数据
 */
import User from '../models/user.model.js';
import Process from '../models/process.model.js';
import Robot from '../models/robot.model.js';
import Task from '../models/task.model.js';
import Record from '../models/record.model.js';
import Role from '../models/role.model.js';
import { hashPassword } from '../utils/password.js';
import { formatDateTime } from '../utils/date.js';
import sequelize from '../models/index.js';

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function seedUsers() {
  const adminExists = await User.findOne({ where: { username: 'admin' } });
  if (!adminExists) {
    await User.create({
      username: 'admin',
      password: hashPassword('admin123'),
      nickname: '管理员',
      email: 'admin@rpa.com',
      phone: '13800138000',
      avatar: '',
      dept: '技术部',
      role: 'admin',
      status: 1,
      lastLogin: new Date(),
    });
    console.log('[seed] 已创建管理员账号: admin / admin123');
  }
  const demoExists = await User.findOne({ where: { username: 'demo' } });
  if (!demoExists) {
    await User.create({
      username: 'demo',
      password: hashPassword('123456'),
      nickname: '示例用户',
      email: 'demo@rpa.com',
      phone: '13900139000',
      avatar: '',
      dept: '运营部',
      role: '操作员',
      status: 1,
      lastLogin: null,
    });
    console.log('[seed] 已创建普通账号: demo / 123456');
  }
}

async function seedRoles() {
  if (await Role.count() > 0) return;
  const roles = [
    { name: '超级管理员', code: 'super_admin', sort: 1, status: 1, remark: '拥有系统全部权限', userCount: 2 },
    { name: '流程管理员', code: 'process_admin', sort: 2, status: 1, remark: '管理流程、机器人和任务', userCount: 8 },
    { name: '操作员', code: 'operator', sort: 3, status: 1, remark: '可执行任务和查看运行记录', userCount: 25 },
    { name: '查看者', code: 'viewer', sort: 4, status: 1, remark: '仅可查看各模块数据', userCount: 15 },
    { name: '审计员', code: 'auditor', sort: 5, status: 0, remark: '查看日志和审计记录', userCount: 3 },
  ];
  await Role.bulkCreate(roles);
  console.log('[seed] 已创建角色数据');
}

async function seedProcesses() {
  if (await Process.count() > 0) return;
  const list = Array.from({ length: 47 }, (_, i) => ({
    code: `FLOW-${String(i + 1).padStart(4, '0')}`,
    name: randomPick(['数据采集流程', '报表生成流程', '邮件处理流程', '文件整理流程', '系统巡检流程', '数据同步流程', '订单处理流程']) + ` ${i + 1}`,
    category: randomPick(['数据采集', '文档处理', '系统运维', '业务自动化']),
    status: randomPick(['published', 'draft', 'offline']),
    version: `v${randomInt(1, 3)}.${randomInt(0, 9)}.${randomInt(0, 9)}`,
    robotCount: randomInt(1, 5),
    runCount: randomInt(10, 1000),
    successRate: randomInt(85, 100),
    creator: randomPick(['张三', '李四', '王五', '赵六']),
    description: '该流程用于自动化业务处理，提升工作效率',
  }));
  await Process.bulkCreate(list);
  console.log('[seed] 已创建流程数据');
}

async function seedRobots() {
  if (await Robot.count() > 0) return;
  const list = Array.from({ length: 38 }, (_, i) => ({
    code: `BOT-${String(i + 1).padStart(4, '0')}`,
    name: `机器人节点 ${i + 1}`,
    ip: `192.168.${randomInt(1, 254)}.${randomInt(1, 254)}`,
    os: randomPick(['Windows 10', 'Windows Server 2019', 'Windows Server 2022', 'Windows 11']),
    status: randomPick(['online', 'offline', 'busy']),
    cpu: randomInt(10, 80),
    memory: randomInt(20, 90),
    disk: randomInt(30, 85),
    processCount: randomInt(0, 10),
    lastHeartbeat: new Date(Date.now() - randomInt(0, 60) * 1000),
    location: randomPick(['机房A-01', '机房A-02', '机房B-01', '机房B-02', '机房C-01']),
  }));
  await Robot.bulkCreate(list);
  console.log('[seed] 已创建机器人数据');
}

async function seedTasks() {
  if (await Task.count() > 0) return;
  const list = Array.from({ length: 63 }, (_, i) => ({
    name: randomPick(['每日数据采集', '周报生成', '月度报表', '订单批量处理', '邮件自动回复', '文件备份']) + `任务 ${i + 1}`,
    processName: randomPick(['数据采集流程', '报表生成流程', '邮件处理流程', '文件整理流程']),
    robotName: `机器人节点 ${randomInt(1, 38)}`,
    status: randomPick(['pending', 'running', 'success', 'failed', 'stopped']),
    priority: randomPick(['high', 'medium', 'low']),
    triggerType: randomPick(['manual', 'scheduled', 'api']),
    cron: randomPick(['0 0 * * *', '0 8 * * 1', '*/30 * * * *', '0 0 1 * *']),
    startTime: new Date(Date.now() - randomInt(0, 60) * 60000),
    endTime: randomPick([null, new Date(Date.now() - randomInt(0, 30) * 60000)]),
    duration: randomInt(5, 3600),
    creator: randomPick(['张三', '李四', '王五', '赵六']),
  }));
  await Task.bulkCreate(list);
  console.log('[seed] 已创建任务数据');
}

async function seedRecords() {
  if (await Record.count() > 0) return;
  const list = Array.from({ length: 128 }, (_, i) => ({
    taskName: randomPick(['每日数据采集', '周报生成', '月度报表', '订单批量处理', '邮件自动回复', '文件备份']) + ` ${randomInt(1, 63)}`,
    processName: randomPick(['数据采集流程', '报表生成流程', '邮件处理流程', '文件整理流程']),
    robotName: `机器人节点 ${randomInt(1, 38)}`,
    status: randomPick(['success', 'failed', 'running', 'stopped']),
    startTime: new Date(Date.now() - randomInt(1, 600) * 60000),
    endTime: randomPick([null, new Date(Date.now() - randomInt(0, 600) * 60000)]),
    duration: randomInt(5, 3600),
    logCount: randomInt(10, 200),
    errorMsg: randomPick([null, '连接超时', '找不到元素', '网络异常', '权限不足', '文件不存在']),
    operator: randomPick(['张三', '李四', '系统自动', '王五']),
  }));
  await Record.bulkCreate(list);
  console.log('[seed] 已创建运行记录数据');
}

async function run() {
  try {
    await sequelize.authenticate();
    await seedUsers();
    await seedRoles();
    await seedProcesses();
    await seedRobots();
    await seedTasks();
    await seedRecords();
    console.log('[seed] 完成');
    process.exit(0);
  } catch (err) {
    console.error('[seed] 失败:', err.message);
    process.exit(1);
  }
}

run();
