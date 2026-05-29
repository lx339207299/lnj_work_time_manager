#!/bin/bash
set -e

# ══════════════════════════════════════════════
# 微信小程序一键部署脚本
# 用法: ./deploy-weapp.sh <test|prod> [版本号] [描述]
# ══════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# ─── 参数解析 ──────────────────────────────
ENV="$1"
VERSION="${2:-auto}"
DESC="${3:-}"

if [ "$ENV" != "test" ] && [ "$ENV" != "prod" ]; then
    echo "❌ 用法: ./deploy-weapp.sh <test|prod> [版本号] [描述]"
    echo ""
    echo "  test  → 测试环境体验版 (API: test-yggl.bear0811.cn)"
    echo "  prod  → 生产环境体验版 (API: yggl.bear0811.cn)"
    exit 1
fi

# ─── 环境配置 ──────────────────────────────
if [ "$ENV" = "test" ]; then
    API_URL="https://test-yggl.bear0811.cn/api"
    ROBOT=2
    MODE="development"
    TAG="测试版"
else
    API_URL="https://yggl.bear0811.cn/api"
    ROBOT=1
    MODE="production"
    TAG="正式版"
fi

echo ""
echo "╔═══════════════════════════════════════╗"
echo "║  微信小程序部署 - ${TAG}                ║"
echo "╚═══════════════════════════════════════╝"
echo ""
echo "📋 配置:"
echo "   环境:    $ENV"
echo "   API:     $API_URL"
echo "   版本:    $VERSION"
echo "   描述:    ${DESC:-无}"
echo "   机器人:  $ROBOT"
echo ""

# ─── 前置检查 ─────────────────────────────
if [ ! -f "private.key" ]; then
    echo "❌ 缺少 private.key"
    echo "   请从小程序后台「开发 → 开发设置 → 小程序代码上传密钥」下载"
    echo "   放到 $(pwd)/ 目录下"
    exit 1
fi

if [ ! -f "project.config.json" ]; then
    echo "❌ 缺少 project.config.json"
    exit 1
fi

# ─── 安装依赖 ─────────────────────────────
if [ ! -d "node_modules/miniprogram-ci" ]; then
    echo "📦 miniprogram-ci 未安装，正在安装..."
    npm install --no-audit --no-fund
fi

# ─── 构建 ─────────────────────────────────
echo "🔨 开始构建 ($MODE 模式)..."
export TARO_APP_API_URL="$API_URL"
export NODE_ENV="$MODE"

# Node 17+ (OpenSSL 3.x) 与 webpack 4 不兼容，test 和 prod 都需要 openssl-legacy-provider
export NODE_OPTIONS="--openssl-legacy-provider"
BUILD_CMD="npx taro build --type weapp"

$BUILD_CMD

if [ ! -d "dist" ]; then
    echo "❌ 构建失败：dist 目录不存在"
    exit 1
fi

echo "✅ 构建完成"

# ─── 上传 ─────────────────────────────────
echo "📤 上传到微信后台..."
UPLOAD_ARGS=(
    --pp .
    --pkp private.key
    --appid wx35ed1bc9f658909b
    --uv "$VERSION"
    -r "$ROBOT"
)
if [ -n "$DESC" ]; then
    UPLOAD_ARGS+=(--ud "$DESC")
fi

npx miniprogram-ci upload "${UPLOAD_ARGS[@]}"

# ─── 完成 ─────────────────────────────────
echo ""
echo "╔═══════════════════════════════════════╗"
echo "║  ✅ 上传成功！                         ║"
echo "╚═══════════════════════════════════════╝"
echo ""
echo "📱 手机查看步骤:"
echo "   微信 → 小程序 → LNJ工时管理"
echo "   → 右上角「...」→「开发调试」→ 切换到「体验版」"
echo ""
echo "   ${TAG} API: $API_URL"
echo ""
