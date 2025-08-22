# AI Fitness Pal 服务器迁移指南

## 1. 本地准备工作

### 1.1 备份数据库
```bash
# 在本地项目目录
cd backend
cp fitness_pal.db fitness_pal_backup.db
```

### 1.2 打包上传文件
```bash
cd backend
tar -czf uploads_backup.tar.gz uploads/
```

### 1.3 打包项目代码
```bash
# 在项目根目录
tar -czf ai-fitness-pal.tar.gz \
  --exclude='node_modules' \
  --exclude='__pycache__' \
  --exclude='.git' \
  --exclude='*.pyc' \
  --exclude='dist' \
  --exclude='build' \
  --exclude='.env' \
  .
```

## 2. 服务器环境准备

### 2.1 安装 Docker（Ubuntu/Debian）
```bash
# 更新包索引
sudo apt update

# 安装必要的包
sudo apt install apt-transport-https ca-certificates curl gnupg lsb-release

# 添加 Docker 官方 GPG 密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 添加 Docker 仓库
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 将用户添加到 docker 组
sudo usermod -aG docker $USER
```

### 2.2 安装 Docker（CentOS/RHEL）
```bash
# 安装必要的包
sudo yum install -y yum-utils

# 添加 Docker 仓库
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 安装 Docker
sudo yum install docker-ce docker-ce-cli containerd.io

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## 3. 部署步骤

### 3.1 上传文件到服务器
```bash
# 使用 scp 上传文件
scp ai-fitness-pal.tar.gz user@your-server:/home/user/
scp uploads_backup.tar.gz user@your-server:/home/user/
```

### 3.2 在服务器上解压和部署
```bash
# 登录服务器
ssh user@your-server

# 解压项目
tar -xzf ai-fitness-pal.tar.gz
cd ai-fitness-pal

# 恢复上传文件
cd backend
tar -xzf ../uploads_backup.tar.gz

# 恢复数据库
cp fitness_pal_backup.db fitness_pal.db

# 返回项目根目录
cd ..

# 设置部署脚本权限
chmod +x deploy.sh

# 部署（替换 yourdomain.com 为你的域名）
./deploy.sh yourdomain.com
```

## 4. 配置域名和 HTTPS

### 4.1 配置域名解析
在你的域名提供商处，添加 A 记录指向服务器 IP：
```
A    @    your-server-ip
A    www  your-server-ip
```

### 4.2 配置 HTTPS（使用 Let's Encrypt）
```bash
# 安装 certbot
sudo apt install certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 设置自动续期
sudo crontab -e
# 添加以下行：
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## 5. 监控和维护

### 5.1 查看服务状态
```bash
# 查看容器状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

### 5.2 常用维护命令
```bash
# 重启服务
docker-compose -f docker-compose.prod.yml restart

# 停止服务
docker-compose -f docker-compose.prod.yml down

# 更新代码后重新部署
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# 备份数据
docker cp ai-fitness-pal-backend:/app/data/fitness_pal.db ./backup-$(date +%Y%m%d).db
docker cp ai-fitness-pal-backend:/app/uploads ./uploads-backup-$(date +%Y%m%d)
```

## 6. 故障排除

### 6.1 常见问题
1. **端口被占用**：检查 80/443 端口是否被其他服务占用
2. **权限问题**：确保 uploads 和 data 目录有正确的权限
3. **内存不足**：确保服务器有足够的内存（建议至少 2GB）
4. **防火墙**：确保防火墙允许 80 和 443 端口

### 6.2 性能优化
```bash
# 设置 Docker 日志轮转
echo '{"log-driver":"json-file","log-opts":{"max-size":"10m","max-file":"3"}}' | sudo tee /etc/docker/daemon.json
sudo systemctl restart docker

# 设置系统资源限制
# 在 docker-compose.prod.yml 中添加：
# deploy:
#   resources:
#     limits:
#       memory: 512M
#     reservations:
#       memory: 256M
```

## 7. 安全建议

1. **更改默认密钥**：修改 .env 文件中的 SECRET_KEY
2. **设置防火墙**：只开放必要的端口
3. **定期备份**：设置自动备份脚本
4. **更新系统**：定期更新服务器和 Docker 镜像
5. **监控日志**：设置日志监控和告警
