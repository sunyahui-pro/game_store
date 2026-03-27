# 🎮 游戏中心 (Game Center)

一个基于 Node.js + Express 的 Web 游戏平台，包含 6 个经典小游戏、用户系统、排行榜等功能。

![Game Center](https://img.shields.io/badge/Game-Center-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ 功能特性

- 🎮 **6 个经典小游戏**
  - 🔢 2048 - 数字合并挑战
  - 🐍 贪吃蛇 - 经典街机游戏
  - 🐦 Flappy Bird - 飞行躲避（待完成）
  - 🃏 记忆翻牌 - 记忆力挑战（待完成）
  - 💣 扫雷 - 经典推理游戏（待完成）
  - 🧱 打砖块 - 弹球消除（待完成）

- 👤 **用户系统**
  - 注册/登录
  - JWT 认证
  - 个人资料管理
  - 等级/经验值系统

- 🏆 **排行榜**
  - 实时分数排行
  - 个人排名显示
  - 游戏统计数据

- 🎨 **主题系统**
  - 5 种配色主题（紫色、蓝色、绿色、红色、橙色）
  - 深色/浅色模式
  - 响应式设计

- 🔌 **实时功能**
  - WebSocket 实时通知
  - 排行榜自动更新

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装

```bash
# 克隆仓库
git clone https://github.com/sunyahui-pro/game_store.git
cd game_store

# 安装依赖
npm install

# 启动服务器
npm start
```

### 访问

- 首页: http://localhost:3000
- 游戏中心: http://localhost:3000/games.html
- 登录: http://localhost:3000/auth.html

## 📁 项目结构

```
game_store/
├── server.js          # Express 服务器
├── db.js              # 内存数据库
├── package.json
├── README.md
└── public/            # 前端静态文件
    ├── index.html     # 首页
    ├── games.html     # 游戏中心
    ├── auth.html      # 登录/注册
    ├── css/
    │   └── style.css  # 样式文件
    ├── js/
    │   ├── theme.js   # 主题管理
    │   ├── api.js     # API 请求
    │   ├── auth.js    # 用户认证
    │   └── ui.js      # UI 交互
    └── game/
        ├── 2048.html  # 2048 游戏
        ├── snake.html # 贪吃蛇游戏
        └── ...        # 其他游戏
```

## 🔧 API 接口

### 认证相关

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| GET | /api/auth/me | 获取当前用户 |
| PUT | /api/auth/profile | 更新用户资料 |

### 游戏相关

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/games/:gameId/score | 提交分数 |
| GET | /api/games/:gameId/leaderboard | 获取排行榜 |
| GET | /api/games/:gameId/me | 获取我的排名 |
| GET | /api/games/:gameId/stats | 获取游戏统计 |

### 通知相关

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/notifications | 获取通知列表 |
| PUT | /api/notifications/:id/read | 标记已读 |
| DELETE | /api/notifications/:id | 删除通知 |

## 🎮 游戏列表

### 已完成 ✅

- **2048** - 使用方向键移动方块，合并相同数字，挑战 2048！
- **贪吃蛇** - 经典街机游戏，控制蛇吃食物，越吃越长！

### 开发中 🚧

- Flappy Bird
- 记忆翻牌
- 扫雷
- 打砖块

## 🛠️ 技术栈

- **后端**: Node.js, Express, WebSocket
- **前端**: HTML5, CSS3, JavaScript (原生)
- **认证**: JWT (jsonwebtoken)
- **密码加密**: bcryptjs
- **数据库**: 内存数据库 (可替换为 SQLite/MongoDB)

## 🔐 默认账号

- **管理员**: `admin` / `admin123`

## 📝 开发计划

- [x] 基础框架搭建
- [x] 用户系统
- [x] 2048 游戏
- [x] 贪吃蛇游戏
- [ ] Flappy Bird
- [ ] 记忆翻牌
- [ ] 扫雷
- [ ] 打砖块
- [ ] 数据库持久化
- [ ] 多人在线对战

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

Made with ❤️ by 肥子 🐯
