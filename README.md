# 📚 Grammaticus

<p align="center">
  <strong>「为深度语言学习者打造的智能参考工具」</strong>
</p>

<p align="center">
  <a href="#-简介">简介</a> •
  <a href="#-核心功能">功能</a> •
  <a href="#-快速开始">快速开始</a> •
  <a href="#-项目结构">结构</a> •
  <a href="#-未来规划">规划</a> •
  <a href="#-贡献指南">贡献</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-6.x-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/SQLite-better--sqlite3-003B57?style=flat-square&logo=sqlite" alt="SQLite" />
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PRs Welcome" />
</p>

---

## ✨ 简介

**Grammaticus** 是一个面向英语学习者的全栈参考工具，目标是为每一个单词提供**深度、多维度的语言解析**，帮助用户在阅读与查询中自然习得语言。

项目目前内置了 **2,350+ 条精细标注的单词数据**（涵盖发音、核心意象、词形变化、语法规则、同义词对比等维度），未来规划扩展至 **15,000+ 核心词汇**，覆盖四六级、考研、雅思、托福等主流考试范围，构建一个真正完整、可依赖的英语学习知识库。

> 💡 项目名称来源于拉丁语 *grammaticus*，意为"语法学者 / 语言教师"，寄托了成为每一位学习者身边可靠语言导师的愿景。

---

## 🎯 核心功能

| 模块 | 功能说明 |
|:---:|:---|
| 🔍 **单词检索** | 支持实时搜索建议，快速定位单词的完整释义、词性、例句与用法 |
| 📖 **深度词卡** | 展示发音、核心意象、语义半径、语法规则、同义词辨析等六维度解析（已收录 **2,350+** 词条） |
| 🎬 **语法视频** | Larry 老师 Bilibili 英语语法系列 28 讲，按词性、简单句、从句、非谓语、时态、虚拟语气等分类，在线播放 |
| 📄 **分级阅读** | 新概念英语 1-4 册 276 篇课文 + 经典演讲、文学、短文，支持难度分级与阅读进度追踪 |
| 🧠 **语境记忆** | 选择目标词汇，由 DeepSeek AI 生成包含这些单词的自然短文，在真实语境中理解记忆 |
| 📸 **拍照识别** | Tesseract.js 浏览器端 OCR，拍摄英语文本照片即可提取文字，支持编辑、收藏与全屏阅读 |
| 🎯 **悬浮分析** | 右下角浮动面板，选中任意文本即可进行语法深度分析或介词五步法解析（基于 DeepSeek） |
| 📤 **文档解析** | 支持上传 `.docx` / `.pdf` / `.txt` 文档，自动提取文本并提供全屏阅读体验 |
| 💬 **留言板** | 用户反馈与建议，邮件通知作者 |

---

## 🏗️ 技术栈

### 前端
| 技术 | 说明 |
|------|------|
| **React 19** + **TypeScript 6** | 现代化 UI 框架，类型安全 |
| **Vite** | 极速构建工具，开发热更新体验优秀 |
| **React Router v7** | 声明式客户端路由 |
| **Tesseract.js** | 浏览器端 OCR 文字识别 |
| **ESLint** | 代码质量与风格统一 |

### 后端
| 技术 | 说明 |
|------|------|
| **Express 5** + **TypeScript** | 轻量高性能 API 服务 |
| **better-sqlite3** | 嵌入式 SQLite 驱动，开启 WAL 模式与外键约束 |
| **Multer** | 文件上传处理 |
| **Mammoth** / **pdf-parse** | 文档内容解析 |
| **Nodemailer** | 留言板邮件通知 |

### 工具链
| 技术 | 说明 |
|------|------|
| **concurrently** | 前后端同步开发启动 |
| **tsx** | TypeScript 直接执行器 |
| **dotenv** | 环境变量管理 |

---

## 🚀 快速开始

### 前置要求
- Node.js >= 18
- npm 或 yarn

### 安装与运行

```bash
# 1. 克隆仓库
git clone https://github.com/ewemark/grammaticus.git
cd grammaticus

# 2. 安装依赖
npm install

# 3. 配置环境变量（如需使用 AI 分析功能）
cp .env.example .env
# 编辑 .env，填入 DeepSeek API Key 及 SMTP 邮件配置

# 4. 导入种子数据
npm run seed          # 导入基础单词与深度词卡数据（2,350+ 条）
npm run seed-nce      # 导入新概念英语 276 篇课文

# 5. 启动开发服务器
npm run dev
```

启动后：
- 前端：`http://localhost:5173`
- 后端 API：`http://localhost:3001`

### 其他常用命令

| 命令 | 说明 |
|------|------|
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览生产构建 |
| `npm run lint` | 运行 ESLint 代码检查 |
| `npm run check` | TypeScript 全项目类型检查 |

---

## 📁 项目结构

