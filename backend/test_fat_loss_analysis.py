#!/usr/bin/env python3
"""
测试脚本：验证fatLossAnalysis字段的处理逻辑
"""

import json
import sys
import os

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.gemini_service import GeminiService
from app.schemas import MealAnalysisData

def test_meal_analysis_validation():
    """测试餐食分析数据验证"""
    
    # 测试用例1：完整的分析数据
    complete_data = {
        "generatedMealName": "测试餐食",
        "estimatedCalories": 300,
        "estimatedProteinG": 20,
        "estimatedCarbsG": 30,
        "estimatedFatG": 10,
        "description": "测试描述",
        "tags": ["健康"],
        "identifiedIngredients": ["鸡肉"],
        "dominantColors": ["白色"],
        "cuisineStyle": "中式",
        "fatLossRating": 8,
        "fatLossAnalysis": "优点：高蛋白低脂肪。缺点：碳水化合物偏高。",
        "improvementTips": ["减少米饭分量"]
    }
    
    # 测试用例2：缺少fatLossAnalysis的数据
    incomplete_data = {
        "generatedMealName": "测试餐食",
        "estimatedCalories": 300,
        "estimatedProteinG": 20,
        "estimatedCarbsG": 30,
        "estimatedFatG": 10,
        "description": "测试描述",
        "tags": ["健康"],
        "identifiedIngredients": ["鸡肉"],
        "dominantColors": ["白色"],
        "cuisineStyle": "中式",
        "fatLossRating": 8,
        "fatLossAnalysis": "",  # 空字符串
        "improvementTips": ["减少米饭分量"]
    }
    
    # 测试用例3：完全缺少fatLossAnalysis字段
    missing_field_data = {
        "generatedMealName": "测试餐食",
        "estimatedCalories": 300,
        "estimatedProteinG": 20,
        "estimatedCarbsG": 30,
        "estimatedFatG": 10,
        "description": "测试描述",
        "tags": ["健康"],
        "identifiedIngredients": ["鸡肉"],
        "dominantColors": ["白色"],
        "cuisineStyle": "中式",
        "fatLossRating": 8,
        "improvementTips": ["减少米饭分量"]
        # 注意：没有fatLossAnalysis字段
    }
    
    print("🧪 开始测试餐食分析数据验证...")
    
    # 测试完整数据
    try:
        meal1 = MealAnalysisData(**complete_data)
        print(f"✅ 完整数据测试通过")
        print(f"   fatLossAnalysis: '{meal1.fatLossAnalysis}'")
    except Exception as e:
        print(f"❌ 完整数据测试失败: {e}")
    
    # 测试空字符串数据
    try:
        meal2 = MealAnalysisData(**incomplete_data)
        print(f"✅ 空字符串数据测试通过")
        print(f"   fatLossAnalysis: '{meal2.fatLossAnalysis}' (长度: {len(meal2.fatLossAnalysis)})")
    except Exception as e:
        print(f"❌ 空字符串数据测试失败: {e}")
    
    # 测试缺少字段数据
    try:
        meal3 = MealAnalysisData(**missing_field_data)
        print(f"✅ 缺少字段数据测试通过")
        print(f"   fatLossAnalysis: '{meal3.fatLossAnalysis}' (长度: {len(meal3.fatLossAnalysis)})")
    except Exception as e:
        print(f"❌ 缺少字段数据测试失败: {e}")

def simulate_ai_response_processing():
    """模拟AI响应处理过程"""
    
    print("\n🤖 模拟AI响应处理...")
    
    # 模拟AI返回的不完整响应
    incomplete_ai_response = {
        "generatedMealName": "西式家常",
        "estimatedCalories": 280,
        "estimatedProteinG": 18,
        "estimatedCarbsG": 25,
        "estimatedFatG": 9,
        "description": "包含一杯脱脂牛奶，一个水煮蛋，一片全麦吐司，以及凉拌的黄瓜和西红柿。",
        "tags": ["减脂", "高蛋白", "低脂", "早餐", "健康"],
        "identifiedIngredients": ["脱脂牛奶", "水煮蛋", "全麦吐司", "黄瓜", "西红柿"],
        "dominantColors": ["白色", "黄色", "绿色", "红色"],
        "cuisineStyle": "西式",
        "fatLossRating": 5,
        "fatLossAnalysis": "",  # AI没有返回内容
        "improvementTips": []
    }
    
    print(f"📥 模拟AI响应: {json.dumps(incomplete_ai_response, ensure_ascii=False, indent=2)}")
    
    # 应用我们的修复逻辑
    fat_loss_analysis = incomplete_ai_response.get('fatLossAnalysis', '')
    if not fat_loss_analysis or fat_loss_analysis.strip() == "":
        incomplete_ai_response['fatLossAnalysis'] = "优点：营养成分已识别，可为减脂计划提供参考。缺点：需要更详细的分析以提供精准建议。"
        print(f"🔧 已为空的fatLossAnalysis字段提供默认内容")
    
    # 创建MealAnalysisData对象
    try:
        meal_data = MealAnalysisData(**incomplete_ai_response)
        print(f"✅ 处理后的数据验证通过")
        print(f"   fatLossAnalysis: '{meal_data.fatLossAnalysis}'")
        print(f"   fatLossRating: {meal_data.fatLossRating}")
    except Exception as e:
        print(f"❌ 处理后的数据验证失败: {e}")

if __name__ == "__main__":
    test_meal_analysis_validation()
    simulate_ai_response_processing()
    print("\n🎉 测试完成！")
