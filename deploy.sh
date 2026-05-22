#!/bin/bash

# 部署脚本使用说明：
# 1. 给脚本添加执行权限: chmod +x deploy.sh
# 2. 运行脚本: ./deploy.sh [prod|test|dev|all]
#    - prod: 仅部署生产环境
#    - test: 仅部署测试环境
#    - dev:  仅部署开发环境数据库
#    - all:  部署生产和测试环境（默认）

set -euo pipefail

ENV=${1:-all}
HEALTH_RETRIES=15
HEALTH_INTERVAL=2

echo "🚀 开始部署环境: $ENV"

# ── 部署函数 ──

deploy_env() {
    local env_file=$1
    local profile=$2
    local label=$3
    local server_svc=$4
    local admin_svc=$5
    local health_url=$6

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📦 部署 ${label} 环境"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if [ ! -f "$env_file" ]; then
        echo "❌ 错误：未找到 ${env_file}，跳过。"
        return 1
    fi

    # ── 1. 备份当前镜像 ID（用于回滚） ──
    local old_image=""
    old_image=$(docker image ls lnj_work_time_manager-${server_svc} --format '{{.ID}}' 2>/dev/null || echo "")
    if [ -n "$old_image" ]; then
        docker tag "$old_image" "lnj_work_time_manager-${server_svc}:rollback" 2>/dev/null || true
        echo "📸 已保存回滚镜像: ${old_image:0:12}"
    fi

    # ── 2. 构建 ──
    echo "🔨 构建镜像 (--no-cache)..."
    if ! docker compose --env-file "$env_file" --profile "$profile" build --no-cache $server_svc $admin_svc; then
        echo "❌ 构建失败"
        return 1
    fi

    # ── 3. 构建验证 ──
    echo "🔍 验证构建产物..."
    if ! docker run --rm "lnj_work_time_manager-${server_svc}" test -f dist/main.js; then
        echo "❌ 构建验证失败：dist/main.js 不存在！"
        echo "   镜像未部署，线上服务不受影响。"
        return 1
    fi
    echo "   ✅ dist/main.js 存在"

    # ── 4. 部署 ──
    echo "🔄 重启服务 (不动数据库)..."
    docker compose --env-file "$env_file" --profile "$profile" up -d --no-deps $server_svc $admin_svc

    # ── 5. 冒烟测试 ──
    echo "🩺 冒烟测试 (最多 ${HEALTH_RETRIES} 次重试)..."
    for i in $(seq 1 $HEALTH_RETRIES); do
        if curl -sf -o /dev/null "$health_url" 2>/dev/null; then
            echo "   ✅ 第 ${i} 次通过 — HTTP 200"
            echo ""
            echo "🎉 ${label} 部署成功！"
            # 清理回滚镜像
            docker rmi "lnj_work_time_manager-${server_svc}:rollback" 2>/dev/null || true
            return 0
        fi
        printf "   ⏳ 第 %2d 次未就绪，%ds 后重试...\n" "$i" "$HEALTH_INTERVAL"
        sleep $HEALTH_INTERVAL
    done

    # ── 6. 回滚 ──
    echo "❌ 冒烟测试失败 (${HEALTH_RETRIES} 次均无响应)"
    if docker image inspect "lnj_work_time_manager-${server_svc}:rollback" &>/dev/null; then
        echo "🔄 正在回滚到旧版本..."
        docker tag "lnj_work_time_manager-${server_svc}:rollback" "lnj_work_time_manager-${server_svc}:latest"
        docker compose --env-file "$env_file" --profile "$profile" up -d --no-deps $server_svc
        echo "✅ 已回滚到旧版本"
    else
        echo "⚠️  无回滚镜像可用，请手动处理"
    fi
    return 1
}

# ── 环境入口 ──

deploy_prod() {
    deploy_env ".env.prod" "prod" "生产" "server-prod" "admin-prod" "http://localhost:3002/api/"
}

deploy_test() {
    deploy_env ".env.test" "test" "测试" "server-test" "admin-test" "http://localhost:3001/api/"
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
    prod)  deploy_prod ;;
    test)  deploy_test ;;
    dev)   deploy_dev ;;
    all)   deploy_prod; deploy_test ;;
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
