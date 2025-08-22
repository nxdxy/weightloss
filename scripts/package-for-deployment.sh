#!/bin/bash

# AI Fitness Pal 部署打包脚本
# 用于创建部署包，包含代码、数据和配置

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# 配置
PROJECT_NAME="ai-fitness-pal"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PACKAGE_NAME="${PROJECT_NAME}-${TIMESTAMP}"
TEMP_DIR="/tmp/${PACKAGE_NAME}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="$PROJECT_ROOT/packages"

# 切换到项目根目录
cd "$PROJECT_ROOT"

# 检查项目文件
if [ ! -f "package.json" ] && [ ! -f "backend/requirements.txt" ]; then
    error "无法找到项目文件，请检查脚本路径"
fi

log "开始打包 ${PROJECT_NAME}..."

# 创建输出目录
mkdir -p "$OUTPUT_DIR"

# 创建临时目录
log "创建临时目录: $TEMP_DIR"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

# 复制项目文件（排除不需要的文件）
log "复制项目文件..."

# 检测操作系统
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS: 使用 rsync 并清理扩展属性
    rsync -av \
        --exclude='node_modules' \
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
        --exclude='Thumbs.db' \
        --exclude='packages' \
        --exclude='logs' \
        --exclude='.vscode' \
        --exclude='.idea' \
        . "$TEMP_DIR/"

    # 清理 macOS 扩展属性
    log "清理 macOS 扩展属性..."
    find "$TEMP_DIR" -type f -exec xattr -c {} \; 2>/dev/null || true
    find "$TEMP_DIR" -name "._*" -delete 2>/dev/null || true
    find "$TEMP_DIR" -name ".DS_Store" -delete 2>/dev/null || true
else
    # Linux/其他系统
    rsync -av \
        --exclude='node_modules' \
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
        --exclude='Thumbs.db' \
        --exclude='packages' \
        --exclude='logs' \
        --exclude='.vscode' \
        --exclude='.idea' \
        . "$TEMP_DIR/"
fi

# 备份数据库（如果存在）
if [ -f "backend/fitness_pal.db" ]; then
    log "备份数据库..."
    mkdir -p "$TEMP_DIR/data"
    cp "backend/fitness_pal.db" "$TEMP_DIR/data/"
    success "数据库已备份"
else
    warning "未找到数据库文件"
fi

# 备份上传文件（如果存在）
if [ -d "backend/uploads" ]; then
    log "备份上传文件..."
    cp -r "backend/uploads" "$TEMP_DIR/"
    success "上传文件已备份"
else
    warning "未找到上传文件目录"
fi

# 创建部署信息文件
log "创建部署信息..."
cat > "$TEMP_DIR/deployment-info.txt" << EOF
AI Fitness Pal 部署包
=====================

打包时间: $(date)
版本信息: $(git describe --tags --always 2>/dev/null || echo "unknown")
Git 提交: $(git rev-parse HEAD 2>/dev/null || echo "unknown")
打包机器: $(hostname)
操作系统: $(uname -a)

文件清单:
- 前端代码: frontend/
- 后端代码: backend/
- 部署脚本: scripts/
- Docker 配置: docker-compose.prod.yml
- 数据库备份: data/fitness_pal.db (如果存在)
- 上传文件: uploads/ (如果存在)

部署说明:
1. 解压文件到服务器
2. 运行 ./deploy.sh yourdomain.com
3. 或者使用 Docker Compose: docker-compose -f docker-compose.prod.yml up -d

更多信息请参考: devops-guide.md
EOF

# 创建快速部署脚本
log "创建快速部署脚本..."
cat > "$TEMP_DIR/quick-deploy.sh" << 'EOF'
#!/bin/bash

# AI Fitness Pal 快速部署脚本

set -e

DOMAIN=${1:-localhost}

echo "🚀 开始快速部署 AI Fitness Pal..."
echo "域名: $DOMAIN"

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 恢复数据
if [ -f "data/fitness_pal.db" ]; then
    echo "📁 恢复数据库..."
    mkdir -p backend
    cp data/fitness_pal.db backend/
fi

if [ -d "uploads" ]; then
    echo "📁 恢复上传文件..."
    mkdir -p backend
    cp -r uploads backend/
fi

# 设置权限
chmod +x scripts/*.sh
chmod +x deploy.sh

# 部署
echo "🔨 开始部署..."
./deploy.sh "$DOMAIN"

echo "✅ 部署完成！"
echo "🌐 访问地址: http://$DOMAIN"
EOF

chmod +x "$TEMP_DIR/quick-deploy.sh"

# 创建压缩包
log "创建压缩包..."
cd "$(dirname "$TEMP_DIR")"

# 根据操作系统选择合适的 tar 选项
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS: 使用 --no-xattrs 和 --no-mac-metadata 选项
    export COPYFILE_DISABLE=1
    tar --no-xattrs --no-mac-metadata -czf "${PACKAGE_NAME}.tar.gz" "$(basename "$TEMP_DIR")" 2>/dev/null || \
    tar -czf "${PACKAGE_NAME}.tar.gz" "$(basename "$TEMP_DIR")"
else
    # Linux/其他系统
    tar -czf "${PACKAGE_NAME}.tar.gz" "$(basename "$TEMP_DIR")"
fi

# 移动到输出目录
mkdir -p "$OUTPUT_DIR"
mv "${PACKAGE_NAME}.tar.gz" "$OUTPUT_DIR/"

# 清理临时目录
rm -rf "$TEMP_DIR"

# 计算文件大小
PACKAGE_PATH="$OUTPUT_DIR/${PACKAGE_NAME}.tar.gz"
PACKAGE_SIZE=$(du -h "$PACKAGE_PATH" | cut -f1)

success "打包完成！"
echo ""
echo "📦 包文件: $PACKAGE_PATH"
echo "📊 文件大小: $PACKAGE_SIZE"
echo ""
echo "🚀 部署方法："
echo "1. 上传到服务器: scp $PACKAGE_PATH user@server:/tmp/"
echo "2. 解压: tar -xzf ${PACKAGE_NAME}.tar.gz"
echo "3. 进入目录: cd ${PACKAGE_NAME}"
echo "4. 快速部署: ./quick-deploy.sh yourdomain.com"
echo ""
echo "📚 详细说明请参考包内的 devops-guide.md 文件"
