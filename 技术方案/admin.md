# 后台管理系统 (Admin) 技术方案

## 1. 项目概述

本方案旨在为 "LNJ 工时管理系统" 构建一个独立的后台管理端，用于超级管理员进行全局数据管理、用户监管和系统配置。

**核心原则**：
1.  **独立性**：后台管理系统代码与小程序端物理分离，独立构建和部署。
2.  **安全性**：接口层面严格鉴权，确保普通用户无法访问管理接口。
3.  **零侵入**：后端改造采用增量式开发，保证现有小程序业务逻辑 100% 不受影响。

---

## 2. 技术架构

### 2.1 项目结构 (Monorepo)

采用 Monorepo 风格，在根目录下新增 `admin` 目录：

```text
/
├── admin/                  <-- [新增] 后台管理前端 (Web)
│   ├── src/
│   │   ├── api/            <-- Admin 专用 API 封装
│   │   ├── pages/          <-- 管理页面 (用户管理, 组织管理等)
│   │   └── ...
├── server/                 <-- [现有] NestJS 后端
├── weapp/                  <-- [现有] Taro 小程序前端
└── docker-compose.yml      <-- [修改] 增加 admin 服务
```

### 2.2 前端技术栈

*   **框架**: React 18 + TypeScript
*   **构建工具**: Vite (极速启动与热更新)
*   **UI 组件库**: Ant Design 5.x + @ant-design/pro-components (提供高级表格、布局等业务组件)
*   **状态管理**: Zustand (轻量级，与小程序端保持一致)
*   **HTTP 请求**: Axios
*   **路由**: React Router v6

### 2.3 后端架构 (NestJS)

#### A. 接口隔离策略
为了彻底杜绝影响小程序的风险，后台管理系统将使用**完全独立**的 Controller 和路由前缀。

*   **小程序接口**: 保持不变，前缀 `/api/*` (如 `/api/users/profile`)。
*   **管理端接口**: 新增前缀 `/api/admin/*` (如 `/api/admin/users/list`)。

#### B. 鉴权机制
1.  **JWT 扩展**: Token Payload 中包含 `systemRole` 字段。
2.  **SystemRolesGuard**: 新增全局守卫，拦截所有 `/api/admin/*` 请求，强制检查 `user.systemRole === 'admin'`。

#### C. 数据库设计 (Prisma)
在现有数据库基础上进行**非破坏性扩展**：

*   **User 表扩展**:
    *   `systemRole`: String (default: "user") - 区分管理员与普通用户。
    *   `isLocked`: Boolean (default: false) - 用于封禁账号。
    *   `email`: String (unique, optional) - 管理员登录凭证。
*   **SystemLog 表 (新增)**:
    *   记录管理员的关键操作（操作人、模块、动作、IP、详情）。

---

## 3. 详细设计

### 3.1 前端设计
*   **布局**: 使用 `ProLayout` 实现经典的 "侧边栏 + 顶部导航" 布局。
*   **列表页**: 使用 `ProTable` 实现自动化查询、分页、筛选，极大减少样板代码。
*   **请求封装**: Axios 拦截器统一处理 Token 注入和 401 自动跳转登录页。

### 3.2 接口定义 (Admin API)

| 模块 | 方法 | 路径 | 描述 | 权限 |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | POST | `/api/auth/login-password` | 管理员账号密码登录 | Public |
| **Users** | GET | `/api/admin/users` | 获取用户列表（分页、搜索） | Admin |
| | GET | `/api/admin/users/:id` | 获取用户详情 | Admin |
| | PATCH | `/api/admin/users/:id/lock` | 封禁/解封用户 | Admin |
| | PATCH | `/api/admin/users/:id/password` | 重置用户密码 | Admin |
| **Orgs** | GET | `/api/admin/orgs` | 获取组织列表 | Admin |
| | GET | `/api/admin/orgs/:id` | 获取组织详情 | Admin |
| **Logs** | GET | `/api/admin/logs` | 查看系统操作日志 | Admin |

### 3.3 部署方案
*   **开发环境**: Vite 代理 `/api` -> `localhost:3000`。
*   **生产环境**: Docker 容器化部署 (Nginx)，反向代理 `/api` -> 后端服务容器。

---

## 4. 实施计划

1.  **基础设施**: 完成 `admin` 项目初始化，配置 Docker 和 Nginx。(已完成)
2.  **数据库迁移**: 执行 Schema 变更，添加 Seed 数据。(已完成)
3.  **后端鉴权**: 实现 `SystemRolesGuard` 和 `AdminUsersController`。
4.  **前端开发**: 依次实现用户管理、组织管理等核心页面。
