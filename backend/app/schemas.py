from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from decimal import Decimal


# User Schemas
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    age: Optional[int] = Field(None, ge=1, le=150)
    gender: Optional[str] = Field(None, pattern="^(male|female|other)$")
    height: Optional[Decimal] = Field(None, ge=50, le=300)
    initial_weight: Optional[Decimal] = Field(None, ge=20, le=500)
    activity_level: Optional[str] = Field(None, pattern="^(sedentary|light|moderate|active|very_active)$")


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    age: Optional[int] = Field(None, ge=1, le=150)
    gender: Optional[str] = Field(None, pattern="^(male|female|other)$")
    height: Optional[Decimal] = Field(None, ge=50, le=300)
    initial_weight: Optional[Decimal] = Field(None, ge=20, le=500)
    activity_level: Optional[str] = Field(None, pattern="^(sedentary|light|moderate|active|very_active)$")


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ApiKeyUpdate(BaseModel):
    gemini_api_key: str = Field(..., min_length=1)


# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class UserLogin(BaseModel):
    username: str
    password: str


# Meal Schemas
class MealAnalysisData(BaseModel):
    generatedMealName: str
    estimatedCalories: int
    estimatedProteinG: Optional[Decimal] = Field(default=0)
    estimatedCarbsG: Optional[Decimal] = Field(default=0)
    estimatedFatG: Optional[Decimal] = Field(default=0)
    description: str
    tags: List[str]
    identifiedIngredients: List[str]
    dominantColors: List[str]
    cuisineStyle: str
    fatLossRating: Optional[int] = Field(default=5, ge=1, le=10)
    fatLossAdvantages: Optional[List[str]] = Field(default_factory=list)
    fatLossDisadvantages: Optional[List[str]] = Field(default_factory=list)
    improvementTips: Optional[List[str]] = Field(default_factory=list)

    @classmethod
    def from_dict(cls, data: dict):
        """从字典创建实例，处理向后兼容性"""
        # 处理 fatLossAdvantages 的向后兼容性
        if 'fatLossAdvantages' in data:
            if isinstance(data['fatLossAdvantages'], str):
                # 如果是字符串，转换为单元素数组
                data['fatLossAdvantages'] = [data['fatLossAdvantages']] if data['fatLossAdvantages'].strip() else []

        # 处理 fatLossDisadvantages 的向后兼容性
        if 'fatLossDisadvantages' in data:
            if isinstance(data['fatLossDisadvantages'], str):
                # 如果是字符串，转换为单元素数组
                data['fatLossDisadvantages'] = [data['fatLossDisadvantages']] if data['fatLossDisadvantages'].strip() else []

        return cls(**data)


class MealLogBase(BaseModel):
    meal_type: str = Field(..., pattern="^(breakfast|lunch|dinner)$")
    text: str
    analysis_data: Optional[MealAnalysisData] = None


class MealLogCreate(MealLogBase):
    pass


class MealLogResponse(MealLogBase):
    id: int
    image_path: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# Daily Log Schemas
class DailyLogBase(BaseModel):
    date: date
    weight_kg: Optional[Decimal] = Field(None, ge=20, le=500)
    waist_cm: Optional[Decimal] = Field(None, ge=30, le=200)
    water_l: Optional[Decimal] = Field(None, ge=0, le=20)
    sleep_h: Optional[Decimal] = Field(None, ge=0, le=24)
    bmr: Optional[Decimal] = Field(None, ge=0)
    tdee: Optional[Decimal] = Field(None, ge=0)
    actual_intake: Optional[Decimal] = Field(None, ge=0)
    estimated_expenditure: Optional[Decimal] = Field(None, ge=0)
    protein_g: Optional[Decimal] = Field(None, ge=0)
    carbs_g: Optional[Decimal] = Field(None, ge=0)
    fat_g: Optional[Decimal] = Field(None, ge=0)
    calorie_deficit: Optional[Decimal] = Field(None)
    activity: Optional[str] = ""
    summary: Optional[str] = ""


class DailyLogCreate(DailyLogBase):
    pass


class DailyLogUpdate(BaseModel):
    weight_kg: Optional[Decimal] = Field(None, ge=20, le=500)
    waist_cm: Optional[Decimal] = Field(None, ge=30, le=200)
    water_l: Optional[Decimal] = Field(None, ge=0, le=20)
    sleep_h: Optional[Decimal] = Field(None, ge=0, le=24)
    bmr: Optional[Decimal] = Field(None, ge=0)
    tdee: Optional[Decimal] = Field(None, ge=0)
    actual_intake: Optional[Decimal] = Field(None, ge=0)
    estimated_expenditure: Optional[Decimal] = Field(None, ge=0)
    protein_g: Optional[Decimal] = Field(None, ge=0)
    carbs_g: Optional[Decimal] = Field(None, ge=0)
    fat_g: Optional[Decimal] = Field(None, ge=0)
    calorie_deficit: Optional[Decimal] = Field(None)
    activity: Optional[str] = None
    summary: Optional[str] = None


class DailyLogResponse(DailyLogBase):
    id: int
    user_id: int
    meal_logs: List[MealLogResponse] = []
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Analysis Report Schemas
class AnalysisReportResponse(BaseModel):
    id: int
    user_id: int
    report_data: Dict[str, Any]
    generated_at: datetime
    
    class Config:
        from_attributes = True


# Chat Schemas
class ChatMessageBase(BaseModel):
    role: str = Field(..., pattern="^(user|model)$")
    text: str


class ChatMessageCreate(BaseModel):
    text: str


class ChatMessageResponse(ChatMessageBase):
    id: int
    user_id: int
    image_path: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# File Upload Schemas
class FileUploadResponse(BaseModel):
    filename: str
    file_path: str
    file_size: int
