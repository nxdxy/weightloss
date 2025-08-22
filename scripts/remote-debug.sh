#!/bin/bash

# AI Fitness Pal 远程调试脚本
# 支持日志查看、性能监控、问题诊断等

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_NAME="ai-fitness-pal"
COMPOSE_FILE="docker-compose.prod.yml"

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
}

# 显示服务状态
show_status() {
    log "服务状态:"
    docker-compose -f $COMPOSE_FILE ps
    echo ""
    
    log "容器资源使用:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
    echo ""
}

# 查看日志
view_logs() {
    local service=${1:-""}
    local lines=${2:-100}
    
    if [ -z "$service" ]; then
        echo "可用服务:"
        docker-compose -f $COMPOSE_FILE config --services
        read -p "请选择服务 (或按回车查看所有): " service
    fi
    
    if [ -z "$service" ]; then
        log "查看所有服务日志 (最近 $lines 行):"
        docker-compose -f $COMPOSE_FILE logs --tail=$lines -f
    else
        log "查看 $service 服务日志 (最近 $lines 行):"
        docker-compose -f $COMPOSE_FILE logs --tail=$lines -f $service
    fi
}

# 进入容器
enter_container() {
    local service=${1:-"backend"}
    local shell=${2:-"/bin/bash"}
    
    log "进入 $service 容器..."
    docker-compose -f $COMPOSE_FILE exec $service $shell
}

# 执行数据库操作
database_ops() {
    local operation=${1:-""}
    
    case "$operation" in
        "backup")
            log "备份数据库..."
            timestamp=$(date +%Y%m%d_%H%M%S)
            docker-compose -f $COMPOSE_FILE exec backend cp /app/data/fitness_pal.db /app/data/backup_$timestamp.db
            success "数据库备份完成: backup_$timestamp.db"
            ;;
        "shell")
            log "进入数据库 shell..."
            docker-compose -f $COMPOSE_FILE exec backend sqlite3 /app/data/fitness_pal.db
            ;;
        "query")
            read -p "请输入 SQL 查询: " query
            docker-compose -f $COMPOSE_FILE exec backend sqlite3 /app/data/fitness_pal.db "$query"
            ;;
        "size")
            log "数据库大小信息:"
            docker-compose -f $COMPOSE_FILE exec backend ls -lh /app/data/
            docker-compose -f $COMPOSE_FILE exec backend sqlite3 /app/data/fitness_pal.db "SELECT name FROM sqlite_master WHERE type='table';" | while read table; do
                count=$(docker-compose -f $COMPOSE_FILE exec backend sqlite3 /app/data/fitness_pal.db "SELECT COUNT(*) FROM $table;")
                echo "$table: $count 条记录"
            done
            ;;
        *)
            echo "数据库操作:"
            echo "  backup - 备份数据库"
            echo "  shell  - 进入数据库 shell"
            echo "  query  - 执行 SQL 查询"
            echo "  size   - 查看数据库大小"
            ;;
    esac
}

# 性能监控
performance_monitor() {
    log "性能监控 (按 Ctrl+C 退出):"
    
    while true; do
        clear
        echo "=== AI Fitness Pal 性能监控 ==="
        echo "时间: $(date)"
        echo ""
        
        # 容器状态
        echo "📊 容器资源使用:"
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
        echo ""
        
        # 系统资源
        echo "💻 系统资源:"
        echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
        echo "内存: $(free -h | awk 'NR==2{printf "%.1f%%", $3*100/$2}')"
        echo "磁盘: $(df -h / | awk 'NR==2{print $5}')"
        echo ""
        
        # 网络连接
        echo "🌐 网络连接:"
        netstat -tuln | grep -E ":80|:443|:8000" | head -5
        echo ""
        
        # 最近错误日志
        echo "🚨 最近错误 (最近5条):"
        docker-compose -f $COMPOSE_FILE logs --tail=50 2>/dev/null | grep -i error | tail -5
        echo ""
        
        sleep 5
    done
}

