#!/bin/bash

# AI Fitness Pal 监控脚本
# 支持健康检查、告警、自动恢复等

set -e

# 配置
PROJECT_NAME="ai-fitness-pal"
COMPOSE_FILE="docker-compose.prod.yml"
LOG_FILE="/var/log/${PROJECT_NAME}-monitor.log"
ALERT_EMAIL=""  # 设置告警邮箱
WEBHOOK_URL=""  # 设置 Webhook URL (如钉钉、企业微信等)

# 阈值配置
CPU_THRESHOLD=80
MEMORY_THRESHOLD=80
DISK_THRESHOLD=85
RESPONSE_TIME_THRESHOLD=5000  # 毫秒

# 日志函数
log_message() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 发送告警
send_alert() {
    local message="$1"
    local level="${2:-WARNING}"
    
    log_message "[$level] $message"
    
    # 邮件告警
    if [ -n "$ALERT_EMAIL" ]; then
        echo "$message" | mail -s "[$level] AI Fitness Pal Alert" "$ALERT_EMAIL" 2>/dev/null || true
    fi
    
    # Webhook 告警
    if [ -n "$WEBHOOK_URL" ]; then
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"[$level] AI Fitness Pal: $message\"}" \
            2>/dev/null || true
    fi
}

# 检查服务状态
check_services() {
    local failed_services=()
    
    # 检查容器状态
    while IFS= read -r line; do
        if [[ $line == *"Exit"* ]] || [[ $line == *"Restarting"* ]]; then
            service_name=$(echo "$line" | awk '{print $1}')
            failed_services+=("$service_name")
        fi
    done < <(docker-compose -f $COMPOSE_FILE ps)
    
    if [ ${#failed_services[@]} -gt 0 ]; then
        send_alert "服务异常: ${failed_services[*]}" "CRITICAL"
        return 1
    fi
    
    return 0
}

# 检查 HTTP 响应
check_http_response() {
    local url="$1"
    local expected_code="${2:-200}"
    local timeout="${3:-10}"
    
    local start_time=$(date +%s%3N)
    local response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time $timeout "$url" 2>/dev/null || echo "000")
    local end_time=$(date +%s%3N)
    local response_time=$((end_time - start_time))
    
    if [ "$response_code" != "$expected_code" ]; then
        send_alert "HTTP 检查失败: $url 返回 $response_code" "CRITICAL"
        return 1
    fi
    
    if [ $response_time -gt $RESPONSE_TIME_THRESHOLD ]; then
        send_alert "响应时间过长: $url 响应时间 ${response_time}ms" "WARNING"
    fi
    
    return 0
}

# 检查系统资源
check_system_resources() {
    # CPU 使用率
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1 | cut -d',' -f1)
    cpu_usage=${cpu_usage%.*}  # 去掉小数部分
    
    if [ "$cpu_usage" -gt $CPU_THRESHOLD ]; then
        send_alert "CPU 使用率过高: ${cpu_usage}%" "WARNING"
    fi
    
    # 内存使用率
    local memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    
    if [ "$memory_usage" -gt $MEMORY_THRESHOLD ]; then
        send_alert "内存使用率过高: ${memory_usage}%" "WARNING"
    fi
    
    # 磁盘使用率
    local disk_usage=$(df / | awk 'NR==2{print $5}' | cut -d'%' -f1)
    
    if [ "$disk_usage" -gt $DISK_THRESHOLD ]; then
        send_alert "磁盘使用率过高: ${disk_usage}%" "WARNING"
    fi
}

# 检查数据库
check_database() {
    if ! docker-compose -f $COMPOSE_FILE exec -T backend test -f /app/data/fitness_pal.db; then
        send_alert "数据库文件不存在" "CRITICAL"
        return 1
    fi
    
    # 检查数据库连接
    if ! docker-compose -f $COMPOSE_FILE exec -T backend sqlite3 /app/data/fitness_pal.db "SELECT 1;" >/dev/null 2>&1; then
        send_alert "数据库连接失败" "CRITICAL"
        return 1
    fi
    
    return 0
}

# 自动恢复
auto_recovery() {
    local service="$1"
    
    log_message "尝试自动恢复服务: $service"
    
    # 重启服务
    docker-compose -f $COMPOSE_FILE restart "$service"
    
    # 等待服务启动
    sleep 30
    
    # 验证恢复
    if check_services; then
        send_alert "服务自动恢复成功: $service" "INFO"
        return 0
    else
        send_alert "服务自动恢复失败: $service" "CRITICAL"
        return 1
    fi
}

