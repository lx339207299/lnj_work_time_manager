#!/bin/bash

# 部署脚本使用说明：
# 1. 给脚本添加执行权限: chmod +x deploy.sh
# 2. 运行脚本: ./deploy.sh <环境> [服务]
#    环境: prod | test | dev | all
#    服务: server | admin | all（默认，同时部署 server + admin）
#    示例:
#      ./deploy.sh prod server    # 只部署生产环境后端
#      ./deploy.sh prod admin     # 只部署生产环境前端
#      ./deploy.sh prod           # 部署生产环境全部（默认）

set -euo pipefail

ENV=${1:-all}
SERVICE=${2:-all}
HEALTH_RETRIES=40
HEALTH_INTERVAL=3

echo "🚀 开始部署: 环境=${ENV}  服务=${SERVICE}"

# ── 清理 ──
echo "🧹 清理悬空构建缓存..."
docker builder prune --force 2>/dev/null || true

# ── 部署 server ──

deploy_server() {
    local env_file=$1
    local profile=$2
    local label=$3
    local svc=$4
    local health_url=$5

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📦 部署 ${label} 后端"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if [ ! -f "$env_file" ]; then
        echo "❌ 错误：未找到 ${env_file}，跳过。"
        return 1
    fi

    # 备份
    local old_image=""
    old_image=$(docker image ls lnj_work_time_manager-${svc} --format '{{.ID}}' 2>/dev/null || echo "")
    if [ -n "$old_image" ]; then
        docker tag "$old_image" "lnj_work_time_manager-${svc}:rollback" 2>/dev/null || true
        echo "📸 已保存回滚镜像: ${old_image:0:12}"
    fi

    # 构建
    echo "🔨 构建 server 镜像..."
    if ! docker compose --env-file "$env_file" --profile "$profile" build "$svc"; then
        echo "❌ server 构建失败"
        return 1
    fi

    # 验证
    echo "🔍 验证构建产物..."
    if ! docker run --rm --entrypoint sh "lnj_work_time_manager-${svc}" -c "test -f dist/main.js"; then
        echo "❌ 构建验证失败：dist/main.js 不存在！"
        echo "   镜像未部署，线上服务不受影响。"
        return 1
    fi
    echo "   ✅ dist/main.js 存在"

    # 部署
    echo "🔄 重启服务 (不动数据库)..."
    docker compose --env-file "$env_file" --profile "$profile" up -d --no-deps "$svc"

    # ── 冒烟测试（先等 NestJS 启动日志，再 HTTP 验证） ──
    echo "🩺 等待服务就绪..."

    # 阶段 1：等 NestJS 启动完成（跳过 prisma migrate 耗时）
    local log_retries=60
    for i in $(seq 1 $log_retries); do
        if docker logs "lnj_work_time_manager_${svc//-/_}" 2>/dev/null | grep -q "Nest application successfully started"; then
            echo "   ✅ NestJS 已启动 (第 ${i}/${log_retries} 次检查)"
            break
        fi
        if [ "$i" -eq "$log_retries" ]; then
            echo "❌ 超时：${log_retries} 次未等到 NestJS 启动日志"
            echo "   最后 20 行日志："
            docker logs "lnj_work_time_manager_${svc//-/_}" --tail 20 2>/dev/null || true
            return 1
        fi
        sleep 2
    done

    # 阶段 2：HTTP 冒烟测试
    echo "🩺 HTTP 冒烟测试 (最多 ${HEALTH_RETRIES} 次)..."
    for i in $(seq 1 $HEALTH_RETRIES); do
        if curl -sf -o /dev/null "$health_url" 2>/dev/null; then
            echo "   ✅ 第 ${i} 次通过 — HTTP 200"
            echo ""
            echo "🎉 ${label} 后端部署成功！"
            docker rmi "lnj_work_time_manager-${svc}:rollback" 2>/dev/null || true
            return 0
        fi
        printf "   ⏳ 第 %2d 次未就绪，%ds 后重试...\n" "$i" "$HEALTH_INTERVAL"
        sleep $HEALTH_INTERVAL
    done

    # 回滚
    echo "❌ 冒烟测试失败 (${HEALTH_RETRIES} 次均无响应)"
    if docker image inspect "lnj_work_time_manager-${svc}:rollback" &>/dev/null; then
        echo "🔄 正在回滚到旧版本..."
        docker tag "lnj_work_time_manager-${svc}:rollback" "lnj_work_time_manager-${svc}:latest"
        docker compose --env-file "$env_file" --profile "$profile" up -d --no-deps "$svc"
        echo "✅ 已回滚到旧版本"
    else
        echo "⚠️  无回滚镜像可用，请手动处理"
    fi
    return 1
}

