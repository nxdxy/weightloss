# AI Fitness Pal - 智能健身助手

一个基于 AI 的健身助手应用，帮助用户追踪饮食、运动和健康数据，提供智能分析和个性化建议。

## ✨ 功能特性

### 🔐 用户管理
- 用户注册和登录
- 个人资料管理
- 安全的 JWT 认证

### 📊 健康数据追踪
- 每日体重、腰围记录
- 饮水量和睡眠时间追踪
- 运动活动记录
- 营养摄入分析

### 🍽️ 智能餐食分析
- 文本和图片餐食识别
- AI 驱动的营养成分分析
- 热量和宏量营养素估算
- 餐食图片存储和管理

### 💬 AI 聊天助手
- 基于 Google Gemini 的智能对话
- 健身和营养咨询
- 图片分析和建议
- 聊天历史记录

### 📈 智能分析报告
- 综合健身进度分析
- 个性化建议和改进方案
- 数据可视化图表
- 成就和里程碑追踪

### 📚 饮食知识库
- 食物营养信息查询
- 健康饮食建议
- 营养搭配指导

## 🏗️ 技术架构

### 后端 (FastAPI)
- **框架**: FastAPI 0.104+
- **数据库**: SQLAlchemy + SQLite/PostgreSQL
- **认证**: JWT Token
- **AI 服务**: Google Gemini API
- **文件处理**: Pillow + aiofiles
- **部署**: Uvicorn + Docker

### 前端 (React)
- **框架**: React 19 + TypeScript
- **路由**: React Router v6
- **状态管理**: Zustand + TanStack Query
- **UI 框架**: TailwindCSS
- **HTTP 客户端**: Axios
- **构建工具**: Vite

### 数据存储
- **用户数据**: SQLite/PostgreSQL 数据库
- **图片文件**: 本地文件系统
- **会话管理**: JWT Token

## 🚀 快速开始

### 方式一：使用Conda环境（推荐）

```bash
# 克隆项目
git clone <repository-url>
cd ai-fitness-pal

# 使用conda启动脚本
chmod +x start-conda.sh
./start-conda.sh
```

或者手动创建conda环境：

```bash
# 创建conda环境
conda env create -f environment.yml

# 激活环境
conda activate ai-fitness-pal

# 启动后端
cd backend
cp .env.example .env
python init_db.py
python run.py

# 启动前端（新终端）
cd frontend
npm install
cp .env.example .env
npm run dev
```

### 方式二：使用启动脚本（自动检测环境）

```bash
# 给启动脚本执行权限
chmod +x start.sh

# 运行启动脚本（会自动检测conda或使用虚拟环境）
./start.sh
```

启动脚本会自动：
- 检查 Conda 或 Python 和 Node.js 环境
- 设置后端环境（conda优先，否则使用虚拟环境）
- 安装所有依赖
- 初始化数据库
- 启动前后端服务

### 方式三：手动启动（虚拟环境）

#### 1. 后端设置

```bash
cd backend

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件配置数据库和密钥

# 初始化数据库
python init_db.py

# 启动后端服务
python run.py
```

#### 2. 前端设置

```bash
cd frontend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件配置 API 地址

# 启动开发服务器
npm run dev
```

### 方式四：Docker 部署

```bash
# 构建并启动所有服务
docker-compose up --build

# 后台运行
docker-compose up -d
```

## 🌐 访问地址

启动成功后，您可以访问：

- **前端应用**: http://localhost:8888
- **后端 API**: http://localhost:8889
- **API 文档**: http://localhost:8889/docs
- **演示账户**: 用户名 `demo`，密码 `demo123`

## 🐍 Conda 环境管理

### 快速设置 Conda 环境

```bash
# 仅设置环境（不启动服务）
chmod +x setup-conda-env.sh
./setup-conda-env.sh

# 手动激活环境
conda activate ai-fitness-pal

# 检查环境
conda list
python --version
```

### Conda 常用命令

```bash
# 激活项目环境
conda activate ai-fitness-pal

# 查看所有环境
conda env list

# 退出环境
conda deactivate

# 删除环境
conda env remove -n ai-fitness-pal

# 导出环境配置
conda env export > environment.yml
```

详细的 Conda 使用指南请参考 [CONDA_SETUP.md](CONDA_SETUP.md)
