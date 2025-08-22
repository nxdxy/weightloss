from sqlalchemy import Column, Integer, String, DateTime, Date, Text, ForeignKey, JSON, Boolean
from sqlalchemy.types import DECIMAL
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    age = Column(Integer)
    gender = Column(String(10))
    height = Column(DECIMAL(5, 2))
    initial_weight = Column(DECIMAL(5, 2))
    activity_level = Column(String(20))
    gemini_api_key = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    daily_logs = relationship("DailyLog", back_populates="user", cascade="all, delete-orphan")
    analysis_reports = relationship("AnalysisReport", back_populates="user", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")


class DailyLog(Base):
    __tablename__ = "daily_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    weight_kg = Column(DECIMAL(5, 2))
    waist_cm = Column(DECIMAL(5, 2))
    water_l = Column(DECIMAL(4, 2))
    sleep_h = Column(DECIMAL(4, 2))
    bmr = Column(DECIMAL(7, 2))
    tdee = Column(DECIMAL(7, 2))
    actual_intake = Column(DECIMAL(7, 2))
    estimated_expenditure = Column(DECIMAL(7, 2))
    protein_g = Column(DECIMAL(6, 2))
    carbs_g = Column(DECIMAL(6, 2))
    fat_g = Column(DECIMAL(6, 2))
    calorie_deficit = Column(DECIMAL(7, 2))
    activity = Column(Text)
    summary = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="daily_logs")
    meal_logs = relationship("MealLog", back_populates="daily_log", cascade="all, delete-orphan")


class MealLog(Base):
    __tablename__ = "meal_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    daily_log_id = Column(Integer, ForeignKey("daily_logs.id"), nullable=False)
    meal_type = Column(String(20), nullable=False)  # breakfast, lunch, dinner
    text = Column(Text, nullable=False)
    image_path = Column(String(255))
    analysis_data = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    daily_log = relationship("DailyLog", back_populates="meal_logs")


class AnalysisReport(Base):
    __tablename__ = "analysis_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    report_data = Column(JSON, nullable=False)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="analysis_reports")


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String(10), nullable=False)  # user, model
    text = Column(Text, nullable=False)
    image_path = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="chat_messages")
