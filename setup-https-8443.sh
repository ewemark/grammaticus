#!/bin/sh
# Grammaticus HTTPS(8443 免备案方案)— nginx 反代 + Let's Encrypt DNS 验证证书
# 前提: 域名已实名且 A 记录生效; 已在阿里云创建 AccessKey; 云防火墙已放行 8443
# 用法:
#   export Ali_Key="你的AccessKeyID" Ali_Secret="你的AccessKeySecret"
#   curl -fsSL "https://raw.githubusercontent.com/ewemark/grammaticus/master/setup-https-8443.sh?v=1" | sh -s -- grammaticus.xyz
set -e

DOMAIN="${1:-grammaticus.xyz}"
echo "=== Grammaticus HTTPS 8443 免备案配置 ($DOMAIN) ==="

if [ -z "$Ali_Key" ] || [ -z "$Ali_Secret" ]; then
  echo "错误: 请先 export Ali_Key 和 Ali_Secret(阿里云 AccessKey)"
  exit 1
fi

SUDO=""
if [ "$(id -u)" != "0" ] && command -v sudo >/dev/null 2>&1; then
  SUDO="sudo -n"
fi

# ── 1. nginx ──
if ! command -v nginx >/dev/null 2>&1; then
  echo "--- 安装 nginx ---"
  $SUDO dnf install -y nginx || $SUDO yum install -y nginx
fi
$SUDO setsebool -P httpd_can_network_connect 1 2>/dev/null || true

# SELinux 允许 nginx 监听 8443
if command -v getenforce >/dev/null 2>&1 && [ "$(getenforce 2>/dev/null)" = "Enforcing" ]; then
  if ! command -v semanage >/dev/null 2>&1; then
    $SUDO dnf install -y policycoreutils-python-utils 2>/dev/null || true
  fi
  $SUDO semanage port -a -t http_port_t -p tcp 8443 2>/dev/null \
    || $SUDO semanage port -m -t http_port_t -p tcp 8443 2>/dev/null \
    || echo "(SELinux 端口标记跳过,若 nginx 启动失败请手动处理)"
fi

# ── 2. 系统防火墙放行 8443 ──
$SUDO firewall-cmd --permanent --add-port=8443/tcp 2>/dev/null && $SUDO firewall-cmd --reload 2>/dev/null || true

# ── 3. acme.sh + DNS 验证签发证书 ──
echo "--- 申请证书(DNS 验证,约 1 分钟) ---"
if [ ! -x "$HOME/.acme.sh/acme.sh" ]; then
  curl -fsSL https://get.acme.sh | sh -s email=admin@"$DOMAIN" >/dev/null 2>&1 || sh <(curl -fsSL https://get.acme.sh) -s email=admin@"$DOMAIN"
fi
export Ali_Key Ali_Secret
"$HOME/.acme.sh/acme.sh" --set-default-ca --server letsencrypt
"$HOME/.acme.sh/acme.sh" --issue --dns dns_ali -d "$DOMAIN"

# ── 4. 安装证书 ──
$SUDO mkdir -p /etc/nginx/ssl
"$HOME/.acme.sh/acme.sh" --install-cert -d "$DOMAIN" \
  --key-file "/etc/nginx/ssl/$DOMAIN.key" \
  --fullchain-file "/etc/nginx/ssl/$DOMAIN.pem" \
  --reloadcmd "nginx -s reload"

# ── 5. nginx 配置:8443 → 应用 3000 ──
echo "--- 配置 nginx(8443) ---"
$SUDO tee /etc/nginx/conf.d/grammaticus.conf >/dev/null <<EOF
server {
    listen 8443 ssl http2;
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
$SUDO systemctl enable nginx 2>/dev/null || true
$SUDO systemctl restart nginx

# ── 6. 自检 ──
sleep 2
if curl -sk --max-time 10 --resolve "$DOMAIN:8443:127.0.0.1" "https://$DOMAIN:8443/api/health" | grep -q ok; then
  echo ""
  echo "========================================="
  echo "  HTTPS 配置完成!"
  echo "  访问: https://$DOMAIN:8443"
  echo "  证书 90 天自动续期(acme.sh cron)"
  echo "========================================="
else
  echo "!! 自检失败: pm2 status / systemctl status nginx 查看"
  exit 1
fi