#!/bin/bash

# 部署脚本使用说明：
# 1. 给脚本添加执行权限: chmod +x deploy.sh
# 2. 运行脚本: ./deploy.sh [prod|test|dev|all]
#    - prod: 仅部署生产环境
#    - test: 仅部署测试环境
#    - dev:  仅部署开发环境数据库
#    - all:  部署生产和测试环境（默认）

ENV=${1:-all}

echo "🚀 开始部署环境: $ENV"

# 2. Docker Compose 部署

deploy_prod() {
    if [ -f .env.prod ]; then
        echo "📦 正在构建生产环境镜像 (server + admin)..."
        docker compose --env-file .env.prod --profile prod build server-prod admin-prod
        echo "🔄 正在重启生产服务 (不动数据库)..."
        docker compose --env-file .env.prod --profile prod up -d --no-deps server-prod admin-prod
    else
        echo "❌ 错误：未找到 .env.prod 文件，跳过生产环境部署。"
    fi
}

deploy_test() {
    if [ -f .env.test ]; then
        echo "🧪 正在构建测试环境镜像 (server + admin)..."
        docker compose --env-file .env.test --profile test build server-test admin-test
        echo "🔄 正在重启测试服务 (不动数据库)..."
        docker compose --env-file .env.test --profile test up -d --no-deps server-test admin-test
    else
        echo "❌ 错误：未找到 .env.test 文件，跳过测试环境部署。"
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

if [ "$ENV" == "prod" ]; then
    deploy_prod
elif [ "$ENV" == "test" ]; then
    deploy_test
elif [ "$ENV" == "dev" ]; then
    deploy_dev
elif [ "$ENV" == "all" ]; then
    deploy_prod
    deploy_test
else
    echo "❌ 未知环境: $ENV"
    exit 1
fi

# 3. Nginx 配置检查与重载 (Only for prod/test/all, not dev)
if [ "$ENV" != "dev" ]; then
    NGINX_CONF_PATH="/etc/nginx/conf.d/yggl.conf"
    LOCAL_CONF="nginx-prod.conf"

    if [ -f "$LOCAL_CONF" ]; then
        echo "🔄 正在更新 Nginx 配置..."
        # 备份旧配置
        if [ -f "$NGINX_CONF_PATH" ]; then
            sudo cp "$NGINX_CONF_PATH" "${NGINX_CONF_PATH}.bak_$(date +%Y%m%d_%H%M%S)"
        fi
        
        # 复制新配置
        sudo cp "$LOCAL_CONF" "$NGINX_CONF_PATH"
        
        # 检查并重载
        echo "🔍 检查 Nginx 配置..."
        if sudo nginx -t; then
            echo "✅ Nginx 配置检查通过，正在重载..."
            sudo nginx -s reload
            echo "🎉 Nginx 重载成功！"
        else
            echo "❌ Nginx 配置有误，请手动检查 $NGINX_CONF_PATH"
            # 还原备份
            if [ -f "${NGINX_CONF_PATH}.bak_*" ]; then
                echo "⚠️  尝试还原旧配置..."
                LATEST_BACKUP=$(ls -t ${NGINX_CONF_PATH}.bak_* | head -n1)
                sudo cp "$LATEST_BACKUP" "$NGINX_CONF_PATH"
                sudo nginx -s reload
                echo "✅ 已还原到最近一次正确配置"
            fi
        fi
    else
        echo "⚠️  未找到 $LOCAL_CONF，跳过 Nginx 更新"
    fi
fi

echo "✨ 部署完成！"
