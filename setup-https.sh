#!/bin/sh
# Grammaticus HTTPS 配置脚本 — nginx 反代 + Let's Encrypt 免费证书
# 前提: 域名 A 记录已指向本服务器; 云防火墙已放行 80/443
# 用法: curl -fsSL "https://raw.githubusercontent.com/ewemark/grammaticus/master/setup-https.sh?v=1" | sh -s -- grammaticus.xyz
set -e

DOMAIN="${1:-grammaticus.xyz}"
echo "=== Grammaticus HTTPS 配置 ($DOMAIN) ==="

SUDO=""
if [ "$(id -u)" != "0" ] && command -v sudo >/dev/null 2>&1; then
  SUDO="sudo -n"
fi

# ── 1. 安装 nginx ──
if ! command -v nginx >/dev/null 2>&1; then
  echo "--- 安装 nginx ---"
  $SUDO dnf install -y nginx || $SUDO yum install -y nginx || $SUDO apt-get install -y nginx
fi

# SELinux: 允许 nginx 转发到后端端口
$SUDO setsebool -P httpd_can_network_connect 1 2>/dev/null || true

# ── 2. ACME 验证目录 ──
$SUDO mkdir -p /var/www/grammaticus
$SUDO chown -R "$(id -un)" /var/www/grammaticus 2>/dev/null || true

# ── 3. 先写 HTTP 配置(用于证书验证) ──
echo "--- 配置 nginx(HTTP) ---"
$SUDO tee /etc/nginx/conf.d/grammaticus.conf >/dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    location /.well-known/acme-challenge/ { root /var/www/grammaticus; }
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
    }
}
EOF
$SUDO nginx -t
$SUDO systemctl enable nginx 2>/dev/null || true
$SUDO systemctl restart nginx

# ── 4. 申请 Let's Encrypt 证书 ──
echo "--- 申请证书(约 30 秒) ---"
if [ ! -x "$HOME/.acme.sh/acme.sh" ]; then
  curl -fsSL https://get.acme.sh | sh -s email=admin@"$DOMAIN" >/dev/null 2>&1 || sh <(curl -fsSL https://get.acme.sh) -s email=admin@"$DOMAIN"
fi
"$HOME/.acme.sh/acme.sh" --set-default-ca --server letsencrypt
"$HOME/.acme.sh/acme.sh" --issue -d "$DOMAIN" --webroot /var/www/grammaticus

# ── 5. 安装证书到 nginx ──
echo "--- 安装证书 ---"
$SUDO mkdir -p /etc/nginx/ssl
"$HOME/.acme.sh/acme.sh" --install-cert -d "$DOMAIN" \
  --key-file "/etc/nginx/ssl/$DOMAIN.key" \
  --fullchain-file "/etc/nginx/ssl/$DOMAIN.pem" \
  --reloadcmd "nginx -s reload"

# ── 6. 切换为 HTTPS 配置(HTTP 自动跳转) ──
echo "--- 配置 nginx(HTTPS) ---"
$SUDO tee /etc/nginx/conf.d/grammaticus.conf >/dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    location /.well-known/acme-challenge/ { root /var/www/grammaticus; }
    location / { return 301 https://$DOMAIN\$request_uri; }
}
server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    ssl_certificate /etc/nginx/ssl/$DOMAIN.pem;
    ssl_certificate_key /etc/nginx/ssl/$DOMAIN.key;
    ssl_session_timeout 1d;
    ssl_protocols TLSv1.2 TLSv1.3;
    client_max_body_size 20m;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
    }
}
EOF
$SUDO nginx -t
$SUDO systemctl reload nginx || $SUDO nginx -s reload

echo ""
echo "========================================="
echo "  HTTPS 配置完成!"
echo "  访问: https://$DOMAIN"
echo "  证书自动续期: acme.sh 已加 cron"
echo "========================================="