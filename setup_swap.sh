#!/bin/bash
# 适用于 2核2G 机器的 Swap 追加创建脚本
# 运行方式: sudo bash setup_swap.sh

if [ "$EUID" -ne 0 ]; then
  echo "请使用 sudo 运行此脚本: sudo bash setup_swap.sh"
  exit 1
fi

echo "🔍 检查当前 Swap 状态..."
swapon --show
free -m

echo "🔨 开始追加创建 2GB Swap 空间 (/swapfile2)..."
if [ -f /swapfile2 ]; then
    echo "⚠️ /swapfile2 已存在，尝试先关闭并删除旧文件..."
    swapoff /swapfile2 || true
    rm -f /swapfile2
fi

# 使用 dd 创建 2GB 文件
dd if=/dev/zero of=/swapfile2 bs=1M count=2048

# 设置权限
chmod 600 /swapfile2

# 格式化并启用
mkswap /swapfile2
swapon /swapfile2

echo "📝 写入 /etc/fstab 以便开机自动挂载..."
if ! grep -q "/swapfile2" /etc/fstab; then
    echo '/swapfile2 none swap sw 0 0' | tee -a /etc/fstab
fi

echo "✅ 追加 Swap 创建成功！当前内存状态："
free -m
