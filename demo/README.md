# RPA 管理平台

基于 Vue 3 + Element Plus 的企业级 RPA（机器人流程自动化）管理系统。

## 技术栈

- **Vue 3** - 渐进式 JavaScript 框架（Composition API）
- **Vite 5** - 下一代前端构建工具
- **Element Plus** - 企业级 UI 组件库
- **Vue Router 4** - 官方路由管理器
- **Pinia** - Vue 状态管理库（含持久化插件）
- **ECharts** - 数据可视化图表库
- **Axios** - HTTP 请求库
- **Sass** - CSS 预处理器

## 功能模块

| 模块 | 说明 |
|------|------|
| 登录页 | 用户认证，登录成功后 token 和用户信息持久化到 localStorage |
| 工作台 | 数据统计、任务趋势图表、机器人状态、最近运行记录 |
| 流程管理 | 流程的增删改查、发布、运行 |
| 机器人管理 | 机器人节点管理、资源监控、重启 |
| 任务管理 | 任务的增删改查、启动/停止、定时调度 |
| 流程运行记录 | 运行日志查询、详情查看、导出 |
| 用户管理 | 用户的增删改查、启用/禁用、重置密码 |
| 角色管理 | 角色管理、权限分配（树形权限） |
| 系统设置 | 基础设置、任务设置、通知设置、安全设置 |

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 测试账号

- 用户名：`admin`
- 密码：`admin123`

## 认证机制

- 登录成功后，`token` 和 `userInfo` 通过 Pinia 持久化插件存储到 `localStorage`（key: `rpa-user`）
- 路由全局守卫检查 token，未登录自动跳转登录页
- Axios 请求拦截器自动在请求头添加 `Authorization: Bearer <token>`
- 401 响应自动清除登录状态并跳转登录页

## 项目结构

```
src/
├── api/              # 接口请求（Mock 数据）
│   ├── auth.js       # 认证接口
│   ├── process.js    # 流程接口
│   ├── robot.js      # 机器人接口
│   ├── task.js       # 任务接口
│   ├── record.js     # 运行记录接口
│   ├── user.js       # 用户接口
│   └── role.js       # 角色接口
├── layout/           # 主布局
│   └── index.vue
├── router/           # 路由配置
│   └── index.js
├── store/            # Pinia 状态管理
│   ├── user.js       # 用户状态（持久化）
│   └── app.js        # 应用状态（持久化）
├── styles/           # 全局样式
│   ├── index.scss
│   ├── variables.scss
│   └── mixins.scss
├── utils/            # 工具函数
│   ├── request.js    # Axios 封装
│   └── mock.js       # Mock 数据工具
├── views/            # 页面视图
│   ├── login/        # 登录页
│   ├── dashboard/    # 工作台
│   ├── process/      # 流程管理
│   ├── robot/        # 机器人管理
│   ├── task/         # 任务管理
│   ├── record/       # 运行记录
│   ├── user/         # 用户管理
│   ├── role/         # 角色管理
│   ├── setting/      # 系统设置
│   └── error/        # 404 页面
├── App.vue
└── main.js
```

## 说明

当前项目所有接口数据为前端 Mock，便于直接运行预览。接入真实后端时，修改 `src/utils/request.js` 中的 `baseURL` 并替换 `src/api/` 下的 Mock 实现即可。
