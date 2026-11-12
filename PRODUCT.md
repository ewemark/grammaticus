# Grammaticus 产品蓝图 — 个人学习空间

> 本文档是「让用户留下来」功能体系的总设计。所有相关开发以此为准。
> 创建于 2026-11-05,与用户共同设计。v2:统一为「学习空间」模块,新增句子库。

## 产品定位

**「不背单词,理解单词」的深度英语学习软件** — 差异化不在词库量,而在:
1. 核心意象深度词卡(理解型学习)
2. 零代号大白话语法解剖(AI 招牌功能)
3. **学习空间:笔记 + 词典 + 句子库 + AI 老师诊断闭环**(本文档,留存核心)

## 学习闭环

```
遇到问题 → 学习助手分析 → 一键存入句子库(原句+分析自动保存,可补"我的想法")
读文章   → 选中摘录     → 写感想存入阅读笔记
遇到生词 → 加入我的词典 → 写"我的理解" → AI 点评修正
随时     → 手写笔记      → 记录任何想法
积累一段 → AI 老师诊断  → 读全部资产 → 证据式薄弱点报告 → 存为诊断笔记 → 针对性学习
```

## 统一模块:📚 学习空间 (/space)

一个导航入口(Sidebar: SPACE),页面内四个 tab:

| Tab | 内容 |
|---|---|
| 📓 全部笔记 | 所有类型笔记的时间线,可按类型筛选、搜索、编辑、删除 |
| 📝 句子库 | type='sentence' 的专门视图:原句 + AI 分析 + 我的想法 |
| 📕 我的词典 | 生词 + 词库解析 + 我的理解 + AI 点评 |
| 🩺 AI 老师 | 一键诊断(输入全部资产),报告可存为笔记 |

### 笔记类型(NoteType)
| type | 名称 | 来源 |
|---|---|---|
| text | ✍️ 手写笔记 | 用户自己写 |
| analysis | 🤖 AI 分析收藏 | 学习助手分析结果(非句子库场景) |
| word | 📇 词卡摘录 | 单词详情页保存 |
| reading | 📖 阅读笔记 | 全屏阅读选中摘录+感想 / 文章心得 |
| sentence | 📝 句子库 | 学习助手语法/介词分析 →「存入句子库」 |
| diagnosis | 🩺 诊断报告 | AI 老师诊断输出 |

### 📕 我的词典词条
- `word` / `meaning` / `pos` — 自动从词库带出(词库没有的词也允许手动收录)
- `myUnderstanding` — **我的理解**(核心字段,用户自己写)
- `aiFeedback` — AI 点评(POST /api/dictionary/review)
- `myExample` — 自造例句(可选)

收录入口:单词详情页 / 学习助手·单词查找结果 / 词典页手动添加

### 🩺 AI 老师(诊断)
- 输入:全部笔记 + 句子库 + 词典词条(含"我的理解")+ 最近查词记录
- 输出结构(中文,老师口吻):
  - 【学习画像概览】一句话总览
  - 【薄弱点诊断】①②③ 每条必须引用具体笔记/词条/句子作证据
  - 【深层模式】跨资产规律(如"句子库里 3 个长难句都卡在从句判断")
  - 【行动建议】3 条具体建议,结合软件内功能(语法视频某讲/某类词复习)
  - 【老师寄语】一句话鼓励
- 资产 < 3 条时:诚实说明数据不足,引导用户多记录
- 报告一键存为 diagnosis 笔记

### 📖 阅读笔记交互
FullscreenReader 内选中文字 → 浮动工具条:
- 「📝 记笔记」→ 输入框(引用文字预填 sourceText)→ 存 reading 笔记
- 文章级「💭 写心得」按钮 → 存 reading 笔记(title = 文章标题)

### 学习助手集成(FloatingAction)
- 语法/介词分析完成 → 大视图按钮:「📥 存入句子库」(type=sentence, sourceText=原句, analysis=AI结果, content='')
- 单词查找完成 → 按钮:「📕 加入词典」

## 数据层设计

### 本地优先(localStorage)
- `src/utils/notes.ts` — Note CRUD,key: `grammaticus_notes`
- `src/utils/dictionary.ts` — DictionaryWord CRUD,key: `grammaticus_dictionary`
- 未登录用户全功能可用(数据在本地)

### 云端备份(登录后双写)
服务端表(migration 方式加到 db.ts):
```sql
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  note_id TEXT NOT NULL,           -- 前端生成的 uuid,同步去重用
  type TEXT NOT NULL DEFAULT 'text',
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  analysis TEXT NOT NULL DEFAULT '',
  source_word TEXT NOT NULL DEFAULT '',
  source_text TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(user_id, note_id)
);
CREATE TABLE IF NOT EXISTS dictionary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  word TEXT NOT NULL COLLATE NOCASE,
  meaning TEXT NOT NULL DEFAULT '',
  pos TEXT NOT NULL DEFAULT '',
  my_understanding TEXT NOT NULL DEFAULT '',
  ai_feedback TEXT NOT NULL DEFAULT '',
  my_example TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(user_id, word)
);
```

### API 契约
```
POST /api/notes/diagnose      { notes, dictionary, recentWords } → { result: string }   (限流)
POST /api/dictionary/review   { word, meaning, myUnderstanding }  → { feedback: string } (限流)
GET    /api/user/notes          → { notes: Note[] }            (requireAuth)
POST   /api/user/notes/sync     { notes: Note[] } → { ok }      (requireAuth, upsert by note_id)
DELETE /api/user/notes/:noteId  → { ok }                        (requireAuth)
GET    /api/user/dictionary     → { words: DictionaryWord[] }   (requireAuth)
POST   /api/user/dictionary/sync { words: DictionaryWord[] } → { ok } (requireAuth, upsert by word)
```

### 前端类型契约(src/types/learning.ts)
```ts
export type NoteType = 'text' | 'analysis' | 'word' | 'diagnosis' | 'reading' | 'sentence'
export interface Note {
  id: string
  type: NoteType
  title: string
  content: string          // 我的想法/手写内容
  analysis?: string        // sentence 类型:AI 分析结果
  sourceWord?: string
  sourceText?: string      // sentence:原句;reading:摘录原文
  createdAt: number
  updatedAt: number
}
export interface DictionaryWord {
  word: string
  meaning: string
  pos: string
  myUnderstanding: string
  aiFeedback?: string
  myExample?: string
  addedAt: number
  updatedAt: number
}
```

## 页面与导航

- Sidebar 新增一项:SPACE → /space(学习空间)
- /space 页内 tab 切换:全部笔记 | 句子库 | 我的词典 | AI 老师
- 风格:沿用 tokens.css 变量 + styles/typography(microLabel/pageTitle/tabPill),极简工业风,双主题兼容

## 分工(2026-11-05)

- **Lead**:后端(notes/dictionary 表+迁移、/api/notes/diagnose、/api/dictionary/review、user 同步路由)、src/types/learning.ts、src/utils/notes.ts、src/utils/dictionary.ts、src/api/notes.ts、src/api/dictionary.ts、src/main.tsx、Sidebar.tsx、src/pages/Space.tsx(tab 框架)、FloatingAction.tsx(存句子库/加词典按钮)、FullscreenReader.tsx(选中工具条)、集成验证
- **Teammate A(notes-view)**:src/pages/space/NotesView.tsx(全部笔记+句子库两个视图组件)
- **Teammate B(dict-view)**:src/pages/space/DictionaryView.tsx、src/pages/space/TeacherView.tsx、WordDetail.tsx 加两个按钮
