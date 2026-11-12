#!/bin/sh
# Grammaticus 服务器更新脚本 — 拉取最新代码,保留数据与依赖
# 用法(在服务器上): curl -fsSL "https://raw.githubusercontent.com/ewemark/grammaticus/master/update.sh?v=1" | sh
set -e

echo "=== Grammaticus 更新 ==="
export PATH="$HOME/.npm-global/bin:$HOME/.local/node/bin:$PATH"

APP_DIR="$HOME/grammaticus"
NEW_DIR="/tmp/grammaticus-new"

# ── 下载最新代码 ──
echo "--- 下载最新代码 ---"
rm -rf "$NEW_DIR" /tmp/g-update.tgz
mkdir -p "$NEW_DIR"
curl -fsSL https://github.com/ewemark/grammaticus/archive/refs/heads/master.tar.gz -o /tmp/g-update.tgz
tar -xzf /tmp/g-update.tgz -C "$NEW_DIR" --strip-components=1

# ── 保留:依赖 / 配置 / 数据库 ──
echo "--- 保留 node_modules / .env / 数据库 ---"
if [ -d "$APP_DIR/node_modules" ]; then
  mv "$APP_DIR/node_modules" "$NEW_DIR/node_modules"
fi
[ -f "$APP_DIR/.env" ] && cp "$APP_DIR/.env" "$NEW_DIR/.env"
[ -f "$APP_DIR/data/grammaticus.db" ] && cp "$APP_DIR/data/grammaticus.db" "$NEW_DIR/data/grammaticus.db" 2>/dev/null || true

# ── .env 兜底:缺什么补什么(LLM Key / JWT 密钥) ──
if [ ! -f "$NEW_DIR/.env" ]; then
  cat > "$NEW_DIR/.env" <<EOF
LLM_API_KEY=sk-89728a3824bf4b19a9d55a4c7320812c
LLM_BASE_URL=https://api.deepseek.com/v1
LLM_MODEL=deepseek-chat
JWT_SECRET=$(node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))')
EOF
else
  grep -q "LLM_API_KEY" "$NEW_DIR/.env" || echo "LLM_API_KEY=sk-89728a3824bf4b19a9d55a4c7320812c" >> "$NEW_DIR/.env"
  grep -q "JWT_SECRET" "$NEW_DIR/.env" || echo "JWT_SECRET=$(node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))')" >> "$NEW_DIR/.env"
fi

# ── 替换 ──
rm -rf "$APP_DIR"
mv "$NEW_DIR" "$APP_DIR"
cd "$APP_DIR"

# ── 依赖有变化才重装(对比 package.json 哈希) ──
if ! cmp -s package.json /tmp/g-last-package.json 2>/dev/null; then
  echo "--- 依赖有更新,重新安装 ---"
  npm install --no-audit --no-fund --maxsockets=4
fi
cp package.json /tmp/g-last-package.json

# ── 重建前端 + 重启 ──
echo "--- 重建前端 ---"
NODE_OPTIONS="--max-old-space-size=1024" npm run build
echo "--- 重启应用 ---"
pm2 restart grammaticus 2>/dev/null || NODE_ENV=production PORT=3000 pm2 start server/index.ts --name grammaticus --interpreter "$APP_DIR/node_modules/.bin/tsx"
pm2 save

sleep 4
if curl -s --max-time 8 http://localhost:3000/api/health | grep -q ok; then
  echo "=== 更新完成,服务正常 ==="
else
  echo "!! 更新后自检失败: pm2 logs grammaticus --lines 30"
  exit 1
fi