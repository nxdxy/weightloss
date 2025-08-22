# AI Fitness Pal DevOps 完整指南

## 🚀 概述

这是一个完整的 DevOps 解决方案，包含：
- 自动化部署和更新
- 远程调试和监控
- CI/CD 流水线
- 健康检查和告警
- 备份和回滚

## 📁 文件结构

```
ai-fitness-pal/
├── scripts/
│   ├── deploy-update.sh      # 部署更新脚本
│   ├── remote-debug.sh       # 远程调试工具
│   ├── monitoring.sh         # 监控脚本
│   └── ci-cd.sh             # CI/CD 脚本
├── systemd/
│   ├── ai-fitness-pal.service         # 系统服务
│   └── ai-fitness-pal-monitor.service # 监控服务
├── docker-compose.prod.yml   # 生产环境配置
├── deploy.sh                # 一键部署脚本
└── devops-guide.md          # 本指南
```

## 🛠 功能特性

### 1. 自动化部署 (`scripts/deploy-update.sh`)

**功能：**
- 零停机更新
- 自动备份
- 健康检查
- 回滚支持

**使用方法：**
```bash
# 执行更新
./scripts/deploy-update.sh update

# 创建备份
./scripts/deploy-update.sh backup

# 回滚到指定版本
./scripts/deploy-update.sh rollback backup_20231201_143022

# 健康检查
./scripts/deploy-update.sh health
```

### 2. 远程调试 (`scripts/remote-debug.sh`)

**功能：**
- 实时日志查看
- 容器管理
- 数据库操作
- 性能监控
- 问题诊断

**使用方法：**
```bash
# 交互模式
./scripts/remote-debug.sh

# 命令行模式
./scripts/remote-debug.sh status
./scripts/remote-debug.sh logs backend 100
./scripts/remote-debug.sh enter backend
./scripts/remote-debug.sh db backup
./scripts/remote-debug.sh monitor
./scripts/remote-debug.sh diagnose
```

### 3. 监控告警 (`scripts/monitoring.sh`)

**功能：**
- 服务健康检查
- 系统资源监控
- 自动告警
- 自动恢复
- 监控报告

**配置告警：**
```bash
# 编辑监控脚本
vim scripts/monitoring.sh

# 设置邮件告警
ALERT_EMAIL="admin@yourdomain.com"

# 设置 Webhook 告警（钉钉、企业微信等）
WEBHOOK_URL="https://your-webhook-url"
```

**使用方法：**
```bash
# 一次性检查
./scripts/monitoring.sh check

# 持续监控
./scripts/monitoring.sh start

# 生成报告
./scripts/monitoring.sh report

# 测试告警
./scripts/monitoring.sh test-alert
```

### 4. CI/CD 流水线 (`scripts/ci-cd.sh`)

**功能：**
- 自动化测试
- 镜像构建
- 版本管理
- 多环境部署
- 回滚支持

**使用方法：**
```bash
# 运行测试
./scripts/ci-cd.sh test

# 构建镜像
./scripts/ci-cd.sh build 1.2.3

# 创建发布
./scripts/ci-cd.sh release minor

# 部署到测试环境
./scripts/ci-cd.sh deploy staging

# 部署到生产环境
./scripts/ci-cd.sh deploy production

# 回滚
./scripts/ci-cd.sh rollback production v1.1.0
```

## 🔧 部署配置

### 1. 初始部署

```bash
# 1. 上传代码到服务器
scp -r ai-fitness-pal/ user@server:/opt/

# 2. 登录服务器
ssh user@server

# 3. 进入项目目录
cd /opt/ai-fitness-pal

# 4. 设置权限
chmod +x scripts/*.sh
chmod +x deploy.sh

# 5. 一键部署
./deploy.sh yourdomain.com

# 6. 安装系统服务
sudo cp systemd/*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable ai-fitness-pal
sudo systemctl enable ai-fitness-pal-monitor
sudo systemctl start ai-fitness-pal
sudo systemctl start ai-fitness-pal-monitor
```

### 2. 环境变量配置

创建 `.env` 文件：
```bash
# 应用配置
SECRET_KEY=your-secret-key-here
DEBUG=false
LOG_LEVEL=INFO

# 域名配置
DOMAIN=yourdomain.com
VITE_API_BASE_URL=https://yourdomain.com

# 监控配置
ALERT_EMAIL=admin@yourdomain.com
WEBHOOK_URL=https://your-webhook-url

# 镜像仓库配置
REGISTRY=your-registry.com
```

### 3. 数据迁移

