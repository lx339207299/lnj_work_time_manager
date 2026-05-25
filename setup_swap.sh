#!/bin/bash
# 适用于 2核2G 机器的 Swap 创建脚本
# 运行方式: sudo bash setup_swap.sh

if [ "$EUID" -ne 0 ]; then
  echo "请使用 sudo 运行此脚本: sudo bash setup_swap.sh"
  exit 1
fi

echo "🔍 检查当前 Swap 状态..."
swapon --show

if free | awk '/^Swap:/ {exit !$2}'; then
    echo "⚠️ 系统已存在 Swap 分区，无需重复创建。"
    exit 0
fi

echo "🔨 开始创建 2GB Swap 空间..."
fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

echo "📝 写入 /etc/fstab 以便开机自动挂载..."
if ! grep -q "/swapfile" /etc/fstab; then
    echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
fi

echo "⚙️ 优化 Swap 倾向 (swappiness)..."
sysctl vm.swappiness=10
if ! grep -q "vm.swappiness" /etc/sysctl.conf; then
    echo 'vm.swappiness=10' >> /etc/sysctl.conf
else
    sed -i 's/^vm.swappiness.*/vm.swappiness=10/' /etc/sysctl.conf
fi

echo "✅ Swap 创建并配置成功！当前内存状态："
free -m
