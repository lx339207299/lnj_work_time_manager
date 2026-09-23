#!/bin/bash
#
# 本地构建 + 远程部署脚本（适用 2核2G 低配服务器：服务器零编译、零 npm install）
#
# 用法:
#   ./deploy-remote.sh server     # 部署生产后端（构建 → 传输 → 重启 → 冒烟 → 失败自动回滚）
#   ./deploy-remote.sh admin      # 部署生产管理后台
#   ./deploy-remote.sh all        # 两个都部署
#
# 首次使用前，修改下面两个 TODO 常量。

set -euo pipefail

# ── TODO: 改成你的服务器信息 ──
SERVER_HOST="ubuntu@154.8.213.12"                    # ssh 目标，支持 ~/.ssh/config 里的别名
REMOTE_DIR="/home/ubuntu/projects/lnj_work_time_manager"          # 服务器上的项目目录（含 docker-compose.yml / .env.prod）

SERVER_HEALTH_PORT=3002                           # 对应 .env.prod 的 SERVER_PORT
IMAGE_SERVER="lnj_work_time_manager-server-prod"  # 与 docker-compose 服务名对应的镜像名
IMAGE_ADMIN="lnj_work_time_manager-admin-prod"

SERVICE=${1:-all}

# 服务器为 x86(amd64)，无条件指定平台（Intel Mac 原生构建，M 系列 Mac 走模拟，均兼容）
PLATFORM="--platform linux/amd64"

remote_backup_image() {
  # 远程已有 latest 时备份为 rollback，部署失败可用于回滚
  ssh "$SERVER_HOST" "docker image inspect $1:latest >/dev/null 2>&1 && docker tag $1:latest $1:rollback && echo '  📸 已备份旧镜像' || true"
}

transfer_image() {
  echo "🚚 传输镜像到服务器（约 1~3 分钟，取决于带宽）..."
  docker save "$1:latest" | gzip | ssh "$SERVER_HOST" 'gunzip | docker load'
}

remote_restart() {
  echo "🔄 远程重启 $1（--no-deps 不碰数据库）..."
  ssh "$SERVER_HOST" "cd $REMOTE_DIR && docker compose --env-file .env.prod --profile prod up -d --no-deps $1"
}

remote_rollback() {
  ssh "$SERVER_HOST" "docker tag $1:rollback $1:latest && cd $REMOTE_DIR && docker compose --env-file .env.prod --profile prod up -d --no-deps $1"
}

deploy_server() {
  echo ""
  echo "━━━ 部署生产后端 ━━━"

  echo "🔨 本地构建镜像 $PLATFORM ..."
  docker buildx build $PLATFORM -t "$IMAGE_SERVER:latest" server --load

  remote_backup_image "$IMAGE_SERVER"
  transfer_image "$IMAGE_SERVER"
  remote_restart "server-prod"

  echo "🩺 冒烟测试（容器启动含 prisma migrate，最多等 2 分钟）..."
  local ok=0
  for i in $(seq 1 40); do
    if ssh "$SERVER_HOST" "curl -sf -o /dev/null http://localhost:$SERVER_HEALTH_PORT/api/"; then
      echo "✅ 第 $i 次探测通过 — 部署成功！"
      ok=1; break
    fi
    printf "  ⏳ 第 %2d 次未就绪，3s 后重试...\n" "$i"
    sleep 3
  done

  if [ "$ok" -ne 1 ]; then
    echo "❌ 冒烟测试失败，回滚到旧版本..."
    remote_rollback "$IMAGE_SERVER" && echo "🔄 已回滚，请检查镜像或代码后重试"
    return 1
  fi
  echo "🎉 server 部署完成"
}

deploy_admin() {
  echo ""
  echo "━━━ 部署生产管理后台 ━━━"

  echo "🔨 本地安装依赖 + 类型检查 + vite 打包..."
  (cd admin && npm install --silent)
  (cd admin && npx tsc -b)
  (cd admin && NODE_OPTIONS=--max-old-space-size=1024 npx vite build)

  echo "🐳 打包进 nginx 镜像 $PLATFORM ..."
  docker build $PLATFORM -f Dockerfile.serve -t "$IMAGE_ADMIN:latest" .

  remote_backup_image "$IMAGE_ADMIN"
  transfer_image "$IMAGE_ADMIN"
  remote_restart "admin-prod"
  echo "🎉 admin 部署完成"
}

case "$SERVICE" in
  server) deploy_server ;;
  admin)  deploy_admin ;;
  all)    deploy_server; deploy_admin ;;
  *) echo "用法: $0 server|admin|all"; exit 1 ;;
esac

echo ""
echo "✨ 全部完成！"
