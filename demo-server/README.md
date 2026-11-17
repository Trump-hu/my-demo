# demo-server

基于 **Express.js + MySQL (Sequelize ORM)** 的后端服务，与 `demo` (Vue3 RPA 管理后台) 配套使用。

## 技术栈

- Express.js 4 — Web 框架
- Sequelize 6 — MySQL ORM
- mysql2 — MySQL 驱动
- jsonwebtoken — JWT 认证
- bcryptjs — 密码哈希
- helmet / cors / morgan — 安全与日志
- express-validator — 参数校验
- dotenv — 环境变量

## 目录结构

```
demo-server/
├── .env                  # 环境变量（需自行修改数据库密码）
├── .env.example          # 环境变量示例
├── package.json
└── src/
    ├── app.js            # Express 应用工厂
    ├── server.js         # 启动入口
    ├── config/
    │   └── index.js      # 环境与配置
    ├── models/           # Sequelize 模型
    │   ├── index.js      # Sequelize 实例
    │   ├── user.model.js
    │   ├── process.model.js
    │   ├── robot.model.js
    │   ├── task.model.js
    │   ├── record.model.js
    │   └── role.model.js
    ├── routes/           # 路由
    │   ├── index.js      # 路由汇总
    │   ├── auth.routes.js
    │   ├── user.routes.js
    │   ├── process.routes.js
    │   ├── robot.routes.js
    │   ├── task.routes.js
    │   ├── record.routes.js
    │   └── role.routes.js
    ├── controllers/      # 控制器
    ├── services/         # 业务逻辑
    ├── middlewares/      # auth / validate / error
    ├── utils/            # response / jwt / password / pagination / date
    └── scripts/          # db:init / db:seed 脚本
```

## 快速开始

### 1. 安装依赖

```bash
cd demo-server
npm install
```

### 2. 配置数据库

编辑 `.env`，填写你的 MySQL 连接信息：

```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=demo_server
```

### 3. 初始化数据库 & 表

```bash
npm run db:init     # 自动创建数据库并同步全部表结构
npm run db:seed     # 插入测试账号及各模块示例数据
```

### 4. 启动服务

```bash
npm run dev          # 开发模式（nodemon 热重载）
# 或
npm start            # 生产模式
```

服务默认运行在 `http://localhost:3000`。

## 默认账号（种子数据）

| 用户名 | 密码    | 角色  |
|--------|---------|-------|
| admin  | admin123| admin |
| demo   | 123456  | user  |

## API 接口

### 响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

分页响应：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [],
    "total": 0,
    "page": 1,
    "pageSize": 10
  }
}
```

### 认证模块

| 方法 | 路径              | 说明           | 权限 |
|------|-------------------|----------------|------|
| POST | /api/login        | 登录           | 公开 |
| GET  | /api/userInfo     | 获取当前用户   | 登录 |
| POST | /api/logout       | 退出登录       | 登录 |

### 用户管理

| 方法   | 路径                          | 说明       | 权限 |
|--------|-------------------------------|------------|------|
| GET    | /api/user/list                | 用户列表   | 登录 |
| POST   | /api/user/save                | 新增/更新  | 登录 |
| DELETE | /api/user/delete/:id          | 删除用户   | 登录 |
| PUT    | /api/user/resetPassword/:id   | 重置密码   | 登录 |

### 流程管理

| 方法   | 路径                            | 说明         | 权限 |
|--------|---------------------------------|--------------|------|
| GET    | /api/process/list               | 流程列表     | 登录 |
| GET    | /api/process/detail/:id         | 流程详情     | 登录 |
| POST   | /api/process/save               | 新增/更新    | 登录 |
| DELETE | /api/process/delete/:id         | 删除流程     | 登录 |
| GET    | /api/process/monitor/:id        | 流程监控     | 登录 |
| GET    | /api/process/efficiency/:id     | 效能分析     | 登录 |

### 机器人管理

| 方法   | 路径                      | 说明       | 权限 |
|--------|---------------------------|------------|------|
| GET    | /api/robot/list           | 机器人列表 | 登录 |
| POST   | /api/robot/save           | 新增/更新  | 登录 |
| DELETE | /api/robot/delete/:id     | 删除机器人 | 登录 |

### 任务管理

| 方法   | 路径                      | 说明       | 权限 |
|--------|---------------------------|------------|------|
| GET    | /api/task/list            | 任务列表   | 登录 |
| POST   | /api/task/save            | 新增/更新  | 登录 |
| DELETE | /api/task/delete/:id      | 删除任务   | 登录 |
| POST   | /api/task/start/:id       | 启动任务   | 登录 |
| POST   | /api/task/stop/:id        | 停止任务   | 登录 |

### 运行记录

| 方法 | 路径               | 说明       | 权限 |
|------|--------------------|------------|------|
| GET  | /api/record/list   | 记录列表   | 登录 |

### 角色管理

| 方法   | 路径                           | 说明       | 权限 |
|--------|--------------------------------|------------|------|
| GET    | /api/role/list                 | 角色列表   | 登录 |
| GET    | /api/role/options              | 角色下拉   | 登录 |
| POST   | /api/role/save                 | 新增/更新  | 登录 |
| DELETE | /api/role/delete/:id           | 删除角色   | 登录 |
| GET    | /api/role/permissionTree       | 权限树     | 登录 |

### 其他

| 方法 | 路径     | 说明     | 权限 |
|------|----------|----------|------|
| GET  | /health  | 健康检查 | 公开 |

## 与前端对接

前端 `demo` 项目已通过 Vite 代理将 `/api` 转发到本服务：

```js
// demo/vite.config.js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
}
```

前端 axios 的 `baseURL` 默认为 `/api`，请求会自动代理到后端。

## 新增业务模块

以「文章」为例，按以下结构创建文件：

1. `src/models/article.model.js` — 定义模型
2. `src/services/article.service.js` — 业务逻辑
3. `src/controllers/article.controller.js` — 控制器
4. `src/routes/article.routes.js` — 路由
5. 在 `src/routes/index.js` 中挂载：`router.use('/', articleRoutes)`
6. 在 `src/scripts/init-db.js` 中导入新模型

保持 「route → controller → service → model」 的分层调用链。
