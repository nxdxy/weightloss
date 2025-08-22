#!/usr/bin/env python3
"""
Database initialization script
Creates all tables and optionally adds sample data
"""

import os
import sys
from sqlalchemy.orm import Session

# Add the app directory to the path
sys.path.append(os.path.dirname(__file__))

from app.database import engine, SessionLocal
from app.models import Base, User, DailyLog, MealLog, AnalysisReport, ChatMessage
from app.auth import get_password_hash
from datetime import date, datetime
import json


def create_tables():
    """Create all database tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created successfully!")


def create_sample_user(db: Session):
    """Create a sample user for testing"""
    print("Creating sample user...")
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.username == "demo").first()
    if existing_user:
        print("⚠️  Sample user 'demo' already exists")
        return existing_user
    
    # Create sample user
    sample_user = User(
        username="demo",
        email="demo@example.com",
        password_hash=get_password_hash("demo123"),
        age=30,
        gender="male",
        height=175.0,
        initial_weight=80.0,
        activity_level="moderate",
        gemini_api_key=""  # User needs to set this
    )
    
    db.add(sample_user)
    db.commit()
    db.refresh(sample_user)
    
    print("✅ Sample user created:")
    print(f"   Username: demo")
    print(f"   Password: demo123")
    print(f"   Email: demo@example.com")
    
    return sample_user


def create_sample_data(db: Session, user: User):
    """Create sample daily logs and meals"""
    print("Creating sample data...")
    
    # Sample daily log
    sample_log = DailyLog(
        user_id=user.id,
        date=date.today(),
        weight_kg=79.5,
        waist_cm=85.0,
        water_l=2.5,
        sleep_h=7.5,
        bmr=1800.0,
        tdee=2200.0,
        actual_intake=2000.0,
        estimated_expenditure=300.0,
        protein_g=120.0,
        carbs_g=200.0,
        fat_g=80.0,
        calorie_deficit=200.0,
        activity="晨跑30分钟，力量训练45分钟",
        summary="今日饮食控制良好，运动量充足，预计减重效果理想。"
    )
    
    db.add(sample_log)
    db.commit()
    db.refresh(sample_log)
    
    # Sample meals
    sample_meals = [
        MealLog(
            daily_log_id=sample_log.id,
            meal_type="breakfast",
            text="燕麦粥配蓝莓和坚果 (~350 kcal)",
            analysis_data={
                "generatedMealName": "燕麦粥配蓝莓坚果",
                "estimatedCalories": 350,
                "estimatedProteinG": 12.0,
                "estimatedCarbsG": 45.0,
                "estimatedFatG": 15.0,
                "description": "营养均衡的早餐，富含纤维和抗氧化物质",
                "tags": ["健康", "高纤维", "抗氧化"],
                "identifiedIngredients": ["燕麦", "蓝莓", "坚果"],
                "dominantColors": ["白色", "蓝色", "棕色"],
                "cuisineStyle": "西式健康餐"
            }
        ),
        MealLog(
            daily_log_id=sample_log.id,
            meal_type="lunch",
            text="烤鸡胸肉沙拉配橄榄油醋汁 (~450 kcal)",
            analysis_data={
                "generatedMealName": "烤鸡胸肉沙拉",
                "estimatedCalories": 450,
                "estimatedProteinG": 35.0,
                "estimatedCarbsG": 20.0,
                "estimatedFatG": 25.0,
                "description": "高蛋白低碳水的减脂餐，营养丰富",
                "tags": ["高蛋白", "减脂", "低碳水"],
                "identifiedIngredients": ["鸡胸肉", "生菜", "番茄", "黄瓜", "橄榄油"],
                "dominantColors": ["绿色", "白色", "红色"],
                "cuisineStyle": "地中海风味"
            }
        ),
        MealLog(
            daily_log_id=sample_log.id,
            meal_type="dinner",
            text="蒸鱼配蔬菜和糙米 (~400 kcal)",
            analysis_data={
                "generatedMealName": "蒸鱼配蔬菜糙米",
                "estimatedCalories": 400,
                "estimatedProteinG": 30.0,
                "estimatedCarbsG": 35.0,
                "estimatedFatG": 12.0,
                "description": "清淡健康的晚餐，易消化且营养全面",
                "tags": ["清淡", "易消化", "营养全面"],
                "identifiedIngredients": ["鱼肉", "西兰花", "胡萝卜", "糙米"],
                "dominantColors": ["白色", "绿色", "橙色"],
                "cuisineStyle": "中式健康餐"
            }
        )
    ]
    
    for meal in sample_meals:
        db.add(meal)
    
    db.commit()
    
    print("✅ Sample data created successfully!")


def main():
    """Main initialization function"""
    print("🚀 Initializing AI Fitness Pal Database...")
    print("=" * 50)
    
    # Create tables
    create_tables()
    
    # Create sample data
    db = SessionLocal()
    try:
        sample_user = create_sample_user(db)
        create_sample_data(db, sample_user)
    except Exception as e:
        print(f"❌ Error creating sample data: {e}")
        db.rollback()
    finally:
        db.close()
    
    print("=" * 50)
    print("✅ Database initialization completed!")
    print("\n📝 Next steps:")
    print("1. Start the backend server: python run.py")
    print("2. Login with demo user (username: demo, password: demo123)")
    print("3. Configure Gemini API key in user settings")
    print("4. Start using the application!")


if __name__ == "__main__":
    main()
