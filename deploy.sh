#!/bin/sh
# Grammaticus 一键部署脚本 v6
# 特点: 不需要 git(tarball 下载代码), Node.js 二进制安装, 小内存自动加 swap, PM2 用户目录安装
# 用法: curl -fsSL "https://raw.githubusercontent.com/ewemark/grammaticus/master/deploy.sh?v=6" | sh
set -e

echo "=== Grammaticus 一键部署 v6 ==="

# ── sudo(非 root 时用 sudo -n 免交互,失败自动降级用户目录安装) ──
SUDO=""
if [ "$(id -u)" != "0" ] && command -v sudo >/dev/null 2>&1; then
  SUDO="sudo -n"
fi

# ── 小内存服务器自动创建 2GB swap(防 npm install 被 OOM 杀掉) ──
HAS_SWAP=$(swapon --show 2>/dev/null | wc -l)
MEM_KB=$(awk '/MemTotal/ {print $2}' /proc/meminfo)
if [ "$HAS_SWAP" = "0" ] && [ "$MEM_KB" -lt 3500000 ]; then
  echo "--- 检测到内存 $((MEM_KB/1024))MB 且无 swap,创建 2GB swap(约 1 分钟) ---"
  $SUDO dd if=/dev/zero of=/swapfile bs=1M count=2048 status=none
  $SUDO chmod 600 /swapfile
  $SUDO mkswap /swapfile >/dev/null
  $SUDO swapon /swapfile
  # 开机自动挂载
  grep -q '/swapfile' /etc/fstab 2>/dev/null || echo '/swapfile none swap sw 0 0' | $SUDO tee -a /etc/fstab >/dev/null
  echo "--- swap 已启用: $(free -h | awk '/Swap/ {print $2}') ---"
fi

# ── 编译工具链(better-sqlite3 等原生模块的保险;装不上也不致命) ──
echo "--- 检查编译工具链 ---"
if command -v dnf >/dev/null 2>&1; then
  $SUDO dnf install -y gcc-c++ make python3 >/dev/null 2>&1 || echo "(跳过,将尝试预编译二进制)"
elif command -v yum >/dev/null 2>&1; then
  $SUDO yum install -y gcc-c++ make python3 >/dev/null 2>&1 || echo "(跳过,将尝试预编译二进制)"
elif command -v apt-get >/dev/null 2>&1; then
  $SUDO apt-get update -y >/dev/null 2>&1 && $SUDO apt-get install -y build-essential python3 >/dev/null 2>&1 || echo "(跳过)"
fi

# ── Node.js 24(二进制包,装到 /usr/local;无 root 则装 ~/.local/node) ──
NEED_NODE=1
if command -v node >/dev/null 2>&1; then
  NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_VER" -ge 20 ]; then
    echo "--- Node.js $(node -v) 已安装 ---"
    NEED_NODE=0
  fi
fi

