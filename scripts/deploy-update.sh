#!/bin/bash

# AI Fitness Pal 更新部署脚本
# 支持热更新、回滚、备份等功能

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
PROJECT_NAME="ai-fitness-pal"
BACKUP_DIR="/opt/backups/$PROJECT_NAME"
COMPOSE_FILE="docker-compose.prod.yml"
MAX_BACKUPS=5

# 函数定义
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

# 检查依赖
check_dependencies() {
    log "检查依赖..."
    command -v docker >/dev/null 2>&1 || error "Docker 未安装"
    command -v docker-compose >/dev/null 2>&1 || error "Docker Compose 未安装"
    success "依赖检查通过"
}

# 创建备份
create_backup() {
    log "创建备份..."
    
    # 创建备份目录
    mkdir -p "$BACKUP_DIR"
    
    # 备份时间戳
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"
    
    mkdir -p "$BACKUP_PATH"
    
    # 备份数据库
    if docker ps | grep -q "${PROJECT_NAME}-backend"; then
        log "备份数据库..."
        docker exec ${PROJECT_NAME}-backend cp /app/data/fitness_pal.db /tmp/
        docker cp ${PROJECT_NAME}-backend:/tmp/fitness_pal.db "$BACKUP_PATH/"
    fi
    
    # 备份上传文件
    if [ -d "./uploads" ]; then
        log "备份上传文件..."
        cp -r ./uploads "$BACKUP_PATH/"
    fi
    
    # 备份配置文件
    log "备份配置文件..."
    cp .env "$BACKUP_PATH/" 2>/dev/null || true
    cp $COMPOSE_FILE "$BACKUP_PATH/"
    
    # 记录当前版本信息
    docker-compose -f $COMPOSE_FILE ps > "$BACKUP_PATH/services_status.txt"
    docker images | grep $PROJECT_NAME > "$BACKUP_PATH/images_info.txt"
    
    success "备份完成: $BACKUP_PATH"
    
    # 清理旧备份
    cleanup_old_backups
}

# 清理旧备份
cleanup_old_backups() {
    log "清理旧备份..."
    cd "$BACKUP_DIR"
    ls -t | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm -rf
    success "旧备份清理完成"
}

# 健康检查
health_check() {
    log "执行健康检查..."
    
    # 检查容器状态
    if ! docker-compose -f $COMPOSE_FILE ps | grep -q "Up"; then
        error "服务未正常运行"
    fi
    
    # 检查后端 API
    for i in {1..30}; do
        if curl -f http://localhost:8000/health >/dev/null 2>&1; then
            success "后端 API 健康检查通过"
            break
        fi
        if [ $i -eq 30 ]; then
            error "后端 API 健康检查失败"
        fi
        sleep 2
    done
    
    # 检查前端
    for i in {1..30}; do
        if curl -f http://localhost >/dev/null 2>&1; then
            success "前端健康检查通过"
            break
        fi
        if [ $i -eq 30 ]; then
            error "前端健康检查失败"
        fi
        sleep 2
    done
}

# 零停机更新
zero_downtime_update() {
    log "开始零停机更新..."
    
    # 拉取新镜像
    log "拉取新镜像..."
    docker-compose -f $COMPOSE_FILE pull
    
    # 逐个更新服务
    SERVICES=("backend" "frontend")
    
    for service in "${SERVICES[@]}"; do
        log "更新服务: $service"
        
        # 启动新容器
        docker-compose -f $COMPOSE_FILE up -d --no-deps $service
        
        # 等待服务就绪
        sleep 10
        
        # 健康检查
        if [ "$service" = "backend" ]; then
            for i in {1..15}; do
                if curl -f http://localhost:8000/health >/dev/null 2>&1; then
                    success "$service 更新成功"
                    break
                fi
                if [ $i -eq 15 ]; then
                    error "$service 更新失败"
                fi
                sleep 2
            done
        fi
    done
    
    success "零停机更新完成"
}

# 回滚功能
rollback() {
    local backup_name=$1
    
    if [ -z "$backup_name" ]; then
        log "可用的备份:"
        ls -la "$BACKUP_DIR" | grep "backup_"
        read -p "请输入要回滚的备份名称: " backup_name
    fi
    
    BACKUP_PATH="$BACKUP_DIR/$backup_name"
    
    if [ ! -d "$BACKUP_PATH" ]; then
        error "备份不存在: $BACKUP_PATH"
    fi
    
    log "开始回滚到: $backup_name"
    
    # 停止当前服务
    docker-compose -f $COMPOSE_FILE down
    
    # 恢复数据库
    if [ -f "$BACKUP_PATH/fitness_pal.db" ]; then
        log "恢复数据库..."
        cp "$BACKUP_PATH/fitness_pal.db" ./data/
    fi
    
    # 恢复上传文件
    if [ -d "$BACKUP_PATH/uploads" ]; then
        log "恢复上传文件..."
        rm -rf ./uploads
        cp -r "$BACKUP_PATH/uploads" ./
    fi
    
    # 恢复配置
    if [ -f "$BACKUP_PATH/.env" ]; then
        log "恢复配置文件..."
        cp "$BACKUP_PATH/.env" ./
    fi
    
    # 重启服务
    docker-compose -f $COMPOSE_FILE up -d
    
    # 健康检查
    health_check
    
    success "回滚完成"
}

# 主函数
main() {
    case "${1:-update}" in
        "update")
            check_dependencies
            create_backup
            zero_downtime_update
            health_check
            success "更新部署完成"
            ;;
        "rollback")
            rollback "$2"
            ;;
        "backup")
            create_backup
            ;;
        "health")
            health_check
            ;;
        *)
            echo "用法: $0 {update|rollback|backup|health}"
            echo "  update   - 执行零停机更新"
            echo "  rollback - 回滚到指定备份"
            echo "  backup   - 创建备份"
            echo "  health   - 健康检查"
            exit 1
            ;;
    esac
}

main "$@"
