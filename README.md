# 📚 Grammaticus

<p align="center">
  <strong>「为深度语言学习者打造的智能参考工具」</strong>
</p>

<p align="center">
  <a href="#-简介">简介</a> •
  <a href="#-核心功能">功能</a> •
  <a href="#-快速开始">快速开始</a> •
  <a href="#-部署上线">部署</a> •
  <a href="#-项目结构">结构</a> •
  <a href="#-未来规划">规划</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/SQLite-better--sqlite3-003B57?style=flat-square&logo=sqlite" alt="SQLite" />
  <img src="https://img.shields.io/badge/Vitest-26_tests-6E9F18?style=flat-square&logo=vitest" alt="Vitest" />
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="License" />
</p>

---

## ✨ 简介

**Grammaticus** 是一个面向英语学习者的全栈参考工具，目标是为每一个单词提供**深度、多维度的语言解析**，帮助用户在阅读与查询中自然习得语言。

项目当前内置 **675 个基础单词 + 652 条精细标注的深度词卡**（涵盖发音、核心意象、词形变化、语法规则、同义词对比等维度，全部经过数据清洗校验），以及**新概念英语 1-4 册共 276 篇课文**。词库定位为四六级 / 考研 / 雅思 / 托福的中高阶核心词汇，未来将持续扩充基础词汇覆盖。

> 💡 项目名称来源于拉丁语 *grammaticus*，意为"语法学者 / 语言教师"，寄托了成为每一位学习者身边可靠语言导师的愿景。

---

## 🎯 核心功能

| 模块 | 功能说明 |
|:---:|:---|
| 🔍 **单词检索** | 实时搜索建议，快速定位单词的完整释义、词性、例句与用法 |
| 📖 **深度词卡** | 发音（英/美）、核心意象、语义半径、语法规则、同义词辨析等多维度解析（652 条深度词条） |
| 📚 **词库浏览** | 全部收录单词分页浏览，按词性色彩标记 |
| 🎬 **语法视频** | Larry 老师 Bilibili 英语语法系列 28 讲，按词性、简单句、从句、非谓语、时态、虚拟语气等分类，在线播放 |
| 📄 **分级阅读** | 新概念英语 1-4 册 276 篇课文 + 经典演讲、文学、短文，支持难度分级与阅读进度追踪 |
| 🧠 **语境记忆** | 选择目标词汇，由 DeepSeek AI 生成包含这些单词的自然短文，在真实语境中理解记忆 |
| 📸 **拍照识别** | Tesseract.js 浏览器端 OCR，拍摄英语文本照片即可提取文字，支持编辑、收藏与全屏阅读 |
| 🎯 **悬浮分析** | 右下角浮动面板，选中任意文本即可进行语法深度分析或介词五步法解析（基于 DeepSeek，未配置时使用本地分析兜底） |
| 📤 **文档解析** | 上传 `.docx` / `.pdf` / `.txt` 文档，自动提取文本并提供全屏阅读体验（历史记录按账号隔离） |
| 👤 **用户系统** | 注册登录（JWT），收藏、阅读进度、保存文章云端同步 |
| 🌗 **双主题** | 深空暗黑风 / Notion 浅色风一键切换，跟随系统偏好，无刷新闪烁 |
| 💬 **留言板** | 用户反馈与建议，邮件通知作者（留言内容不公开） |

---

## 🏗️ 技术栈

### 前端
| 技术 | 说明 |
|------|------|
| **React 19** + **TypeScript (strict)** | 现代化 UI 框架，全量严格类型检查 |
| **Vite 8** | 极速构建工具，开发热更新体验优秀 |
| **React Router v7** | 声明式客户端路由 |
| **Tesseract.js** | 浏览器端 OCR 文字识别 |
| **CSS 变量双主题** | `data-theme` 驱动，防闪烁初始化 |

### 后端
| 技术 | 说明 |
|------|------|
| **Express 5** + **TypeScript (strict)** | 轻量高性能 API 服务，生产模式同时托管前端构建产物 |
| **better-sqlite3** | 嵌入式 SQLite，WAL 模式 + 外键约束 + 索引 |
| **JWT + bcryptjs** | 用户认证，登录失败锁定，接口级鉴权 |
| **Multer / Mammoth / pdf-parse** | 文件上传与文档解析 |
| **Nodemailer** | 留言板邮件通知（已防邮件头注入） |

### 工程化
| 技术 | 说明 |
|------|------|
| **Vitest** | 单元测试（26 个用例，覆盖安全工具函数与本地分析器） |
| **ESLint 10 + typescript-eslint** | 0 error 通过 |
| **Docker 多阶段构建** | 生产镜像，启动时自动幂等导入种子数据 |
| **Render Blueprint** | `render.yaml` 一键云端部署 |

---

## 🚀 快速开始

### 方式一：Windows 一键启动（推荐新手）

