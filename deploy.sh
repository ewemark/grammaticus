#!/bin/sh
# Grammaticus 一键部署脚本
# 适用: Ubuntu/Debian (apt) + CentOS/RHEL/Alibaba Cloud Linux (yum/dnf)
# 用法: curl -fsSL https://raw.githubusercontent.com/ewemark/grammaticus/master/deploy.sh | sh
set -e

echo "=== Grammaticus 一键部署 ==="

# ── 检测包管理器 ──
PKG=""
if command -v apt-get >/dev/null 2>&1; then
  PKG="apt"
elif command -v dnf >/dev/null 2>&1; then
  PKG="dnf"
elif command -v yum >/dev/null 2>&1; then
  PKG="yum"
else
  echo "错误: 未找到 apt-get / dnf / yum,不支持的系统"
  exit 1
fi
echo "--- 检测到包管理器: $PKG ---"

# ── 安装 git(如果没有) ──
if ! command -v git >/dev/null 2>&1; then
  echo "--- 安装 git ---"
  if [ "$PKG" = "apt" ]; then
    apt-get update -y && apt-get install -y git curl
  else
    $PKG install -y git curl
  fi
fi

# ── 安装 Node.js 24 ──
NEED_NODE=1
if command -v node >/dev/null 2>&1; then
  NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_VER" -ge 20 ]; then
    echo "--- Node.js $(node -v) 已安装,版本满足要求 ---"
    NEED_NODE=0
  fi
fi

if [ "$NEED_NODE" = "1" ]; then
  echo "--- 安装 Node.js 24 ---"
  if [ "$PKG" = "apt" ]; then
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt-get install -y nodejs
  else
    # RHEL/CentOS/Alibaba Cloud Linux — 用 NodeSource 的 rpm 源
    curl -fsSL https://rpm.nodesource.com/setup_24.x | bash -
    $PKG install -y nodejs
  fi
fi

echo "--- Node.js 版本: $(node -v) ---"
echo "--- npm 版本: $(npm -v) ---"

# ── 克隆仓库 ──
echo "--- 克隆代码 ---"
if [ -d grammaticus ]; then
  cd grammaticus
  git pull origin master
else
  git clone https://github.com/ewemark/grammaticus.git
  cd grammaticus
fi

# ── 安装依赖 ──
echo "--- 安装依赖 ---"
npm install

# ── 构建前端 ──
echo "--- 构建前端 ---"
npm run build

# ── 导入种子数据(容错:服务器无 SQLite 时跳过) ──
echo "--- 导入数据 ---"
npm run seed 2>/dev/null || echo "(seed 跳过或失败,不影响核心功能)"
npm run seed-nce 2>/dev/null || true

# ── 创建 .env ──
if [ ! -f .env ]; then
  echo "LLM_API_KEY=sk-89728a3824bf4b19a9d55a4c7320812c" > .env
  echo "LLM_BASE_URL=https://api.deepseek.com/v1" >> .env
  echo "LLM_MODEL=deepseek-chat" >> .env
else
  # 确保 Key 存在
  if ! grep -q "LLM_API_KEY" .env; then
    echo "LLM_API_KEY=sk-89728a3824bf4b19a9d55a4c7320812c" >> .env
  fi
fi

# ── 安装 PM2 ──
if ! command -v pm2 >/dev/null 2>&1; then
  echo "--- 安装 PM2 ---"
  npm install -g pm2
fi

# ── 启动应用 ──
echo "--- 启动应用 ---"
pm2 delete grammaticus 2>/dev/null || true
NODE_ENV=production pm2 start server/index.ts \
  --name grammaticus \
  --interpreter ./node_modules/.bin/tsx \
  --env NODE_ENV=production \
  --env PORT=3000 \
  --env LLM_API_KEY="sk-89728a3824bf4b19a9d55a4c7320812c"

pm2 save
pm2 startup 2>/dev/null || true

echo ""
echo "=== 部署完成 ==="
echo "访问: http://$(curl -s ifconfig.me 2>/dev/null || echo '你的服务器IP'):3000"
echo "状态: pm2 status"
echo "日志: pm2 logs grammaticus"