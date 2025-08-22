from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
import base64
import io
from PIL import Image
import google.generativeai as genai
from typing import Dict, Any, List
import json
import os

from app.database import get_db
from app.config import settings
from app.auth import get_current_active_user
from app.models import User

router = APIRouter()

def analyze_food_image(image_data: bytes, api_key: str) -> Dict[str, Any]:
    """
    使用Gemini Vision API分析食物图片
    """
    try:
        # 转换图片格式
        image = Image.open(io.BytesIO(image_data))
        
        # 如果图片太大，调整大小
        if image.width > 1024 or image.height > 1024:
            image.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
        
        # 转换为RGB格式（如果需要）
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # 保存到内存中
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format='JPEG')
        img_byte_arr = img_byte_arr.getvalue()
        
        # 配置并使用Gemini Vision API
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = """
        请分析这张食物图片，并以JSON格式返回以下信息：
        
        {
            "title": "食物名称（中文）",
            "cuisine": "菜系类型（如：中式、西式、日式等）",
            "description": "详细描述食物的外观、颜色、搭配等（100-200字）",
            "nutrition": {
                "calories": 估算热量（数字，单位kcal）,
                "protein": 估算蛋白质（数字，单位g）,
                "carbs": 估算碳水化合物（数字，单位g）,
                "fat": 估算脂肪（数字，单位g）
            },
            "tags": ["健康餐", "均衡膳食", "高蛋白", "低脂", "高纤维"等标签],
            "ingredients": ["识别出的主要食材"],
            "colors": ["主要颜色（如：深紫色、绿色、橙色、棕色、白色等）"]
        }
        
        请确保返回的是有效的JSON格式，营养数据要尽可能准确。
        """
        
        # 创建图片对象
        image_part = {
            "mime_type": "image/jpeg",
            "data": img_byte_arr
        }
        
        response = model.generate_content([prompt, image_part])
        
        # 解析响应
        response_text = response.text.strip()
        
        # 尝试提取JSON（有时候模型会在JSON前后添加其他文本）
        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}') + 1
        
        if start_idx != -1 and end_idx != -1:
            json_str = response_text[start_idx:end_idx]
            result = json.loads(json_str)
            return result
        else:
            raise ValueError("无法从响应中提取有效的JSON")
            
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"JSON解析错误: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"图片分析失败: {str(e)}")

@router.post("/analyze-food-image")
async def analyze_food_image_endpoint(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    分析食物图片并返回营养信息
    """
    # 检查用户是否配置了API密钥
    if not current_user.gemini_api_key:
        raise HTTPException(status_code=400, detail="请先在设置页面配置 Gemini API 密钥")

    # 验证文件类型
    if not image.content_type or not image.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="请上传有效的图片文件")

    # 验证文件大小（限制为10MB）
    if image.size and image.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="图片文件过大，请上传小于10MB的图片")

    try:
        # 读取图片数据
        image_data = await image.read()

        # 分析图片
        analysis_result = analyze_food_image(image_data, current_user.gemini_api_key)
        
        # 将图片转换为base64以便前端显示
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        
        return {
            "success": True,
            "analysis": analysis_result,
            "image_base64": f"data:{image.content_type};base64,{image_base64}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"处理图片时发生错误: {str(e)}")

@router.post("/analyze-meal-text")
async def analyze_meal_text_endpoint(
    meal_text: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    分析餐食文本描述并返回营养信息
    """
    # 检查用户是否配置了API密钥
    if not current_user.gemini_api_key:
        raise HTTPException(status_code=400, detail="请先在设置页面配置 Gemini API 密钥")

    try:
        genai.configure(api_key=current_user.gemini_api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""
        请分析以下餐食描述，并以JSON格式返回营养信息：
        
        餐食描述：{meal_text}
        
        请返回以下格式的JSON：
        {{
            "title": "餐食名称",
            "nutrition": {{
                "calories": 估算热量（数字，单位kcal）,
                "protein": 估算蛋白质（数字，单位g）,
                "carbs": 估算碳水化合物（数字，单位g）,
                "fat": 估算脂肪（数字，单位g）
            }},
            "tags": ["相关标签"],
            "ingredients": ["识别出的食材"]
        }}
        
        请确保返回有效的JSON格式。
        """
        
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # 提取JSON
        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}') + 1
        
        if start_idx != -1 and end_idx != -1:
            json_str = response_text[start_idx:end_idx]
            result = json.loads(json_str)
            return {
                "success": True,
                "analysis": result
            }
        else:
            raise ValueError("无法从响应中提取有效的JSON")
            
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"JSON解析错误: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文本分析失败: {str(e)}")

@router.post("/generate-daily-summary")
async def generate_daily_summary_endpoint(
    date: str,
    meals: List[str],
    current_user: User = Depends(get_current_active_user),
    exercise: str = None,
    weight: float = None,
    water: float = None,
    sleep: float = None,
    db: Session = Depends(get_db)
):
    """
    生成每日AI智能小结
    """
    # 检查用户是否配置了API密钥
    if not current_user.gemini_api_key:
        raise HTTPException(status_code=400, detail="请先在设置页面配置 Gemini API 密钥")

    try:
        genai.configure(api_key=current_user.gemini_api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        meals_text = "\n".join([f"- {meal}" for meal in meals if meal])
        
        prompt = f"""
        请根据以下信息生成一份简洁的每日健康小结（100-150字）：
        
        日期：{date}
        三餐记录：
        {meals_text}
        
        运动情况：{exercise or '无记录'}
        体重：{weight or '无记录'}kg
        饮水：{water or '无记录'}L
        睡眠：{sleep or '无记录'}小时
        
        请从营养均衡、运动情况、生活习惯等角度给出简要评价和建议。
        """
        
        response = model.generate_content(prompt)
        
        return {
            "success": True,
            "summary": response.text.strip()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成小结失败: {str(e)}")