**双击项目根目录的 `start.bat`** 即可 —— 脚本使用项目自带的 Node.js 运行时（`.runtime/`），无需安装任何环境。首次运行会自动安装依赖、导入数据并打开浏览器。

> 关闭弹出的黑色命令行窗口即可停止服务。

### 方式二：开发者手动启动

前置要求：Node.js >= 22

```bash
# 1. 安装依赖
npm install
# Windows 上 better-sqlite3 若编译失败，运行:
#   npm install --ignore-scripts && node scripts/install-better-sqlite3.mjs

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env:
#   - JWT_SECRET 必填(随机字符串)
#   - LLM_API_KEY 选填(DeepSeek Key，AI 分析功能需要)
#   - SMTP_* 选填(留言板邮件通知)

# 3. 导入种子数据
npm run seed          # 单词 + 深度词卡
npm run seed-nce      # 新概念英语 276 篇课文

# 4. 启动开发服务器
npm run dev
```

启动后：
- 前端：`http://localhost:5173`
- 后端 API：`http://localhost:3001`

### 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发模式（前端 + 后端热启动） |
| `npm run build` | 构建生产版本（含类型检查） |
| `npm start` | 生产模式（Express 同时托管前端与 API） |
| `npm test` | 运行 Vitest 单元测试 |
| `npm run lint` | ESLint 检查 |
| `npm run check` | TypeScript 全项目类型检查 |
| `npm run clean-data` | 数据清洗（去噪、补释义、修词性，幂等） |

---

## 🌐 部署上线

### Render（免费层，推荐）