# 生成监控报告
generate_report() {
    local report_file="/tmp/monitor-report-$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "=== AI Fitness Pal 监控报告 ==="
        echo "生成时间: $(date)"
        echo ""
        
        echo "1. 服务状态:"
        docker-compose -f $COMPOSE_FILE ps
        echo ""
        
        echo "2. 系统资源:"
        echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
        echo "内存: $(free -h | awk 'NR==2{printf "%.1f%%", $3*100/$2}')"
        echo "磁盘: $(df -h / | awk 'NR==2{print $5}')"
        echo ""
        
        echo "3. 容器资源:"
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
        echo ""
        
        echo "4. 网络连接:"
        netstat -tuln | grep -E ":80|:443|:8000"
        echo ""
        
        echo "5. 最近错误 (最近10条):"
        docker-compose -f $COMPOSE_FILE logs --tail=100 2>/dev/null | grep -i error | tail -10
        echo ""
        
        echo "6. 数据库状态:"
        if docker-compose -f $COMPOSE_FILE exec -T backend test -f /app/data/fitness_pal.db; then
            echo "✅ 数据库文件存在"
            db_size=$(docker-compose -f $COMPOSE_FILE exec -T backend ls -lh /app/data/fitness_pal.db | awk '{print $5}')
            echo "📊 数据库大小: $db_size"
        else
            echo "❌ 数据库文件不存在"
        fi
        
    } > "$report_file"
    
    echo "$report_file"
}

# 主监控循环
monitor_loop() {
    log_message "开始监控循环..."
    
    while true; do
        local all_checks_passed=true
        
        # 检查服务状态
        if ! check_services; then
            all_checks_passed=false
            # 尝试自动恢复
            auto_recovery "backend"
            auto_recovery "frontend"
        fi
        
        # 检查 HTTP 响应
        if ! check_http_response "http://localhost:8000/health"; then
            all_checks_passed=false
        fi
        
        if ! check_http_response "http://localhost"; then
            all_checks_passed=false
        fi
        
        # 检查系统资源
        check_system_resources
        
        # 检查数据库
        if ! check_database; then
            all_checks_passed=false
        fi
        
        if $all_checks_passed; then
            log_message "所有检查通过"
        fi
        
        # 等待下次检查
        sleep 60
    done
}

# 一次性检查
single_check() {
    echo "=== AI Fitness Pal 健康检查 ==="
    echo "时间: $(date)"
    echo ""
    
    local all_passed=true
    
    echo "1. 检查服务状态..."
    if check_services; then
        echo "✅ 服务状态正常"
    else
        echo "❌ 服务状态异常"
        all_passed=false
    fi
    
    echo "2. 检查 HTTP 响应..."
    if check_http_response "http://localhost:8000/health"; then
        echo "✅ 后端 API 正常"
    else
        echo "❌ 后端 API 异常"
        all_passed=false
    fi
    
    if check_http_response "http://localhost"; then
        echo "✅ 前端服务正常"
    else
        echo "❌ 前端服务异常"
        all_passed=false
    fi
    
    echo "3. 检查系统资源..."
    check_system_resources
    echo "✅ 系统资源检查完成"
    
    echo "4. 检查数据库..."
    if check_database; then
        echo "✅ 数据库正常"
    else
        echo "❌ 数据库异常"
        all_passed=false
    fi
    
    echo ""
    if $all_passed; then
        echo "🎉 所有检查通过！"
    else
        echo "⚠️ 发现问题，请查看详细信息"
    fi
}

# 主函数
main() {
    # 创建日志目录
    mkdir -p "$(dirname "$LOG_FILE")"
    
    case "${1:-check}" in
        "start")
            echo "启动监控服务..."
            monitor_loop
            ;;
        "check")
            single_check
            ;;
        "report")
            report_file=$(generate_report)
            echo "监控报告已生成: $report_file"
            cat "$report_file"
            ;;
        "test-alert")
            send_alert "这是一条测试告警消息" "INFO"
            echo "测试告警已发送"
            ;;
        *)
            echo "用法: $0 {start|check|report|test-alert}"
            echo "  start      - 启动持续监控"
            echo "  check      - 执行一次健康检查"
            echo "  report     - 生成监控报告"
            echo "  test-alert - 发送测试告警"
            exit 1
            ;;
    esac
}

main "$@"
