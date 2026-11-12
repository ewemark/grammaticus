#!/bin/sh
# Grammaticus 一键部署脚本
# 适用: Ubuntu 20.04+ / Debian 11+ (阿里云/腾讯云/任意 Linux VPS)
# 用法: chmod +x deploy.sh && ./deploy.sh
set -e

echo "=== Grammaticus 一键部署 ==="

# 1. 安装 Node.js 24 (如果未安装)
if ! command -v node >/dev/null 2>&1; then
  echo "--- 安装 Node.js 24 ---"
  curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# 2. 克隆仓库
echo "--- 克隆代码 ---"
if [ -d grammaticus ]; then
  cd grammaticus
  git pull origin master
else
  git clone https://github.com/ewemark/grammaticus.git
  cd grammaticus
fi

# 3. 安装依赖 & 构建前端
echo "--- 安装依赖 ---"
npm ci
echo "--- 构建前端 ---"
npm run build

# 4. 导入种子数据
echo "--- 导入数据 ---"
npm run seed
npm run seed-nce 2>/dev/null || true

# 5. 创建 .env (如果不存在)
if [ ! -f .env ]; then
  cp .env.example .env
  echo ">>> 请编辑 .env 填入 LLM_API_KEY <<<"
fi

# 6. 用 PM2 启动(守护进程,崩溃自动重启)
if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi

pm2 delete grammaticus 2>/dev/null || true
NODE_ENV=production pm2 start server/index.ts \
  --name grammaticus \
  --interpreter node_modules/.bin/tsx \
  --env NODE_ENV=production \
  --env PORT=3000 \
  --env LLM_API_KEY="${LLM_API_KEY:-sk-89728a3824bf4b19a9d55a4c7320812c}"

pm2 save
pm2 startup 2>/dev/null || true

echo ""
echo "=== 部署完成 ==="
echo "访问: http://$(curl -s ifconfig.me):3000"
echo "状态: pm2 status"
echo "日志: pm2 logs grammaticus"