# 数据库设计

## 表结构设计

### 1. users 用户表
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    age INTEGER,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    height DECIMAL(5,2),
    initial_weight DECIMAL(5,2),
    activity_level VARCHAR(20) CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
    gemini_api_key VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. daily_logs 每日记录表
```sql
CREATE TABLE daily_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date DATE NOT NULL,
    weight_kg DECIMAL(5,2),
    waist_cm DECIMAL(5,2),
    water_l DECIMAL(4,2),
    sleep_h DECIMAL(4,2),
    bmr DECIMAL(7,2),
    tdee DECIMAL(7,2),
    actual_intake DECIMAL(7,2),
    estimated_expenditure DECIMAL(7,2),
    protein_g DECIMAL(6,2),
    carbs_g DECIMAL(6,2),
    fat_g DECIMAL(6,2),
    calorie_deficit DECIMAL(7,2),
    activity TEXT,
    summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, date)
);
```

### 3. meal_logs 餐食记录表
```sql
CREATE TABLE meal_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    daily_log_id INTEGER NOT NULL,
    meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    text_description TEXT,
    image_path VARCHAR(255),
    generated_meal_name VARCHAR(100),
    estimated_calories DECIMAL(7,2),
    estimated_protein_g DECIMAL(6,2),
    estimated_carbs_g DECIMAL(6,2),
    estimated_fat_g DECIMAL(6,2),
    description TEXT,
    tags JSON,
    identified_ingredients JSON,
    dominant_colors JSON,
    cuisine_style VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (daily_log_id) REFERENCES daily_logs(id) ON DELETE CASCADE
);
```

### 4. analysis_reports 分析报告表
```sql
CREATE TABLE analysis_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    report_data JSON NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 5. chat_messages 聊天记录表
```sql
CREATE TABLE chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_id VARCHAR(36),
    role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'model')),
    content TEXT NOT NULL,
    image_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 索引设计
```sql
-- 用户相关索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- 日志相关索引
CREATE INDEX idx_daily_logs_user_date ON daily_logs(user_id, date);
CREATE INDEX idx_daily_logs_date ON daily_logs(date);

-- 餐食记录索引
CREATE INDEX idx_meal_logs_daily_log ON meal_logs(daily_log_id);
CREATE INDEX idx_meal_logs_meal_type ON meal_logs(meal_type);

-- 分析报告索引
CREATE INDEX idx_analysis_reports_user ON analysis_reports(user_id);
CREATE INDEX idx_analysis_reports_generated_at ON analysis_reports(generated_at);

-- 聊天记录索引
CREATE INDEX idx_chat_messages_user_session ON chat_messages(user_id, session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
```

## 数据迁移策略

### 从localStorage迁移到数据库
1. 创建数据迁移脚本，读取现有localStorage数据
2. 解析并验证数据格式
3. 批量插入到新的数据库表中
4. 处理图片文件的迁移（从base64转换为文件存储）
