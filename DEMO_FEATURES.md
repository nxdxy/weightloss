# AI健身伙伴 - 完整功能演示

## 🎯 项目概述

AI健身伙伴是一个智能健康管理应用，完全复刻了原版本的所有功能，包括可编辑的每日记录、AI图片分析、营养计算等高级功能。

## ✨ 核心功能

### 📊 每日记录卡片
- **可编辑的基础指标**
  - 体重 (kg) - 点击数字即可编辑
  - 腰围 (cm) - 支持小数点输入
  - 饮水 (L) - 实时保存更改
  - 睡眠 (h) - 数字输入验证

### 🍽️ 三餐记录系统
- **图片上传与AI分析**
  - 支持拖拽上传或点击选择
  - 自动调用Gemini Vision API分析食物
  - 识别食材、营养成分、颜色信息
  - 生成详细的营养报告

- **智能文本编辑**
  - 点击即可编辑餐食描述
  - 支持多行文本输入
  - 自动保存功能
  - 占位符提示

### 🤖 AI智能分析
- **图片分析弹窗**
  - 左侧显示原图，右侧显示分析结果
  - 包含食物名称、菜系类型、详细描述
  - 营养成分估算（热量、蛋白质、碳水、脂肪）
  - 健康标签和食材识别
  - 颜色信息分析

- **每日AI小结**
  - 基于当日数据生成智能总结
  - 营养均衡评价
  - 运动建议
  - 生活习惯分析

### 📈 详细营养分析
- **可展开的营养面板**
  - 运动消耗 - 可手动编辑
  - 基础代谢 - 自动计算或手动调整
  - 总消耗 - 实时更新
  - 摄入热量 - 基于餐食分析
  - 热量缺口 - 自动计算差值
  - 三大营养素 - 蛋白质、碳水、脂肪

### 🎛️ 交互功能
- **批量操作**
  - 复选框选择记录
  - 批量AI分析
  - 批量删除功能
  - 数据导入导出

- **实时编辑**
  - 所有字段支持点击编辑
  - Enter保存，Escape取消
  - 数字字段类型验证
  - 多行文本支持

## 🛠️ 技术实现

### 前端技术栈
- **React 18** + TypeScript
- **Tailwind CSS** - 响应式设计
- **Lucide React** - 图标库
- **React Router** - 路由管理
- **Zustand** - 状态管理

### 后端技术栈
- **FastAPI** - 高性能API框架
- **SQLAlchemy** - ORM数据库操作
- **Pydantic** - 数据验证
- **Google Gemini API** - AI图片分析
- **Pillow** - 图片处理

### AI集成
- **Gemini Vision API**
  - 食物图片识别
  - 营养成分分析
  - 智能描述生成
  - 多语言支持

## 🚀 快速开始

### 1. 环境配置
```bash
# 克隆项目
git clone <repository-url>
cd ai-fitness-pal

# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
pip install -r requirements.txt
```

### 2. 配置API密钥
```bash
# 在backend目录创建.env文件
echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env
```

### 3. 启动服务
```bash
# 启动后端服务
cd backend
python run.py

# 启动前端服务
cd frontend
npm run dev
```

### 4. 访问演示
- 前端地址: http://localhost:5173
- 后端API: http://localhost:8000
- 演示页面: http://localhost:5173/demo

## 📱 功能演示

### 基础指标编辑
1. 点击任意数字字段（体重、腰围、饮水、睡眠）
2. 输入新数值
3. 按Enter保存或点击其他区域自动保存

### 图片AI分析
1. 点击餐食区域的"上传图片"按钮
2. 选择食物图片
3. 系统自动调用AI分析
4. 查看详细的营养分析结果

### 文本编辑
1. 点击任意文本区域
2. 输入或修改内容
3. 支持多行文本和格式化

### 营养分析
1. 点击"详细营养分析"展开面板
2. 查看完整的营养数据
3. 手动调整任意数值

## 🎨 界面特色

### 响应式设计
- 桌面端：完整功能展示
- 平板端：自适应布局
- 移动端：触摸友好

### 深色模式
- 自动检测系统主题
- 手动切换支持
- 完整的深色适配

### 动画效果
- 平滑的过渡动画
- 悬停状态反馈
- 加载状态指示

## 🔧 自定义配置

### API配置
```python
# backend/app/config.py
class Settings(BaseSettings):
    GEMINI_API_KEY: str = ""  # 配置你的API密钥
    database_url: str = "sqlite:///./fitness_pal.db"
    upload_dir: str = "./uploads"
```

### 前端配置
```typescript
// frontend/src/config.ts
export const API_BASE_URL = 'http://localhost:8000/api';
export const UPLOAD_MAX_SIZE = 10 * 1024 * 1024; // 10MB
```

## 📊 数据格式

### 每日记录结构
```typescript
interface DailyRecord {
  id: string;
  date: string;
  weight: number | null;
  waistline: number | null;
  water: number | null;
  sleep: number | null;
  breakfast: string;
  lunch: string;
  dinner: string;
  exercise: string;
  summary: string;
  // 营养分析
  exerciseCalories: number | null;
  basalMetabolism: number;
  totalCalories: number;
  calorieIntake: number;
  calorieDeficit: number;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}
```

### AI分析结果
```typescript
interface AIAnalysisResult {
  title: string;
  cuisine: string;
  description: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  tags: string[];
  ingredients: string[];
  colors: string[];
}
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- Google Gemini API 提供AI分析能力
- React生态系统的优秀工具
- 开源社区的支持和贡献

---

**注意**: 使用前请确保已正确配置Gemini API密钥，否则AI分析功能将无法正常工作。
