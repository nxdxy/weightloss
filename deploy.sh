#!/bin/bash

# AI Fitness Pal 部署脚本
# 使用方法: ./deploy.sh [域名]

set -e

DOMAIN=${1:-localhost}
echo "🚀 开始部署 AI Fitness Pal 到域名: $DOMAIN"

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 创建必要的目录
echo "📁 创建目录结构..."
mkdir -p data uploads nginx/ssl

# 设置权限
chmod 755 data uploads

# 生成随机密钥
if [ ! -f .env ]; then
    echo "🔑 生成环境配置..."
    SECRET_KEY=$(openssl rand -hex 32)
    cat > .env << EOF
SECRET_KEY=$SECRET_KEY
DOMAIN=$DOMAIN
VITE_API_BASE_URL=https://$DOMAIN
EOF
fi

# 构建和启动服务
echo "🔨 构建 Docker 镜像..."
docker-compose -f docker-compose.prod.yml build

echo "🚀 启动服务..."
docker-compose -f docker-compose.prod.yml up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."
docker-compose -f docker-compose.prod.yml ps

# 显示访问信息
echo ""
echo "✅ 部署完成！"
echo "🌐 访问地址: http://$DOMAIN"
echo "📊 后端 API: http://$DOMAIN/api"
echo "📋 API 文档: http://$DOMAIN/docs"
echo ""
echo "📝 查看日志: docker-compose -f docker-compose.prod.yml logs -f"
echo "🛑 停止服务: docker-compose -f docker-compose.prod.yml down"
echo "🔄 重启服务: docker-compose -f docker-compose.prod.yml restart"