# ── 部署 admin ──
# 在宿主机直接构建（Docker 容器内存不够跑 vite），然后打包进 nginx 镜像

deploy_admin() {
    local env_file=$1
    local profile=$2
    local label=$3
    local svc=$4

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📦 部署 ${label} 前端"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if [ ! -f "$env_file" ]; then
        echo "❌ 错误：未找到 ${env_file}，跳过。"
        return 1
    fi

    # ── 1. 宿主机构建 ──
    echo "🔨 宿主机安装依赖..."
    (cd admin && npm install --silent) || { echo "❌ npm install 失败"; return 1; }

    echo "🔨 tsc 类型检查..."
    (cd admin && npx tsc -b) || { echo "❌ tsc 失败"; return 1; }

    echo "🔨 vite 打包 (1GB 堆内存)..."
    (cd admin && NODE_OPTIONS=--max-old-space-size=1024 npx vite build) || {
        echo "❌ vite 构建失败"
        return 1
    }

    # ── 2. 打包进 nginx 镜像 ──
    echo "🐳 构建 Docker 镜像..."
    docker build -f Dockerfile.serve -t "lnj_work_time_manager-${svc}" . || {
        echo "❌ Docker 构建失败"
        return 1
    }

    # ── 3. 部署 ──
    echo "🔄 重启前端服务..."
    docker compose --env-file "$env_file" --profile "$profile" up -d --no-deps "$svc"

    echo ""
    echo "🎉 ${label} 前端部署成功！"
    return 0
}

# ── 入口 ──

deploy_prod() {
    local target=$1
    if [ "$target" = "all" ] || [ "$target" = "server" ]; then
        deploy_server ".env.prod" "prod" "生产" "server-prod" "http://localhost:3002/api/"
    fi
    if [ "$target" = "all" ] || [ "$target" = "admin" ]; then
        deploy_admin ".env.prod" "prod" "生产" "admin-prod"
    fi
}

deploy_test() {
    local target=$1
    if [ "$target" = "all" ] || [ "$target" = "server" ]; then
        deploy_server ".env.test" "test" "测试" "server-test" "http://localhost:3001/api/"
    fi
    if [ "$target" = "all" ] || [ "$target" = "admin" ]; then
        deploy_admin ".env.test" "test" "测试" "admin-test"
    fi
}

deploy_dev() {
    if [ -f .env.dev ]; then
        echo "🛠️ 正在启动开发环境数据库 (使用 .env.dev)..."
        docker compose --env-file .env.dev --profile dev up -d
    else
        echo "❌ 错误：未找到 .env.dev 文件，跳过开发环境部署。"
    fi
}

# ── 路由 ──

case "$ENV" in
    prod)  deploy_prod "$SERVICE" ;;
    test)  deploy_test "$SERVICE" ;;
    dev)   deploy_dev ;;
    all)   deploy_prod "$SERVICE"; deploy_test "$SERVICE" ;;
    *)     echo "❌ 未知环境: $ENV"; exit 1 ;;
esac

# ── Nginx 更新 ──

if [ "$ENV" != "dev" ]; then
    NGINX_CONF_PATH="/etc/nginx/conf.d/yggl.conf"
    LOCAL_CONF="nginx-prod.conf"

    if [ -f "$LOCAL_CONF" ]; then
        echo "🔄 正在更新 Nginx 配置..."
        if [ -f "$NGINX_CONF_PATH" ]; then
            sudo cp "$NGINX_CONF_PATH" "${NGINX_CONF_PATH}.bak_$(date +%Y%m%d_%H%M%S)"
        fi
        sudo cp "$LOCAL_CONF" "$NGINX_CONF_PATH"
        echo "🔍 检查 Nginx 配置..."
        if sudo nginx -t; then
            echo "✅ Nginx 配置检查通过，正在重载..."
            sudo nginx -s reload
        else
            echo "❌ Nginx 配置有误，还原旧配置..."
            LATEST_BACKUP=$(ls -t ${NGINX_CONF_PATH}.bak_* 2>/dev/null | head -n1)
            if [ -n "$LATEST_BACKUP" ]; then
                sudo cp "$LATEST_BACKUP" "$NGINX_CONF_PATH"
                sudo nginx -s reload
                echo "✅ 已还原"
            fi
        fi
    fi
fi

echo ""
echo "✨ 全部完成！"
