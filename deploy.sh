#!/bin/bash
# =============================================================
# CloWeather 一键部署脚本
# 部署到 Cloudflare Workers + Pages
#
# 前置条件:
#   1. 在 https://dash.cloudflare.com 注册账号
#   2. 准备好 OpenWeatherMap API Key
#
# 用法:
#   chmod +x deploy.sh
#   ./deploy.sh
# =============================================================

set -e

echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║      CloWeather ☁️  一键部署                ║"
echo "╠═══════════════════════════════════════════╝"
echo ""

# ---- 检查 API Key ----
if [ -f .env ]; then
  OWM_KEY=$(grep OWM_API_KEY .env | cut -d= -f2)
fi

if [ -z "$OWM_KEY" ]; then
  read -p "👉 输入你的 OpenWeatherMap API Key: " OWM_KEY
fi

if [ -z "$OWM_KEY" ]; then
  echo "❌ API Key 不能为空"
  exit 1
fi

echo "✅ API Key: 已配置"

# ---- 写入 worker.js ----
echo "📝 配置 worker.js..."
sed -i "s/在此填入你的OpenWeatherMap API Key/$OWM_KEY/g" worker.js

# ---- 安装 wrangler ----
echo "📦 安装 wrangler..."
npm install -g wrangler 2>/dev/null || echo "   wrangler 已安装"

# ---- 登录 Cloudflare ----
echo ""
echo "🔑 请在你的浏览器中登录 Cloudflare..."
npx wrangler login

# ---- 部署 Worker ----
echo ""
echo "🚀 部署 Worker 到 Cloudflare..."
npx wrangler deploy worker.js --name cloweather 2>&1 | tee /tmp/wrangler-output.txt

# 提取 Worker 域名
WORKER_URL=$(grep -oP 'https?://[a-zA-Z0-9.-]+\.workers\.dev' /tmp/wrangler-output.txt | head -1)

if [ -z "$WORKER_URL" ]; then
  echo "⚠️  未能自动获取 Worker 域名，请从上方输出中手动复制"
  read -p "👉 Worker 域名: " WORKER_URL
fi

echo ""
echo "✅ Worker 部署成功: $WORKER_URL"

# ---- 更新 index.html 中的域名 ----
echo "📝 配置 index.html..."
sed -i "s|你的Cloudflare Worker域名|$WORKER_URL|g" index.html
echo "✅ index.html 已更新"

# ---- 部署 Pages ----
echo ""
echo "🚀 部署前端到 Cloudflare Pages..."
npx wrangler pages deploy . --project-name cloweather-app --exclude "node_modules" --exclude ".git" --exclude "server.js" --exclude "setup.js" --exclude ".env" --exclude "deploy.sh" --exclude "*.json" 2>&1 | tee /tmp/pages-output.txt

PAGES_URL=$(grep -oP 'https?://[a-zA-Z0-9.-]+\.pages\.dev' /tmp/pages-output.txt | head -1)

if [ -z "$PAGES_URL" ]; then
  echo "⚠️  未能自动获取 Pages 域名"
  PAGES_URL="https://cloweather-app.pages.dev"
fi

echo ""
echo "✅ Pages 部署成功: $PAGES_URL"

# ---- 把前端域名加入 Worker 白名单 ----
echo "📝 将 $PAGES_URL 加入 Worker CORS 白名单..."
FRONTEND_DOMAIN=$(echo $PAGES_URL | sed 's|https://||')
sed -i "s|"https://cloweather.pages.dev"|&\n  "https://${FRONTEND_DOMAIN}",|g" worker.js

echo ""
echo "🔄 重新部署 Worker（更新 CORS 白名单）..."
npx wrangler deploy worker.js --name cloweather

# ---- 完成 ----
echo ""
echo "╔═══════════════════════════════════════════╗"
echo "║  🎉 部署完成！                              ║"
echo "╠═══════════════════════════════════════════╣"
echo "║                                            ║"
echo "║  前端地址: $PAGES_URL          ║"
echo "║                                            ║"
echo "║  打开浏览器访问即用 ✅                       ║"
echo "╚═══════════════════════════════════════════╝"
