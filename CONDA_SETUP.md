# Conda 环境设置指南

本文档详细说明如何使用 Conda 环境来运行 AI Fitness Pal 项目。

## 🐍 为什么使用 Conda？

- **环境隔离**: 避免不同项目之间的依赖冲突
- **包管理**: 更好的包依赖解析和管理
- **跨平台**: 在 Windows、macOS、Linux 上一致的体验
- **版本控制**: 精确控制 Python 和包的版本

## 📦 安装 Conda

### 选项 1: Miniconda（推荐，轻量级）

```bash
# macOS
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-MacOSX-x86_64.sh
bash Miniconda3-latest-MacOSX-x86_64.sh

# Linux
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
bash Miniconda3-latest-Linux-x86_64.sh

# Windows
# 下载并运行: https://repo.anaconda.com/miniconda/Miniconda3-latest-Windows-x86_64.exe
```

### 选项 2: Anaconda（完整版）

访问 [Anaconda 官网](https://www.anaconda.com/products/distribution) 下载安装包。

## 🚀 快速启动

### 方法 1: 使用专用启动脚本

```bash
# 给脚本执行权限
chmod +x start-conda.sh

# 运行脚本
./start-conda.sh
```

### 方法 2: 使用环境配置文件

```bash
# 从配置文件创建环境
conda env create -f environment.yml

# 激活环境
conda activate ai-fitness-pal

# 手动启动服务
cd backend && python run.py &
cd frontend && npm run dev
```

### 方法 3: 手动创建环境

```bash
# 创建新环境
conda create -n ai-fitness-pal python=3.11 -y

# 激活环境
conda activate ai-fitness-pal

# 安装后端依赖
cd backend
pip install -r requirements.txt

# 安装前端依赖（可选：也可以用conda安装nodejs）
conda install -c conda-forge nodejs npm
cd ../frontend
npm install
```

## 🔧 环境管理命令

### 基本操作

```bash
# 列出所有环境
conda env list

# 激活环境
conda activate ai-fitness-pal

# 退出环境
conda deactivate

# 删除环境
conda env remove -n ai-fitness-pal
```

### 包管理

```bash
# 在环境中安装包
conda activate ai-fitness-pal
conda install package-name

# 使用pip安装（在conda环境中）
pip install package-name

# 列出环境中的包
conda list

# 导出环境配置
conda env export > environment.yml
```

### 环境信息

```bash
# 查看conda信息
conda info

# 查看当前环境信息
conda info --envs

# 查看环境中的Python路径
which python
```

## 🛠️ 开发工作流

### 日常开发

```bash
# 1. 激活环境
conda activate ai-fitness-pal

# 2. 启动开发服务器
cd backend && python run.py &
cd frontend && npm run dev

# 3. 开发完成后停止服务
# Ctrl+C 停止服务

# 4. 退出环境（可选）
conda deactivate
```

### 添加新依赖

```bash
# 激活环境
conda activate ai-fitness-pal

# 安装新的Python包
pip install new-package

# 更新requirements.txt
pip freeze > backend/requirements.txt

# 或者更新environment.yml
conda env export > environment.yml
```

## 🔍 故障排除

### 常见问题

**Q: conda 命令不存在**
```bash
# 初始化conda
~/miniconda3/bin/conda init bash
# 重启终端或执行
source ~/.bashrc
```

**Q: 环境激活失败**
```bash
# 检查环境是否存在
conda env list

# 重新创建环境
conda env remove -n ai-fitness-pal
conda env create -f environment.yml
```

**Q: 包安装失败**
```bash
# 更新conda
conda update conda

# 清理缓存
conda clean --all

# 使用不同的channel
conda install -c conda-forge package-name
```

**Q: Python版本不对**
```bash
# 检查当前Python版本
python --version

# 确保在正确的环境中
conda activate ai-fitness-pal
which python
```

### 环境重置

如果环境出现问题，可以完全重置：

```bash
# 1. 删除现有环境
conda env remove -n ai-fitness-pal

# 2. 重新创建
conda env create -f environment.yml

# 3. 激活并验证
conda activate ai-fitness-pal
python --version
pip list
```

## 📝 最佳实践

1. **始终使用环境**: 不要在base环境中安装项目依赖
2. **定期更新**: 定期更新environment.yml文件
3. **版本锁定**: 在生产环境中锁定包版本
4. **文档同步**: 保持依赖文档与实际环境同步

## 🔗 有用的链接

- [Conda 官方文档](https://docs.conda.io/)
- [Conda 备忘单](https://docs.conda.io/projects/conda/en/latest/user-guide/cheatsheet.html)
- [环境管理最佳实践](https://docs.conda.io/projects/conda/en/latest/user-guide/tasks/manage-environments.html)

## 💡 提示

- 使用 `conda activate ai-fitness-pal` 激活环境后，终端提示符会显示环境名称
- 可以在 IDE（如 VSCode）中选择 conda 环境作为 Python 解释器
- 建议将 `conda activate ai-fitness-pal` 添加到你的开发脚本中