```bash
# 备份本地数据
cd backend
cp fitness_pal.db fitness_pal_backup.db
tar -czf uploads_backup.tar.gz uploads/

# 上传到服务器
scp fitness_pal_backup.db user@server:/opt/ai-fitness-pal/data/fitness_pal.db
scp uploads_backup.tar.gz user@server:/opt/ai-fitness-pal/
ssh user@server "cd /opt/ai-fitness-pal && tar -xzf uploads_backup.tar.gz"
```

## 📊 监控和维护

### 1. 日常监控

```bash
# 查看服务状态
sudo systemctl status ai-fitness-pal
sudo systemctl status ai-fitness-pal-monitor

# 查看应用日志
./scripts/remote-debug.sh logs

# 查看监控日志
tail -f /var/log/ai-fitness-pal-monitor.log

# 性能监控
./scripts/remote-debug.sh monitor
```

### 2. 健康检查

```bash
# 手动健康检查
curl http://localhost:8000/health

# 详细健康检查
curl http://localhost:8000/health/detailed

# 自动监控检查
./scripts/monitoring.sh check
```

### 3. 备份策略

```bash
# 设置定时备份
sudo crontab -e

# 添加以下行（每天凌晨2点备份）
0 2 * * * /opt/ai-fitness-pal/scripts/deploy-update.sh backup

# 每周清理旧备份
0 3 * * 0 find /opt/backups/ai-fitness-pal -type d -mtime +30 -exec rm -rf {} \;
```

## 🔄 迭代升级流程

### 1. 开发环境测试

```bash
# 本地测试
./scripts/ci-cd.sh test

# 构建镜像
./scripts/ci-cd.sh build
```

### 2. 测试环境部署

```bash
# 部署到测试环境
./scripts/ci-cd.sh deploy staging

# 验证功能
curl http://staging.yourdomain.com/health
```

### 3. 生产环境发布

```bash
# 创建发布版本
./scripts/ci-cd.sh release minor

# 部署到生产环境
./scripts/ci-cd.sh deploy production

# 验证部署
./scripts/monitoring.sh check
```

### 4. 回滚流程

```bash
# 如果发现问题，立即回滚
./scripts/ci-cd.sh rollback production

# 或者回滚到指定版本
./scripts/ci-cd.sh rollback production v1.1.0
```

## 🚨 故障处理

### 1. 常见问题

**服务无法启动：**
```bash
# 查看容器状态
docker-compose -f docker-compose.prod.yml ps

# 查看错误日志
./scripts/remote-debug.sh logs

# 重启服务
sudo systemctl restart ai-fitness-pal
```

**数据库问题：**
```bash
# 进入数据库
./scripts/remote-debug.sh db shell

# 备份数据库
./scripts/remote-debug.sh db backup

# 检查数据库大小
./scripts/remote-debug.sh db size
```

**性能问题：**
```bash
# 实时监控
./scripts/remote-debug.sh monitor

# 系统诊断
./scripts/remote-debug.sh diagnose

# 清理系统
./scripts/remote-debug.sh cleanup
```

### 2. 紧急恢复

```bash
# 停止服务
sudo systemctl stop ai-fitness-pal

# 恢复最近备份
./scripts/deploy-update.sh rollback

# 重启服务
sudo systemctl start ai-fitness-pal

# 验证恢复
./scripts/monitoring.sh check
```

## 📈 性能优化

### 1. 资源限制

在 `docker-compose.prod.yml` 中配置：
```yaml
deploy:
  resources:
    limits:
      memory: 1G
      cpus: '0.5'
    reservations:
      memory: 512M
      cpus: '0.25'
```

### 2. 日志管理

```bash
# 配置日志轮转
echo '{"log-driver":"json-file","log-opts":{"max-size":"10m","max-file":"3"}}' | sudo tee /etc/docker/daemon.json
sudo systemctl restart docker
```

### 3. 缓存优化

```bash
# 清理 Docker 缓存
docker system prune -f

# 清理应用缓存
./scripts/remote-debug.sh cleanup
```

## 🔐 安全建议

1. **定期更新密钥**：更改 `.env` 中的 `SECRET_KEY`
2. **防火墙配置**：只开放必要端口（80, 443）
3. **SSL 证书**：使用 Let's Encrypt 自动续期
4. **访问控制**：限制 SSH 访问和 Docker 权限
5. **日志监控**：监控异常访问和错误日志

## 📞 支持和维护

- **监控告警**：配置邮件和 Webhook 告警
- **定期备份**：自动备份数据库和文件
- **性能监控**：实时监控系统资源
- **健康检查**：自动检查服务状态
- **自动恢复**：服务异常时自动重启

这个 DevOps 方案提供了完整的生产环境管理能力，支持快速迭代、稳定运行和高效维护。