```
grammaticus/
├── server/                      # 后端服务
│   ├── routes/                  # API 路由
│   │   ├── words.ts             # 单词 CRUD 与搜索
│   │   ├── articles.ts          # 文章管理
│   │   ├── analyze.ts           # AI 语法 / 介词深度分析
│   │   ├── context.ts           # AI 语境文章生成
│   │   ├── video.ts             # 视频文件列表与播放
│   │   ├── upload.ts            # 文件上传与文档解析
│   │   └── messages.ts          # 留言板
│   ├── db.ts                    # 数据库连接与表结构
│   ├── index.ts                 # Express 应用入口（含速率限制、CORS）
│   ├── seed.ts                  # 单词数据种子脚本
│   ├── import-words.ts          # 单词分析文件批量导入
│   └── import-videos.ts         # 语法视频批量导入
├── src/                         # 前端源码
│   ├── api/                     # API 调用封装
│   ├── components/              # 可复用 React 组件
│   │   ├── ui/                  # 基础 UI 组件（Button、Card、Badge 等）
│   │   └── layout/              # 布局组件（Header、Sidebar、Layout）
│   ├── hooks/                   # 自定义 Hooks
│   ├── pages/                   # 页面级组件
│   │   ├── Home.tsx             # 首页（搜索入口 + 模块导航）
│   │   ├── Words.tsx            # 单词库（最近搜索、我的收藏、语境记忆）
│   │   ├── WordDetail.tsx       # 单词深度详情页（6 模块解析）
│   │   ├── Read.tsx             # 分级阅读
│   │   ├── Grammar.tsx          # 语法参考（视频 + 文档解释）
│   │   ├── Scan.tsx             # 拍照 OCR 识别
│   │   ├── Upload.tsx           # 文档上传与全屏阅读
│   │   ├── Guestbook.tsx        # 留言板
│   │   ├── About.tsx            # 关于页面
│   │   └── read/                # 阅读子页面
│   │       ├── ArticleLibrary.tsx   # 文章库
│   │       └── ContextLearning.tsx  # 语境记忆
│   ├── types/                   # TypeScript 类型定义
│   ├── utils/                   # 工具函数
│   ├── styles/                  # 全局样式与设计 tokens
│   └── main.tsx                 # 前端入口（含 PWA Service Worker）
├── data/                        # 数据库与视频文件（.gitignore）
├── public/                      # 静态资源
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env.example                 # 环境变量示例
```

---

## 🗄️ 数据库设计

Grammaticus 使用 SQLite 作为存储引擎，核心表结构如下：

| 表名 | 用途 | 规模说明 |
|------|------|:---:|
| `words` | 基础单词（单词、释义、词性、例句） | 基础层 |
| `rich_words` | 深度分析（发音、核心意象、语义半径、词形变化、语法规则、同义词对比、一句话穿透） | 已收录 2,350+ 条 |
| `articles` | 文章元数据（教材、课程序号、标题、内容、难度等级） | 276 篇 NCE + 经典文章 |
| `messages` | 留言板 | — |
| `documents` | 用户上传的文档记录 | — |

> 所有表均已建立合适索引，并开启外键约束与 WAL 模式。针对 15,000+ 单词的查询场景，已预留索引优化方案，确保毫秒级响应。

---

## 🔌 API 概览

| 端点 | 方法 | 说明 |
|------|:---:|------|
| `/api/words` | GET | 单词搜索 / 列表 |
| `/api/words/:word` | GET | 单词详情（含丰富分析数据） |
| `/api/words/autocomplete` | GET | 搜索建议 |
| `/api/articles` | GET | 文章列表（按教材筛选） |
| `/api/articles/:id` | GET | 文章详情 |
| `/api/articles/books` | GET | 可用教材列表 |
| `/api/analyze/grammar` | POST | AI 语法深度分析 |
| `/api/analyze/preposition` | POST | AI 介词五步法分析 |
| `/api/context/generate` | POST | AI 语境文章生成 |
| `/api/video/list` | GET | 视频列表 |
| `/api/video/:filename` | GET | 视频播放 / 下载 |
| `/api/upload` | POST | 文档上传与解析 |
| `/api/upload/list` | GET | 历史上传记录 |
| `/api/upload/:id` | GET | 文档详情 |
| `/api/messages` | POST | 提交留言（邮件通知作者） |
| `/api/health` | GET | 服务健康检查 |

---

## 🗺️ 未来规划

- [ ] **单词库扩展**：从 2,350 词扩展至 **15,000+ 高频核心词汇**
- [ ] **AI 学习伙伴**：基于 DeepSeek 的上下文感知助手，根据学习行为主动提供建议
- [ ] **学习笔记系统**：单词与文章级别的用户笔记，结合 AI 提示辅助写作
- [ ] **学习数据可视化**：首页学习进度面板，展示查词数、阅读量、收藏统计
- [ ] **语法文档解释**：配套视频的文字版语法专题讲解
- [ ] **测试与 CI/CD**：引入 Vitest 单元测试，配置 GitHub Actions 自动化流水线
- [ ] **容器化部署**：提供 Dockerfile 与 docker-compose，一键生产环境部署

---

## 🤝 贡献指南

### 参与流程

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的更改 (`git commit -m 'feat: add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启一个 Pull Request

### 提交规范

建议遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

| 类型 | 说明 |
|------|------|
| `feat:` | 新功能 |
| `fix:` | Bug 修复 |
| `docs:` | 文档更新 |
| `style:` | 代码格式（不影响功能） |
| `refactor:` | 代码重构 |
| `perf:` | 性能优化 |
| `test:` | 测试相关 |
| `chore:` | 构建 / 工具链相关 |

---

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源，欢迎自由使用与二次开发。

---

## 🙏 致谢

- 感谢 **Larry 老师** 对 Grammaticus 视频内容的慷慨赞助，以及长期以来在网上无私分享优质英语课程
- [React](https://react.dev/) · [Express](https://expressjs.com/) · [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) · [Vite](https://vitejs.dev/) · [DeepSeek](https://deepseek.com/) · [Tesseract.js](https://tesseract.projectnaptha.com/)

---

<p align="center">
  <sub>Built with ❤️ for English learners around the world.</sub>
</p>