if [ "$NEED_NODE" = "1" ]; then
  NODE_ARCH=$(uname -m)
  case "$NODE_ARCH" in
    x86_64) NODE_ARCH="x64" ;;
    aarch64|arm64) NODE_ARCH="arm64" ;;
  esac
  NODE_VERSION=$(curl -s --max-time 20 https://nodejs.org/dist/index.json | grep -o '"version":"v24\.[0-9]*\.[0-9]*"' | head -1 | sed 's/"version":"//;s/"//')
  if [ -z "$NODE_VERSION" ]; then NODE_VERSION="v24.4.1"; fi
  echo "--- 下载 Node.js $NODE_VERSION ($NODE_ARCH),约 30MB,请稍候 ---"
  cd /tmp
  curl -fsSL "https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-linux-$NODE_ARCH.tar.xz" -o node.tar.xz
  tar -xf node.tar.xz
  if $SUDO cp -r "node-$NODE_VERSION-linux-$NODE_ARCH"/* /usr/local/ 2>/dev/null; then
    echo "--- Node.js 安装到 /usr/local ---"
  else
    mkdir -p "$HOME/.local"
    rm -rf "$HOME/.local/node"
    mv "node-$NODE_VERSION-linux-$NODE_ARCH" "$HOME/.local/node"
    grep -q '.local/node/bin' "$HOME/.bashrc" 2>/dev/null || echo 'export PATH="$HOME/.local/node/bin:$PATH"' >> "$HOME/.bashrc"
    PATH="$HOME/.local/node/bin:$PATH"
    export PATH
    echo "--- Node.js 安装到 ~/.local/node(用户目录) ---"
  fi
  rm -rf "node-$NODE_VERSION-linux-$NODE_ARCH" node.tar.xz
  hash -r 2>/dev/null || true
  cd ~
fi

echo "--- Node: $(node -v) / npm: $(npm -v) ---"

# ── 下载代码(tarball,不需要 git) ──
APP_DIR="$HOME/grammaticus"
SRC_DIR="/tmp/grammaticus-src"
echo "--- 下载最新代码 ---"
rm -rf "$SRC_DIR" /tmp/g.tgz
mkdir -p "$SRC_DIR"
curl -fsSL https://github.com/ewemark/grammaticus/archive/refs/heads/master.tar.gz -o /tmp/g.tgz
tar -xzf /tmp/g.tgz -C "$SRC_DIR" --strip-components=1

# 保留旧部署的 .env 与数据库(重复部署不丢账号/留言数据)
if [ -d "$APP_DIR" ]; then
  [ -f "$APP_DIR/.env" ] && cp "$APP_DIR/.env" "$SRC_DIR/.env"
  [ -f "$APP_DIR/data/grammaticus.db" ] && cp "$APP_DIR/data/grammaticus.db" "$SRC_DIR/data/grammaticus.db" 2>/dev/null || true
  rm -rf "$APP_DIR"
fi
mv "$SRC_DIR" "$APP_DIR"
cd "$APP_DIR"

# ── 安装依赖 + 构建 ──
echo "--- 安装依赖(首次约 3-6 分钟,小内存机器更慢,耐心等) ---"
npm install --no-audit --no-fund --maxsockets=4
echo "--- 构建前端 ---"
NODE_OPTIONS="--max-old-space-size=1024" npm run build

# ── 种子数据(SQLite 词库/课文,供账号云同步等使用) ──
echo "--- 导入种子数据 ---"
npm run seed 2>/dev/null || echo "(seed 跳过)"
npm run seed-nce 2>/dev/null || echo "(seed-nce 跳过)"

# ── .env(LLM Key + JWT 密钥自动生成) ──
gen_jwt() { node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))'; }
if [ ! -f .env ]; then
  cat > .env <<EOF
LLM_API_KEY=sk-89728a3824bf4b19a9d55a4c7320812c
LLM_BASE_URL=https://api.deepseek.com/v1
LLM_MODEL=deepseek-chat
JWT_SECRET=$(gen_jwt)
EOF
else
  grep -q "LLM_API_KEY" .env || echo "LLM_API_KEY=sk-89728a3824bf4b19a9d55a4c7320812c" >> .env
  grep -q "JWT_SECRET" .env || echo "JWT_SECRET=$(gen_jwt)" >> .env
fi

# ── PM2(装到用户目录,无需 root 写系统目录) ──
if ! command -v pm2 >/dev/null 2>&1; then
  echo "--- 安装 PM2(用户目录) ---"
  npm config set prefix "$HOME/.npm-global"
  grep -q '.npm-global/bin' "$HOME/.bashrc" 2>/dev/null || echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> "$HOME/.bashrc"
  PATH="$HOME/.npm-global/bin:$PATH"
  export PATH
  npm install -g pm2 --no-audit --no-fund
fi

echo "--- 启动应用 ---"
pm2 delete grammaticus 2>/dev/null || true
NODE_ENV=production PORT=3000 pm2 start server/index.ts \
  --name grammaticus \
  --interpreter "$APP_DIR/node_modules/.bin/tsx"
pm2 save

# ── 重启后自动恢复(用户 crontab,无需 root) ──
PM2_BIN=$(command -v pm2)
(crontab -l 2>/dev/null | grep -v 'pm2 resurrect'; echo "@reboot $PM2_BIN resurrect") | crontab -

# ── 验证 ──
sleep 4
echo "--- 本机自检 ---"
if curl -s --max-time 8 http://localhost:3000/api/health | grep -q ok; then
  SERVER_IP=$(curl -s --max-time 8 ifconfig.me 2>/dev/null || echo "你的服务器IP")
  echo ""
  echo "========================================="
  echo "  部署成功!"
  echo "  访问: http://$SERVER_IP:3000"
  echo "  (记得在云控制台防火墙放行 3000 端口)"
  echo "  状态: pm2 status"
  echo "  日志: pm2 logs grammaticus"
  echo "========================================="
else
  echo "!! 自检失败,查看日志: pm2 logs grammaticus --lines 30"
  exit 1
fi