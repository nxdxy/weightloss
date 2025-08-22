# AI Fitness Pal Backend

基于 FastAPI 的 AI 健身助手后端 API 服务。

## 功能特性

- 🔐 JWT 用户认证系统
- 👤 用户信息管理
- 📊 每日健身数据记录
- 🍽️ 餐食分析与图片识别
- 📈 智能分析报告生成
- 💬 AI 聊天助手
- 📁 文件上传与存储
- 🗄️ SQLite/PostgreSQL 数据持久化

## 技术栈

- **框架**: FastAPI 0.104+
- **数据库**: SQLAlchemy + SQLite/PostgreSQL
- **认证**: JWT Token
- **AI 服务**: Google Gemini API
- **文件处理**: Pillow + aiofiles
- **部署**: Uvicorn

## 快速开始

### 1. 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

### 2. 环境配置

复制环境变量模板：
```bash
cp .env.example .env
```

编辑 `.env` 文件，配置必要的环境变量：
```env
# 数据库配置
DATABASE_URL=sqlite:///./fitness_pal.db

# 安全配置
SECRET_KEY=your-super-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30

# 文件存储
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# CORS 配置
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# 开发模式
DEBUG=True
```

### 3. 启动服务

```bash
python run.py
```

服务将在 `http://localhost:8000` 启动。

### 4. API 文档

启动服务后，访问以下地址查看 API 文档：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API 接口

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息
- `POST /api/auth/refresh` - 刷新 token

### 用户管理
- `GET /api/users/profile` - 获取用户资料
- `PUT /api/users/profile` - 更新用户资料
- `PUT /api/users/api-key` - 更新 Gemini API 密钥

### 每日记录
- `GET /api/daily-logs` - 获取每日记录列表
- `POST /api/daily-logs` - 创建每日记录
- `GET /api/daily-logs/{id}` - 获取特定记录
- `PUT /api/daily-logs/{id}` - 更新记录
- `DELETE /api/daily-logs/{id}` - 删除记录

### 餐食分析
- `POST /api/meals/analyze` - 分析餐食
- `POST /api/meals/upload-image` - 上传餐食图片
- `GET /api/meals/images/{filename}` - 获取餐食图片

## 数据库结构

### 用户表 (users)
- 基本信息：用户名、邮箱、密码
- 身体数据：年龄、性别、身高、初始体重
- 配置：活动水平、Gemini API 密钥

### 每日记录表 (daily_logs)
- 日期、体重、腰围、饮水量、睡眠时间
- 营养数据：BMR、TDEE、摄入热量、消耗热量
- 宏量营养素：蛋白质、碳水化合物、脂肪
- 活动记录、日总结

### 餐食记录表 (meal_logs)
- 餐别（早餐、午餐、晚餐）
- 文本描述、图片路径
- AI 分析数据（JSON 格式）

### 分析报告表 (analysis_reports)
- 用户 ID、报告数据（JSON）
- 生成时间

### 聊天记录表 (chat_messages)
- 用户 ID、角色（用户/AI）
- 消息内容、图片路径
- 创建时间

## 文件存储

文件按以下结构存储：
```
uploads/
├── meals/          # 餐食图片
│   ├── 2024/
│   │   ├── 01/
│   │   │   ├── user_123_meal_1704067200.jpg
└── chat/           # 聊天图片
    ├── 2024/
        ├── 01/
            ├── user_123_chat_1704067200.jpg
```

## 开发说明

### 添加新的 API 路由

1. 在 `app/routers/` 目录下创建新的路由文件
2. 在 `app/main.py` 中引入并注册路由
3. 更新相应的数据模型和 Pydantic 模式

### 数据库迁移

使用 Alembic 进行数据库迁移：
```bash
# 生成迁移文件
alembic revision --autogenerate -m "描述"

# 执行迁移
alembic upgrade head
```

### 测试

```bash
# 运行测试
pytest

# 运行测试并生成覆盖率报告
pytest --cov=app
```

## 部署

### 生产环境配置

1. 设置环境变量：
```env
DEBUG=False
DATABASE_URL=postgresql://user:password@localhost/fitness_pal
SECRET_KEY=your-production-secret-key
```

2. 使用 Gunicorn 部署：
```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Docker 部署

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["python", "run.py"]
```

## 许可证

MIT License