1. 把项目推送到 GitHub 仓库
2. 在 [Render](https://render.com) 上 **New + → Blueprint**，连接该仓库
3. `render.yaml` 会自动创建服务；在控制台填入 `LLM_API_KEY`（可选）等环境变量
4. 部署完成后访问 `https://<你的服务名>.onrender.com`

也可以不用 Blueprint，直接 **New + → Web Service**，运行时选 **Docker**，其余默认。

> ⚠️ 免费层限制：文件系统是临时的，服务重启后**用户注册数据、收藏、留言会丢失**（单词与课文数据每次启动自动重新导入，不受影响）。需要持久化请升级付费层挂载磁盘，或将 SQLite 换成托管数据库。
> 免费实例 15 分钟无访问会休眠，首次访问需等待约 1 分钟冷启动。

### 任意 Docker 主机

```bash
docker build -t grammaticus .
docker run -p 3001:3001 \
  -e JWT_SECRET=$(openssl rand -hex 32) \
  -e LLM_API_KEY=sk-xxx \
  grammaticus
```

---

## 📁 项目结构

```
grammaticus/
├── server/                      # 后端服务
│   ├── routes/                  # API 路由
│   │   ├── words.ts             # 单词 CRUD 与搜索(发音 URL 域名白名单校验)
│   │   ├── articles.ts          # 文章管理
│   │   ├── analyze.ts           # AI 语法 / 介词深度分析
│   │   ├── context.ts           # AI 语境文章生成
│   │   ├── video.ts             # 视频文件列表与播放(防路径穿越)
│   │   ├── upload.ts            # 文档上传与解析(按用户隔离,需登录)
│   │   ├── messages.ts          # 留言板(提交公开,读取需登录,防邮件头注入)
│   │   ├── auth.ts              # 注册 / 登录 / 当前用户(失败锁定)
│   │   └── userData.ts          # 收藏 / 进度 / 保存文章 / 同步(需登录)
│   ├── middleware/auth.ts       # JWT 鉴权中间件 + Express 类型扩展
│   ├── utils/text.ts            # 共享纯函数(markdown 清洗、URL 白名单、头部消毒)+ 单元测试
│   ├── db.ts                    # 数据库连接、表结构与迁移
│   ├── index.ts                 # Express 入口(限流、CORS、生产静态托管)
│   ├── llm.ts                   # OpenAI 兼容 LLM 调用器
│   ├── seed.ts / seed-nce.ts    # 种子数据导入(幂等)
│   └── import-*.ts parse-*.ts   # 离线数据生成脚本(路径通过参数传入)
├── src/                         # 前端源码
│   ├── api/                     # API 调用封装(统一 client,自动带 JWT)
│   ├── components/              # React 组件(ui/ 基础组件, layout/ 布局)
│   ├── hooks/                   # 自定义 Hooks(useApi)
│   ├── pages/                   # 页面(Home/Words/WordDetail/Read/Grammar/Scan/Upload/Guestbook/Login/About)
│   ├── styles/tokens.css        # 设计 tokens — 深色/浅色双主题变量
│   ├── utils/                   # 工具(theme/bookmarks/recent/analyze/…)
│   └── main.tsx                 # 入口(路由 + PWA Service Worker)
├── scripts/                     # 维护脚本
│   ├── clean-data.mjs           # 数据清洗(去噪/补释义/修词性)
│   └── install-better-sqlite3.mjs # 原生模块预编译二进制安装(国内镜像)
├── data/                        # 种子数据(JSON) + 运行时数据库(.gitignore)
├── public/                      # 静态资源 + PWA(sw.js 网络优先策略)
├── start.bat                    # Windows 一键启动(使用 .runtime/ 自带 Node)
├── Dockerfile                   # 多阶段生产镜像
├── render.yaml                  # Render Blueprint 部署配置
└── vitest.config.ts             # 测试配置
```

---

## 🗄️ 数据库设计

SQLite（WAL 模式 + 外键约束），核心表：

| 表名 | 用途 | 说明 |
|------|------|------|
| `words` | 基础单词（单词、释义、词性、例句） | 675 条，全部经过清洗校验 |
| `rich_words` | 深度分析（发音、核心意象、语义半径、词形变化、语法规则、同义词对比、一句话穿透） | 652 条 |
| `articles` | 文章（教材、课序、标题、内容、难度） | 276 篇 NCE + 4 篇经典 |
| `users` | 用户（bcrypt 密码哈希） | — |
| `bookmarks` / `reading_progress` / `saved_articles` | 用户学习数据（外键关联 users） | — |
| `messages` | 留言板（仅作者登录后可读） | — |
| `documents` | 上传文档（含 user_id 归属，按用户隔离） | — |

---

## 🔌 API 概览

| 端点 | 方法 | 鉴权 | 说明 |
|------|:---:|:---:|------|
| `/api/words` | GET | 公开 | 单词搜索 / 分页列表 |
| `/api/words/:word` | GET | 公开 | 单词详情（含深度分析数据） |
| `/api/words/autocomplete` | GET | 公开 | 搜索建议 |
| `/api/words/:word/audio` | GET | 公开 | 发音音频（服务端域名白名单校验） |
| `/api/articles` `/api/articles/:id` `/api/articles/books` | GET | 公开 | 文章列表 / 详情 / 教材 |
| `/api/analyze/grammar` `/api/analyze/preposition` | POST | 公开+限流 | AI 语法 / 介词分析（无 Key 时本地兜底） |
| `/api/context/generate` | POST | 公开+限流 | AI 语境文章生成 |
| `/api/video/list` `/api/video/:filename` | GET | 公开 | 视频列表 / 播放（防路径穿越） |
| `/api/upload` | POST | 可选登录 | 文档上传解析（登录后记录归属） |
| `/api/upload/list` `/api/upload/:id` | GET/DELETE | **需登录** | 仅能访问自己的文档 |
| `/api/messages` | POST | 公开+限流 | 提交留言（邮件通知作者） |
| `/api/messages` | GET | **需登录** | 留言列表（作者用） |
| `/api/auth/register` `/api/auth/login` `/api/auth/me` | POST/GET | — | 注册 / 登录（失败锁定）/ 当前用户 |
| `/api/user/*` | GET/POST/DELETE | **需登录** | 收藏、进度、保存文章、同步 |
| `/api/health` | GET | 公开 | 健康检查 |

---

## 🗺️ 未来规划

- [x] **测试与代码质量**：Vitest 单元测试、TypeScript strict、ESLint 0 error、安全修复（鉴权/注入/SSRF 面）
- [x] **容器化部署**：Dockerfile 多阶段构建 + render.yaml 一键部署
- [x] **双主题**：深色 / 浅色切换，跟随系统偏好
- [ ] **单词库扩展**：补充基础高频词（当前词库偏中高阶），逐步扩展至 15,000+ 核心词汇
- [ ] **AI 学习伙伴**：上下文感知助手，根据学习行为主动提供建议
- [ ] **学习笔记系统**：单词与文章级别的用户笔记
- [ ] **学习数据可视化**：首页学习进度面板（查词数、阅读量、收藏统计）
- [ ] **CI/CD**：GitHub Actions 自动化（lint + test + build）

---

## 🤝 贡献指南

1. Fork 本仓库并创建特性分支 (`git checkout -b feature/amazing-feature`)
2. 确保 `npm run check && npm run lint && npm test` 全部通过
3. 提交遵循 [Conventional Commits](https://www.conventionalcommits.org/)（`feat:` / `fix:` / `docs:` / `refactor:` / `test:` / `chore:`）
4. 开启 Pull Request

---

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源，欢迎自由使用与二次开发。

---

## 🙏 致谢

- 感谢 **Larry 老师** 对 Grammaticus 视频内容的慷慨赞助，以及长期以来在网上无私分享优质英语课程
- [React](https://react.dev/) · [Express](https://expressjs.com/) · [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) · [Vite](https://vitejs.dev/) · [DeepSeek](https://deepseek.com/) · [Tesseract.js](https://tesseract.projectnaptha.com/) · [Vitest](https://vitest.dev/)

---

<p align="center">
  <sub>Built with ❤️ for English learners around the world.</sub>
</p>
