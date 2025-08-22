#!/bin/bash

# AI Fitness Pal 快速打包脚本
# 专门处理 macOS 扩展属性问题

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# 配置
PACKAGE_NAME="ai-fitness-pal-$(date +%Y%m%d_%H%M%S)"

log "开始快速打包..."

# 设置环境变量禁用 macOS 特殊文件
export COPYFILE_DISABLE=1

# 方法1：使用 tar 的 macOS 特定选项
if [[ "$OSTYPE" == "darwin"* ]]; then
    log "检测到 macOS，使用优化的打包方式..."
    
    # 先清理当前目录的扩展属性
    log "清理扩展属性..."
    find . -name ".DS_Store" -delete 2>/dev/null || true
    find . -name "._*" -delete 2>/dev/null || true
    
    # 使用 tar 的 macOS 选项
    tar --exclude='node_modules' \
        --exclude='__pycache__' \
        --exclude='.git' \
        --exclude='*.pyc' \
        --exclude='*.pyo' \
        --exclude='dist' \
        --exclude='build' \
        --exclude='.env' \
        --exclude='*.tar.gz' \
        --exclude='*.zip' \
        --exclude='.DS_Store' \
        --exclude='._*' \
        --exclude='packages' \
        --exclude='logs' \
        --exclude='.vscode' \
        --exclude='.idea' \
        --no-xattrs \
        --no-mac-metadata \
        -czf "${PACKAGE_NAME}.tar.gz" . 2>/dev/null || {
        
        # 如果上面的命令失败，使用备用方法
        log "使用备用打包方法..."
        tar --exclude='node_modules' \
            --exclude='__pycache__' \
            --exclude='.git' \
            --exclude='*.pyc' \
            --exclude='*.pyo' \
            --exclude='dist' \
            --exclude='build' \
            --exclude='.env' \
            --exclude='*.tar.gz' \
            --exclude='*.zip' \
            --exclude='.DS_Store' \
            --exclude='._*' \
            --exclude='packages' \
            --exclude='logs' \
            --exclude='.vscode' \
            --exclude='.idea' \
            -czf "${PACKAGE_NAME}.tar.gz" . 2>&1 | grep -v "LIBARCHIVE.xattr" || true
    }
else
    # Linux/其他系统
    log "使用标准打包方式..."
    tar --exclude='node_modules' \
        --exclude='__pycache__' \
        --exclude='.git' \
        --exclude='*.pyc' \
        --exclude='*.pyo' \
        --exclude='dist' \
        --exclude='build' \
        --exclude='.env' \
        --exclude='*.tar.gz' \
        --exclude='*.zip' \
        --exclude='.DS_Store' \
        --exclude='packages' \
        --exclude='logs' \
        --exclude='.vscode' \
        --exclude='.idea' \
        -czf "${PACKAGE_NAME}.tar.gz" .
fi

# 检查文件是否创建成功
if [ -f "${PACKAGE_NAME}.tar.gz" ]; then
    PACKAGE_SIZE=$(du -h "${PACKAGE_NAME}.tar.gz" | cut -f1)
    success "打包完成！"
    echo ""
    echo "📦 文件: ${PACKAGE_NAME}.tar.gz"
    echo "📊 大小: $PACKAGE_SIZE"
    echo ""
    echo "🚀 部署命令："
    echo "scp ${PACKAGE_NAME}.tar.gz user@server:/tmp/"
    echo "ssh user@server 'cd /tmp && tar -xzf ${PACKAGE_NAME}.tar.gz'"
else
    echo "❌ 打包失败"
    exit 1
fi