# 问题诊断
diagnose() {
    log "开始系统诊断..."
    
    echo "=== 系统诊断报告 ==="
    echo "时间: $(date)"
    echo ""
    
    # 1. 服务状态
    echo "1. 服务状态:"
    docker-compose -f $COMPOSE_FILE ps
    echo ""
    
    # 2. 端口检查
    echo "2. 端口检查:"
    for port in 80 443 8000; do
        if netstat -tuln | grep -q ":$port "; then
            echo "✅ 端口 $port 正在监听"
        else
            echo "❌ 端口 $port 未监听"
        fi
    done
    echo ""
    
    # 3. 磁盘空间
    echo "3. 磁盘空间:"
    df -h
    echo ""
    
    # 4. 内存使用
    echo "4. 内存使用:"
    free -h
    echo ""
    
    # 5. 最近错误
    echo "5. 最近错误 (最近10条):"
    docker-compose -f $COMPOSE_FILE logs --tail=100 2>/dev/null | grep -i error | tail -10
    echo ""
    
    # 6. 健康检查
    echo "6. 健康检查:"
    if curl -f http://localhost:8000/health >/dev/null 2>&1; then
        echo "✅ 后端 API 正常"
    else
        echo "❌ 后端 API 异常"
    fi
    
    if curl -f http://localhost >/dev/null 2>&1; then
        echo "✅ 前端服务正常"
    else
        echo "❌ 前端服务异常"
    fi
    echo ""
    
    # 7. 数据库状态
    echo "7. 数据库状态:"
    if docker-compose -f $COMPOSE_FILE exec backend test -f /app/data/fitness_pal.db; then
        echo "✅ 数据库文件存在"
        db_size=$(docker-compose -f $COMPOSE_FILE exec backend ls -lh /app/data/fitness_pal.db | awk '{print $5}')
        echo "📊 数据库大小: $db_size"
    else
        echo "❌ 数据库文件不存在"
    fi
    
    success "诊断完成"
}

# 清理系统
cleanup() {
    log "开始系统清理..."
    
    # 清理 Docker
    echo "清理 Docker 资源..."
    docker system prune -f
    docker volume prune -f
    
    # 清理日志
    echo "清理日志文件..."
    find /var/log -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true
    
    # 清理临时文件
    echo "清理临时文件..."
    docker-compose -f $COMPOSE_FILE exec backend find /tmp -type f -mtime +1 -delete 2>/dev/null || true
    
    success "系统清理完成"
}

# 主菜单
show_menu() {
    echo ""
    echo "=== AI Fitness Pal 远程调试工具 ==="
    echo "1. 查看服务状态"
    echo "2. 查看日志"
    echo "3. 进入容器"
    echo "4. 数据库操作"
    echo "5. 性能监控"
    echo "6. 问题诊断"
    echo "7. 系统清理"
    echo "8. 退出"
    echo ""
}

# 主函数
main() {
    if [ $# -eq 0 ]; then
        # 交互模式
        while true; do
            show_menu
            read -p "请选择操作 (1-8): " choice
            
            case $choice in
                1) show_status ;;
                2) view_logs ;;
                3) enter_container ;;
                4) database_ops ;;
                5) performance_monitor ;;
                6) diagnose ;;
                7) cleanup ;;
                8) exit 0 ;;
                *) warning "无效选择，请重试" ;;
            esac
            
            echo ""
            read -p "按回车继续..."
        done
    else
        # 命令行模式
        case "$1" in
            "status") show_status ;;
            "logs") view_logs "$2" "$3" ;;
            "enter") enter_container "$2" "$3" ;;
            "db") database_ops "$2" ;;
            "monitor") performance_monitor ;;
            "diagnose") diagnose ;;
            "cleanup") cleanup ;;
            *)
                echo "用法: $0 [command] [options]"
                echo "命令:"
                echo "  status              - 查看服务状态"
                echo "  logs [service] [n]  - 查看日志"
                echo "  enter [service]     - 进入容器"
                echo "  db [operation]      - 数据库操作"
                echo "  monitor             - 性能监控"
                echo "  diagnose            - 问题诊断"
                echo "  cleanup             - 系统清理"
                ;;
        esac
    fi
}

main "$@"
