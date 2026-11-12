#!/bin/sh
# Grammaticus 一键部署脚本 v3
# 直接下载 Node.js 二进制包,不依赖 NodeSource,任何 Linux 都能跑
# 用法: curl -fsSL https://raw.githubusercontent.com/ewemark/grammaticus/master/deploy.sh | sh
set -e

echo "=== Grammaticus 一键部署 ==="

# ── 非 root 用户自动用 sudo ──
SUDO=""
if [ "$(id -u)" != "0" ]; then
  SUDO="sudo"
fi

# ── 安装基础工具(curl/git/tar 缺一就装) ──
if ! command -v curl >/dev/null 2>&1 || ! command -v git >/dev/null 2>&1 || ! command -v tar >/dev/null 2>&1; then
  echo "--- 安装基础工具 curl/git/tar ---"
  if command -v apt-get >/dev/null 2>&1; then $SUDO apt-get update -y && $SUDO apt-get install -y curl git tar
  elif command -v dnf >/dev/null 2>&1; then $SUDO dnf install -y curl git tar
  elif command -v yum >/dev/null 2>&1; then $SUDO yum install -y curl git tar
  fi
fi

# ── 安装 Node.js 24(直接下载二进制包) ──
NEED_NODE=1
if command -v node >/dev/null 2>&1; then
  NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_VER" -ge 20 ]; then
    echo "--- Node.js $(node -v) 已安装 ---"
    NEED_NODE=0
  fi
fi

if [ "$NEED_NODE" = "1" ]; then
  echo "--- 下载 Node.js 24 二进制包 ---"
  NODE_ARCH=$(uname -m)
  if [ "$NODE_ARCH" = "x86_64" ]; then
    NODE_ARCH="x64"
  elif [ "$NODE_ARCH" = "aarch64" ]; then
    NODE_ARCH="arm64"
  fi
  
  # 获取最新 v24 版本号
  NODE_VERSION=$(curl -s https://nodejs.org/dist/index.json | grep -o '"version":"v24\.[0-9]*\.[0-9]*"' | head -1 | sed 's/"version":"//;s/"//')
  if [ -z "$NODE_VERSION" ]; then
    NODE_VERSION="v24.0.0"
  fi
  
  echo "--- 安装 Node.js $NODE_VERSION ($NODE_ARCH) ---"
  cd /tmp
  curl -fsSL "https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-linux-$NODE_ARCH.tar.xz" -o node.tar.xz
  tar -xf node.tar.xz
  $SUDO cp -r node-$NODE_VERSION-linux-$NODE_ARCH/* /usr/local/
  rm -rf node-$NODE_VERSION-linux-$NODE_ARCH node.tar.xz
  cd ~
  
  echo "--- Node.js 版本: $(node -v) ---"
  echo "--- npm 版本: $(npm -v) ---"
fi

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

# ── 导入种子数据(容错) ──
echo "--- 导入数据 ---"
npm run seed 2>/dev/null || echo "(seed 跳过,不影响核心功能)"
npm run seed-nce 2>/dev/null || true

# ── 创建 .env ──
if [ ! -f .env ]; then
  echo "LLM_API_KEY=sk-89728a3824bf4b19a9d55a4c7320812c" > .env
  echo "LLM_BASE_URL=https://api.deepseek.com/v1" >> .env
  echo "LLM_MODEL=deepseek-chat" >> .env
else
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