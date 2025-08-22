import google.generativeai as genai
from typing import Dict, Any, List, Optional, AsyncGenerator
import json
import base64
from ..schemas import MealAnalysisData
from ..models import User, DailyLog


class GeminiService:
    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)

        # 系统指令 - 专业的减肥健身教练
        system_instruction = """你是一位专业的减肥健身教练和营养师。你的专业领域包括：

核心职责：
1. 减肥知识咨询：回答关于减重理论、方法、注意事项等问题
2. 健身指导：提供运动建议、训练计划、健身专业知识
3. 食物选择指导：分析食物营养价值，推荐适合减肥的食物
4. 图片分析：当用户上传食物图片时，识别食物类型，估算热量、蛋白质、碳水化合物、脂肪含量，并给出专业的营养评价和建议

回答原则：
- 所有回答必须使用中文
- 提供客观、科学、基于事实的专业建议
- 对食物图片进行详细分析，包括营养成分估算和健康建议
- 避免夸大效果，实事求是地提供指导
- 根据用户具体情况给出个性化建议

专业领域：营养学、运动科学、减肥理论、健康饮食、健身训练"""

        # Store system instruction for later use
        self.system_instruction = system_instruction
        self.model = genai.GenerativeModel('gemini-2.5-flash-lite')
    
    async def analyze_meal(
        self, 
        text_input: str, 
        image_data: Optional[bytes] = None,
        meal_type: str = ""
    ) -> MealAnalysisData:
        """Analyze meal from text and/or image input"""
        
        prompt = f"""你是一位专业的减脂营养师和健身教练，专注于为减脂人群提供科学的饮食评价和建议。请严格根据用户提供的餐食图片和/或文字描述，按照JSON schema返回分析结果。

分析上下文:
- 餐别: "{meal_type}"
- 用户文字描述: "{text_input or '无'}"

分析标准:
1. **主要依据**: 如果提供了图片，以图片内容为主要分析对象。文字描述仅作为补充。
2. **必须估算营养素**: 根据识别的食物类型和估算的分量，必须提供热量、蛋白质、碳水化合物和脂肪的数值估算。即使信息不完整，也要基于常见食物的营养成分给出合理估算。
3. **客观命名**: 生成一个简洁、客观的餐食名称来概括这顿饭，例如"烤鸡胸肉配西兰花"。
4. **结构化减脂分析**: 必须按照以下结构分析：
   - 优点：列出这顿饭对减脂有利的方面（如高蛋白、低热量、高纤维等）
   - 缺点：指出可能不利于减脂的问题（如高油脂、高热量、营养单一等）
   - 改进建议：提供具体的优化方案
5. **实用建议**: 提供具体的改进建议，包括烹饪方法优化、食材替换、份量控制等。

请返回JSON格式的分析结果，包含以下字段：
- generatedMealName: 餐食名称
- estimatedCalories: 估算热量（必须是数字，不能为null）
- estimatedProteinG: 估算蛋白质克数（必须是数字，不能为null）
- estimatedCarbsG: 估算碳水化合物克数（必须是数字，不能为null）
- estimatedFatG: 估算脂肪克数（必须是数字，不能为null）
- description: 详细描述（食物外观、成分等客观描述）
- tags: 标签数组（包含减脂相关标签）
- identifiedIngredients: 识别的食材数组
- dominantColors: 主要颜色数组
- cuisineStyle: 菜系风格
- fatLossRating: 减脂适宜度评分（1-10分，10分最适合）
- fatLossAdvantages: 减脂优点分析数组（每个优点作为数组中的一个字符串元素，简洁明确）
- fatLossDisadvantages: 减脂缺点分析数组（每个缺点作为数组中的一个字符串元素，简洁明确）
- improvementTips: 改进建议数组（具体的实用建议，每条建议简洁明确）

你的回答必须是严格的JSON对象，不包含任何解释或附加文本。
重要提醒：
1. 所有营养素字段必须是具体的数字，不能为null、空值或字符串。
2. fatLossAdvantages和fatLossDisadvantages字段是必需的，必须包含完整的专业分析内容，不能为空字符串。
3. improvementTips每条建议要具体可操作，避免泛泛而谈。
4. 如果无法提供完整分析，请基于常见食物特性给出合理的专业评价。"""

        try:
            # Prepare content for the model
            content = [prompt]
            
            if image_data:
                # Convert image bytes to base64 for Gemini
                image_b64 = base64.b64encode(image_data).decode()
                content.append({
                    "mime_type": "image/jpeg",
                    "data": image_b64
                })
            
            response = self.model.generate_content(content)

            if not response.text:
                raise Exception("Empty response from Gemini API")

            # Clean and parse JSON response
            response_text = response.text.strip()

            # Remove markdown code blocks if present
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```python'):
                response_text = response_text[:-3]

            response_text = response_text.strip()

            try:
                result = json.loads(response_text)
                print(f"🔍 AI返回的原始JSON数据: {result}")
                # 调试：检查营养素字段
                print(f"🔍 营养素字段检查:")
                print(f"  estimatedProteinG: {result.get('estimatedProteinG')} (类型: {type(result.get('estimatedProteinG'))})")
                print(f"  estimatedCarbsG: {result.get('estimatedCarbsG')} (类型: {type(result.get('estimatedCarbsG'))})")
                print(f"  estimatedFatG: {result.get('estimatedFatG')} (类型: {type(result.get('estimatedFatG'))})")

                # 调试：检查减脂分析字段
                print(f"🔍 减脂分析字段检查:")
                print(f"  fatLossRating: {result.get('fatLossRating')} (类型: {type(result.get('fatLossRating'))})")
                fat_loss_advantages = result.get('fatLossAdvantages', '')
                fat_loss_disadvantages = result.get('fatLossDisadvantages', '')
                print(f"  fatLossAdvantages: '{fat_loss_advantages}' (长度: {len(fat_loss_advantages)}, 类型: {type(fat_loss_advantages)})")
                print(f"  fatLossDisadvantages: '{fat_loss_disadvantages}' (长度: {len(fat_loss_disadvantages)}, 类型: {type(fat_loss_disadvantages)})")
                improvement_tips = result.get('improvementTips', [])
                print(f"  improvementTips: {improvement_tips} (长度: {len(improvement_tips)}, 类型: {type(improvement_tips)})")

                # 检查是否缺少关键的减脂分析内容
                # 处理 fatLossAdvantages（可能是字符串或列表）
                if isinstance(fat_loss_advantages, str):
                    if not fat_loss_advantages or len(fat_loss_advantages.strip()) < 5:
                        print(f"⚠️ 警告：fatLossAdvantages字段内容不足，提供默认内容")
                        result['fatLossAdvantages'] = ["营养成分已识别，可为减脂计划提供参考。"]
                    else:
                        result['fatLossAdvantages'] = [fat_loss_advantages]
                elif isinstance(fat_loss_advantages, list):
                    if not fat_loss_advantages or (len(fat_loss_advantages) == 1 and len(fat_loss_advantages[0].strip()) < 5):
                        print(f"⚠️ 警告：fatLossAdvantages字段内容不足，提供默认内容")
                        result['fatLossAdvantages'] = ["营养成分已识别，可为减脂计划提供参考。"]
                else:
                    result['fatLossAdvantages'] = ["营养成分已识别，可为减脂计划提供参考。"]

                # 处理 fatLossDisadvantages（可能是字符串或列表）
                if isinstance(fat_loss_disadvantages, str):
                    if not fat_loss_disadvantages or len(fat_loss_disadvantages.strip()) < 5:
                        print(f"⚠️ 警告：fatLossDisadvantages字段内容不足，提供默认内容")
                        result['fatLossDisadvantages'] = ["需要更详细的分析以提供精准建议。"]
                    else:
                        result['fatLossDisadvantages'] = [fat_loss_disadvantages]
                elif isinstance(fat_loss_disadvantages, list):
                    if not fat_loss_disadvantages or (len(fat_loss_disadvantages) == 1 and len(fat_loss_disadvantages[0].strip()) < 5):
                        print(f"⚠️ 警告：fatLossDisadvantages字段内容不足，提供默认内容")
                        result['fatLossDisadvantages'] = ["需要更详细的分析以提供精准建议。"]
                else:
                    result['fatLossDisadvantages'] = ["需要更详细的分析以提供精准建议。"]

            except json.JSONDecodeError as e:
                print(f"JSON decode error: {e}")
                print(f"Response text: {response_text}")
                raise Exception(f"Invalid JSON response from AI: {str(e)}")

            # 最终验证关键字段
            meal_data = MealAnalysisData(**result)
            print(f"✅ 减脂分析数据验证通过")

            return meal_data
            
        except Exception as e:
            raise Exception(f"Failed to analyze meal: {str(e)}")
    
    async def analyze_full_day(self, daily_log: DailyLog) -> Dict[str, Any]:
        """Analyze full day nutrition and generate summary"""
        
        # Prepare log data for analysis
        log_data = {
            "date": str(daily_log.date),
            "weight_kg": float(daily_log.weight_kg) if daily_log.weight_kg else None,
            "waist_cm": float(daily_log.waist_cm) if daily_log.waist_cm else None,
            "water_l": float(daily_log.water_l) if daily_log.water_l else None,
            "sleep_h": float(daily_log.sleep_h) if daily_log.sleep_h else None,
            "activity": daily_log.activity,
            "meals": []
        }
        
        # Add meal data
        for meal in daily_log.meal_logs:
            meal_data = {
                "type": meal.meal_type,
                "text": meal.text,
                "analysis": meal.analysis_data
            }
            log_data["meals"].append(meal_data)
        
        prompt = f"""作为专业营养师，分析以下单日记录并返回JSON格式结果。

数据:
{json.dumps(log_data, ensure_ascii=False, indent=2)}

任务:
1. 分析所有餐食，估算总摄入营养
2. 分析运动记录，估算消耗热量
3. 生成简洁的中文健康评价

必须返回严格的JSON格式，示例:
{{
  "estimatedIntakeCalories": 1800,
  "estimatedIntakeProteinG": 120,
  "estimatedIntakeCarbsG": 200,
  "estimatedIntakeFatG": 60,
  "estimatedExpenditureCalories": 300,
  "dailySummary": "营养摄入基本均衡，建议增加蛋白质摄入。"
}}

只返回JSON，不要任何其他文字。"""

        try:
            response = self.model.generate_content(prompt)

            if not response or not response.text:
                print("Empty response from Gemini API")
                return {
                    "estimatedIntakeCalories": 0,
                    "estimatedIntakeProteinG": 0,
                    "estimatedIntakeCarbsG": 0,
                    "estimatedIntakeFatG": 0,
                    "estimatedExpenditureCalories": 0,
                    "dailySummary": "AI分析暂时不可用，请稍后重试"
                }

            print(f"Gemini response: {response.text[:500]}...")  # Log first 500 chars for debugging

            # Try to clean the response text
            response_text = response.text.strip()

            # Remove any markdown code blocks if present
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```python'):
                response_text = response_text[:-3]
            response_text = response_text.strip()

            result = json.loads(response_text)
            return result

        except json.JSONDecodeError as e:
            print(f"JSON decode error: {str(e)}")
            print(f"Response text: {response.text if response else 'No response'}")
            return {
                "estimatedIntakeCalories": 0,
                "estimatedIntakeProteinG": 0,
                "estimatedIntakeCarbsG": 0,
                "estimatedIntakeFatG": 0,
                "estimatedExpenditureCalories": 0,
                "dailySummary": "AI分析格式错误，请稍后重试"
            }
        except Exception as e:
            print(f"General error in analyze_full_day: {str(e)}")
            return {
                "estimatedIntakeCalories": 0,
                "estimatedIntakeProteinG": 0,
                "estimatedIntakeCarbsG": 0,
                "estimatedIntakeFatG": 0,
                "estimatedExpenditureCalories": 0,
                "dailySummary": "AI分析遇到错误，请稍后重试"
            }
    
    async def generate_analysis_report(
        self, 
        user: User, 
        daily_logs: List[DailyLog]
    ) -> Dict[str, Any]:
        """Generate comprehensive analysis report"""
        
        # Prepare user and logs data
        user_data = {
            "age": user.age,
            "gender": user.gender,
            "height": float(user.height) if user.height else None,
            "initial_weight": float(user.initial_weight) if user.initial_weight else None,
            "activity_level": user.activity_level
        }
        
        logs_data = []
        for log in daily_logs:
            # Prepare meal data
            meals_data = {}
            for meal_log in log.meal_logs:
                meal_info = {
                    "text": meal_log.text,
                    "analysis_data": meal_log.analysis_data
                }
                meals_data[meal_log.meal_type] = meal_info

            log_data = {
                "date": str(log.date),
                "weight_kg": float(log.weight_kg) if log.weight_kg else None,
                "waist_cm": float(log.waist_cm) if log.waist_cm else None,
                "water_l": float(log.water_l) if log.water_l else None,
                "sleep_h": float(log.sleep_h) if log.sleep_h else None,
                "bmr": float(log.bmr) if log.bmr else None,
                "tdee": float(log.tdee) if log.tdee else None,
                "actual_intake": float(log.actual_intake) if log.actual_intake else None,
                "estimated_expenditure": float(log.estimated_expenditure) if log.estimated_expenditure else None,
                "protein_g": float(log.protein_g) if log.protein_g else None,
                "carbs_g": float(log.carbs_g) if log.carbs_g else None,
                "fat_g": float(log.fat_g) if log.fat_g else None,
                "calorie_deficit": float(log.calorie_deficit) if log.calorie_deficit else None,
                "activity": log.activity,
                "summary": log.summary,
                "meals": meals_data
            }
            logs_data.append(log_data)
        
        prompt = f"""你是一位严格、专业的健身教练和营养专家，以客观、数据驱动和深度分析著称。
你的任务是分析以下用户的个人资料和最近的每日记录，并严格按照JSON schema返回一份全面、专业且充满洞察的中文分析报告。
你的分析必须是真实、直接、一针见血的。避免空洞的鼓励，专注于提供可执行的建议和深刻的见解。

**用户个人资料:** {json.dumps(user_data, ensure_ascii=False, indent=2)}

**用户每日记录:** {json.dumps(logs_data, ensure_ascii=False, indent=2)}

**核心分析指令:**
1. **数据为王**: 所有指标（得分、平均值、趋势）必须严格基于所提供的数据进行计算。
2. **全面分析**: 利用所有可用的数据字段，包括体重、腰围、饮水、睡眠、运动消耗、饮食详情和宏量营养素。
3. **完整时间范围**: 必须分析所有提供的日志记录，从最早日期到最新日期的完整时间段。
4. **精准计算**: 确保 totalWaistReduction, avgActivityExpenditure, avgWaterL, 和 macroDistribution 等指标计算准确无误。
5. **体重计算规则**: totalWeightLoss = 用户资料中的initial_weight - 日志记录中最新的weight_kg。必须使用这个精确公式。
6. **腰围计算规则**: totalWaistReduction = 最早的waist_cm记录 - 最新的waist_cm记录。
7. **周均减重计算**: avgWeeklyLoss = totalWeightLoss ÷ 总周数，必须基于实际时间跨度计算。
8. **平均值计算**: 所有平均值（睡眠、饮水、运动消耗等）必须基于有效记录数量计算，不能使用总天数。
9. **每周摘要计算规则**:
   - 将所有日志按日期排序，按周分组（每7天为一周）
   - week字段格式必须为 'YYYY-MM-DD ~ YYYY-MM-DD'（该周的开始日期到结束日期）
   - avgWeight为该周所有体重记录的平均值
   - weightChange为该周内的体重变化：该周最后一天的体重 - 该周第一天的体重（负数表示减重，正数表示增重）
   - 如果某周只有一天记录，weightChange为0
10. **数据一致性**: 确保每周体重变化的总和等于总减重量，所有计算结果必须逻辑一致。
4. **专业评论**: 基于计算出的数据，提供关于饮水、睡眠、宏量营养素分配的专业、科学的评论。
5. **深度洞察**:
   a. **个性化运动处方 (exercisePrescription)**: 基于用户的减重趋势和现有活动水平，设计一个具体的、个性化的运动计划。如果用户已有运动习惯，提出优化建议；如果缺乏运动，提供一个可行的起点。
   b. **为你推荐的超级食物 (recommendedSuperfoods)**: 根据用户的饮食记录，识别其可能缺乏的营养素或可以优化的方面，推荐3-5种具体的"超级食物"，并说明理由（例如，增加饱腹感、提供关键微量元素、富含蛋白质等）。
   c. **潜在风险与关注点 (potentialRisks)**: 识别数据中可能预示问题的模式。例如：睡眠时长与体重停滞是否相关？热量缺口是否过大或过小？是否存在饮食种类过于单一的情况？提出1-3个最需要用户警惕的风险点。
   d. **周度回顾与展望 (weeklyOutlook)**: 用一段激励人心但又切合实际的话，总结最近一周的核心表现，并为下一周设定一个明确的焦点或小目标。
6. **直言不讳**: 'achievements' 和 'actionableTips' 必须具体、可操作，直指核心问题和成就。

请生成一份包含以下完整结构的JSON格式报告：
{{
  "progressScore": 数字(0-100),
  "keyMetrics": {{
    "totalWeightLoss": 数字 (必须使用: initial_weight - 最新weight_kg),
    "totalWaistReduction": 数字 (必须使用: 最早waist_cm - 最新waist_cm),
    "avgWeeklyLoss": 数字 (必须使用: totalWeightLoss ÷ 实际周数),
    "avgCalorieDeficit": 数字 (基于有效记录的平均值),
    "avgActivityExpenditure": 数字 (基于有效记录的平均值)
  }},
  "consistency": {{
    "logStreak": 数字,
    "consistencyPercentage": 数字
  }},
  "weeklySummary": [
    {{
      "week": "字符串 (格式: 'YYYY-MM-DD ~ YYYY-MM-DD', 例如 '2024-01-01 ~ 2024-01-07')",
      "avgWeight": 数字 (该周所有体重记录的平均值),
      "weightChange": 数字 (该周内的体重变化：该周最后一天体重 - 该周第一天体重，负数表示减重，正数表示增重)
    }}
  ],
  "sleepAnalysis": {{
    "avgHours": 数字 (基于有睡眠记录的天数计算平均值),
    "correlationComment": "字符串"
  }},
  "hydrationAnalysis": {{
    "avgWaterL": 数字 (基于有饮水记录的天数计算平均值),
    "comment": "字符串"
  }},
  "nutritionInsights": {{
    "overall": "字符串",
    "positive": "字符串",
    "improvement": "字符串",
    "macroDistribution": {{
      "proteinPercentage": 数字,
      "carbsPercentage": 数字,
      "fatPercentage": 数字,
      "comment": "字符串"
    }}
  }},
  "achievements": ["字符串数组"],
  "actionableTips": ["字符串数组"],
  "recommendedSuperfoods": [
    {{
      "food": "字符串",
      "reason": "字符串"
    }}
  ],
  "exercisePrescription": {{
    "recommendation": "字符串",
    "details": ["字符串数组"]
  }},
  "potentialRisks": ["字符串数组"],
  "weeklyOutlook": "字符串"
}}

请确保你的整个回答都严格遵循JSON格式，并且所有文本都使用简体中文。"""

        try:
            print(f"Generating analysis report for user {user.id}")
            print(f"User data: {user_data}")
            print(f"Number of logs: {len(logs_data)}")

            # Debug weight data to understand the calculation issue
            weight_records = [(log['date'], log['weight_kg']) for log in logs_data if log['weight_kg'] is not None]
            print(f"DEBUG - Weight records: {weight_records}")
            if weight_records:
                initial_weight = user_data.get('initial_weight')
                latest_weight = weight_records[-1][1] if weight_records else None
                print(f"DEBUG - Initial weight: {initial_weight}, Latest weight: {latest_weight}")
                if initial_weight and latest_weight:
                    calculated_loss = initial_weight - latest_weight
                    print(f"DEBUG - Expected weight loss: {calculated_loss}kg")

                    # Add explicit calculation instruction to the prompt
                    first_date = weight_records[0][0]
                    last_date = weight_records[-1][0]

                    # Calculate waist reduction
                    waist_records = [(log['date'], log['waist_cm']) for log in logs_data if log['waist_cm'] is not None]
                    waist_calculation = ""
                    if waist_records:
                        initial_waist = waist_records[0][1]
                        latest_waist = waist_records[-1][1]
                        waist_reduction = initial_waist - latest_waist
                        waist_calculation = f"""
- 初始腰围：{initial_waist}cm
- 最新腰围：{latest_waist}cm
- totalWaistReduction 必须等于：{waist_reduction}cm"""

                    # Calculate time span and weekly average
                    from datetime import datetime
                    start_date = datetime.strptime(first_date, '%Y-%m-%d')
                    end_date = datetime.strptime(last_date, '%Y-%m-%d')
                    days_span = (end_date - start_date).days + 1
                    weeks_span = days_span / 7
                    avg_weekly_loss = calculated_loss / weeks_span if weeks_span > 0 else 0

                    weight_calculation_instruction = f"""

**重要计算提醒**：
根据提供的完整数据（{first_date} 到 {last_date}，共{len(weight_records)}天记录，{days_span}天，{weeks_span:.2f}周）：
- 用户初始体重：{initial_weight}kg
- 最新体重记录（{last_date}）：{latest_weight}kg
- totalWeightLoss 必须等于：{calculated_loss}kg
- avgWeeklyLoss 必须等于：{avg_weekly_loss:.2f}kg（总减重÷总周数）{waist_calculation}

**weeklySummary计算示例**：
- 将数据按周分组，每周7天
- week字段格式：'2025-08-01 ~ 2025-08-07'
- avgWeight：该周所有体重记录的平均值
- weightChange：该周内体重变化 = 该周最后一天体重 - 该周第一天体重
- 例如：第一周(8月1-7日)，如果第一天112.35kg，最后一天107.0kg，则weightChange = 107.0 - 112.35 = -5.35kg
- 必须分析整个时间段的所有数据，不要只分析部分周期
请严格使用这些计算结果，确保数据一致性。
"""
                    prompt += weight_calculation_instruction

            response = self.model.generate_content(prompt)

            if not response or not response.text:
                print("Empty response from Gemini API")
                raise Exception("Empty response from Gemini API")

            print(f"Gemini response length: {len(response.text)}")
            print(f"Gemini response preview: {response.text[:500]}...")

            # Clean the response text
            response_text = response.text.strip()

            # Remove any markdown code blocks if present
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            response_text = response_text.strip()

            print(f"Cleaned response preview: {response_text[:500]}...")

            result = json.loads(response_text)
            print("Successfully parsed JSON response")
            return result

        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print(f"Response text length: {len(response.text) if 'response' in locals() else 0}")
            print(f"Response text: {response.text if 'response' in locals() else 'No response'}")

            # Try to fix incomplete JSON by adding missing closing braces
            if 'response' in locals() and response and response.text:
                try:
                    # Count opening and closing braces
                    open_braces = response.text.count('{')
                    close_braces = response.text.count('}')
                    missing_braces = open_braces - close_braces

                    if missing_braces > 0:
                        print(f"Attempting to fix incomplete JSON by adding {missing_braces} closing braces")
                        fixed_text = response_text + '}' * missing_braces
                        result = json.loads(fixed_text)
                        print("Successfully parsed fixed JSON response")
                        return result
                except Exception as fix_error:
                    print(f"Failed to fix incomplete JSON: {fix_error}")

            raise Exception(f"Failed to parse JSON response: {str(e)}")
        except Exception as e:
            print(f"Analysis report generation error: {e}")
            raise Exception(f"Failed to generate analysis report: {str(e)}")
    
    async def chat_stream(
        self,
        message: str,
        image_data: Optional[bytes] = None,
        chat_history: List[Dict[str, str]] = None
    ) -> AsyncGenerator[str, None]:
        """Stream chat response"""

        try:
            # Prepare chat history with system instruction
            full_history = []

            # Always add system instruction to ensure proper role and Chinese responses
            if not chat_history:
                full_history = [
                    {"role": "user", "parts": [{"text": """你是一位专业的减脂教练和营养师。当用户询问任何食物或上传食物图片时，你必须提供详细的专业分析，格式如下：

**食物分析格式要求：**

1. **食物识别**：准确识别食物类型和估算重量
2. **营养成分分析**（每100克，数据会因品牌而异，仅供参考）：
   - 热量：约XXX千卡
   - 蛋白质：约X克
   - 碳水化合物：约XX克
   - 脂肪：约X.X克
   - 纤维：约X克（如适用）

3. **总计营养估算**（基于估算重量）：
   - 估算重量：约XXX克
   - 总热量：约XXX千卡（总计约XXX克）

4. **是否适合减脂期食用**：明确说明适合程度，但需控制摄入量

5. **推荐的烹饪方法和食用建议**：提供具体的低油低盐烹饪方式

6. **在减脂计划中的作用和注意事项**：说明如何合理搭配和控制份量

对于图片分析，要仔细观察食物的种类、颜色、大小，估算重量和营养成分。所有回答用中文，要专业详细，数据要尽可能准确。"""}]},
                    {"role": "model", "parts": [{"text": "明白！我是您的专业减脂教练和营养师。我会按照标准格式详细分析每种食物，包括准确的营养成分数据、重量估算、总热量计算，以及专业的减脂建议。我会提供科学、实用、数据化的减脂指导。"}]}
                ]
            else:
                # Always prepend role reminder to existing history
                full_history = [
                    {"role": "user", "parts": [{"text": "请记住：按照标准格式详细分析食物，包括营养成分、重量估算、总热量计算和减脂建议。"}]},
                    {"role": "model", "parts": [{"text": "明白，我会按照标准格式提供详细的食物营养分析和减脂建议。"}]}
                ] + chat_history

            # Create chat with history
            chat = self.model.start_chat(history=full_history)

            # Prepare content for the model with Chinese instruction
            if image_data:
                # If there's an image, use multipart content
                import PIL.Image
                import io

                # Convert bytes to PIL Image
                image = PIL.Image.open(io.BytesIO(image_data))
                # Add detailed Chinese instruction for image analysis
                if message:
                    enhanced_message = f"""请用中文详细分析这张食物图片，并回答用户问题：{message}

请按照以下格式提供分析：
1. 识别图片中的所有食物，估算每种食物的重量
2. 提供详细的营养成分分析（每100克和总计）
3. 计算总热量和各营养素含量
4. 从减脂角度评价这份餐食
5. 给出具体的食用建议和注意事项"""
                else:
                    enhanced_message = """请用中文详细分析这张食物图片：

请按照以下格式提供分析：
1. **食物识别**：识别图片中的所有食物类型，估算重量
2. **营养成分分析**：
   - 每100克营养成分（热量、蛋白质、碳水化合物、脂肪、纤维等）
   - 基于估算重量的总计营养成分
3. **总热量计算**：详细计算这份餐食的总热量
4. **减脂适用性**：评价是否适合减脂期食用
5. **食用建议**：提供具体的烹饪方法和搭配建议
6. **注意事项**：在减脂计划中的作用和控制要点

请提供准确的数据和专业的分析。"""
                content_parts = [enhanced_message, image]
                response = chat.send_message(content_parts, stream=True)
            else:
                # If only text, add Chinese instruction
                enhanced_message = f"请用中文详细回答：{message}"
                response = chat.send_message(enhanced_message, stream=True)

            for chunk in response:
                if chunk.text:
                    yield chunk.text

        except Exception as e:
            yield f"抱歉，我遇到了一个错误: {str(e)}"

    async def generate_daily_summary(self, analysis_text: str) -> str:
        """生成每日健康小结"""
        try:
            prompt = f"""作为专业的减肥健身教练和营养师，请基于以下全天饮食和运动数据生成一个简洁的健康评价和建议：

{analysis_text}

请按照以下要求生成评价：
1. 客观分析营养摄入是否均衡（蛋白质、碳水、脂肪比例）
2. 评价热量缺口是否合理（建议500-1000卡缺口）
3. 给出具体的改进建议（饮食调整、运动建议等）
4. 总字数控制在100字以内
5. 语气专业但友好，鼓励用户坚持
6. 直接返回文本内容，不需要JSON格式

请生成评价和建议："""

            response = self.model.generate_content(prompt)
            return response.text.strip() if response.text else "AI分析暂时不可用，请稍后重试"

        except Exception as e:
            print(f"Daily summary generation error: {e}")
            return "AI分析暂时不可用，请检查网络连接或稍后重试"




def get_gemini_service(api_key: str) -> GeminiService:
    """Get Gemini service instance"""
    if not api_key:
        raise ValueError("Gemini API key is required")

    return GeminiService(api_key)


# 添加必要的导入
from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth import get_current_active_user
from ..models import User, DailyLog, MealLog


router = APIRouter(prefix="/meals", tags=["meals"])


@router.post("/analyze-smart-input")
async def analyze_smart_input(
    text: str = Form(...),
    meal_type: str = Form(...),
    date: str = Form(...),
    image: UploadFile = File(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """智能输入分析端点"""
    from datetime import datetime
    import os
    import time
    from ..models import MealLog

    if not current_user.gemini_api_key:
        raise HTTPException(status_code=400, detail="API_KEY_MISSING")

    try:
        gemini_service = get_gemini_service(current_user.gemini_api_key)

        # 处理图片
        image_data = None
        image_path = None
        if image:
            # 保存图片
            upload_dir = f"uploads/meals/{datetime.now().year}/{datetime.now().month:02d}"
            os.makedirs(upload_dir, exist_ok=True)

            timestamp = int(time.time())
            filename = f"user_{current_user.id}_meals_{timestamp}.jpg"
            image_path = os.path.join(upload_dir, filename)

            with open(image_path, "wb") as buffer:
                content = await image.read()
                buffer.write(content)
                image_data = content

        # 分析餐食
        meal_analysis = await gemini_service.analyze_meal(
            text_input=text,
            image_data=image_data,
            meal_type=meal_type
        )

        # 获取或创建当日记录
        log_date = datetime.strptime(date, "%Y-%m-%d").date()
        daily_log = db.query(DailyLog).filter(
            DailyLog.user_id == current_user.id,
            DailyLog.date == log_date
        ).first()

        if not daily_log:
            daily_log = DailyLog(
                user_id=current_user.id,
                date=log_date,
                weight_kg=None,
                water_intake_ml=0,
                exercise_notes="",
                mood_rating=5,
                energy_level=5,
                sleep_hours=8.0,
                notes=""
            )
            db.add(daily_log)
            db.flush()

        # 创建餐食记录
        meal_log = MealLog(
            daily_log_id=daily_log.id,
            meal_type=meal_type,
            text=text,
            image_path=image_path,
            analysis_data={
                "generatedMealName": getattr(meal_analysis, 'generatedMealName', ''),
                "totalCalories": getattr(meal_analysis, 'totalCalories', 0),
                "protein": getattr(meal_analysis, 'protein', 0),
                "carbs": getattr(meal_analysis, 'carbs', 0),
                "fat": getattr(meal_analysis, 'fat', 0),
                "fiber": getattr(meal_analysis, 'fiber', 0),
                "sugar": getattr(meal_analysis, 'sugar', 0),
                "sodium": getattr(meal_analysis, 'sodium', 0),
                "fatLossRating": getattr(meal_analysis, 'fatLossRating', 5),
                "fatLossAdvantages": getattr(meal_analysis, 'fatLossAdvantages', []),
                "fatLossDisadvantages": getattr(meal_analysis, 'fatLossDisadvantages', []),
                "improvementTips": getattr(meal_analysis, 'improvementTips', [])
            }
        )

        db.add(meal_log)
        db.commit()

        return {
            "success": True,
            "meal_id": meal_log.id,
            "analysis": meal_log.analysis_data
        }

    except Exception as e:
        db.rollback()
        print(f"智能输入分析错误: {e}")
        raise HTTPException(status_code=500, detail=f"分析失败: {str(e)}")


@router.post("/reanalyze/{meal_id}")
async def reanalyze_meal(
    meal_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """重新分析餐食"""
    if not current_user.gemini_api_key:
        raise HTTPException(status_code=400, detail="API_KEY_MISSING")

    # 查找餐食记录
    meal_log = db.query(MealLog).join(DailyLog).filter(
        MealLog.id == meal_id,
        DailyLog.user_id == current_user.id
    ).first()

    if not meal_log:
        raise HTTPException(status_code=404, detail="餐食记录不存在")

    try:
        gemini_service = get_gemini_service(current_user.gemini_api_key)

        # 准备图片数据
        image_data = None
        if meal_log.image_path:
            try:
                with open(meal_log.image_path, 'rb') as f:
                    image_data = f.read()
            except Exception as e:
                print(f"无法读取图片文件 {meal_log.image_path}: {e}")

        # 重新分析餐食
        meal_analysis = await gemini_service.analyze_meal(
            text_input=meal_log.text or "",
            image_data=image_data,
            meal_type=meal_log.meal_type
        )

        # 调试：打印AI分析结果
        print(f"重新分析餐食 {meal_id} 的结果:")
        print(f"  餐食名称: {meal_analysis.generatedMealName}")
        print(f"  热量: {meal_analysis.estimatedCalories}")
        print(f"  蛋白质: {meal_analysis.estimatedProteinG} (类型: {type(meal_analysis.estimatedProteinG)})")
        print(f"  碳水: {meal_analysis.estimatedCarbsG} (类型: {type(meal_analysis.estimatedCarbsG)})")
        print(f"  脂肪: {meal_analysis.estimatedFatG} (类型: {type(meal_analysis.estimatedFatG)})")

        # 更新餐食分析数据
        meal_log.analysis_data = {
            "generatedMealName": meal_analysis.generatedMealName,
            "estimatedCalories": int(meal_analysis.estimatedCalories),
            "estimatedProteinG": float(meal_analysis.estimatedProteinG or 0),
            "estimatedCarbsG": float(meal_analysis.estimatedCarbsG or 0),
            "estimatedFatG": float(meal_analysis.estimatedFatG or 0),
            "description": meal_analysis.description,
            "tags": meal_analysis.tags or [],
            "identifiedIngredients": meal_analysis.identifiedIngredients or [],
            "dominantColors": meal_analysis.dominantColors or [],
            "cuisineStyle": meal_analysis.cuisineStyle or "",
            "fatLossRating": getattr(meal_analysis, 'fatLossRating', 5),
            "fatLossAdvantages": getattr(meal_analysis, 'fatLossAdvantages', []),
            "fatLossDisadvantages": getattr(meal_analysis, 'fatLossDisadvantages', []),
            "improvementTips": getattr(meal_analysis, 'improvementTips', [])
        }
        print(f"🔍 AI分析结果:")
        print(f"  fatLossAdvantages: '{getattr(meal_analysis, 'fatLossAdvantages', '')}' (长度: {len(getattr(meal_analysis, 'fatLossAdvantages', ''))})")
        print(f"  fatLossDisadvantages: '{getattr(meal_analysis, 'fatLossDisadvantages', '')}' (长度: {len(getattr(meal_analysis, 'fatLossDisadvantages', ''))})")
        print(f"💾 保存到数据库的数据: {meal_log.analysis_data}")

        db.commit()

        return {
            "success": True,
            "message": "餐食重新分析完成",
            "analysis": meal_log.analysis_data
        }

    except Exception as e:
        print(f"重新分析餐食失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"重新分析失败: {str(e)}")


@router.post("/analyze-full-day/{log_id}")
async def analyze_full_day_nutrition(
    log_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    分析全天营养数据并生成小结
    """
    daily_log = db.query(DailyLog).filter(
        DailyLog.id == log_id,
        DailyLog.user_id == current_user.id
    ).first()

    if not daily_log:
        raise HTTPException(status_code=404, detail="记录不存在")

    if not current_user.gemini_api_key:
        raise HTTPException(status_code=400, detail="API_KEY_MISSING")

    try:
        gemini_service = get_gemini_service(current_user.gemini_api_key)

        # 计算BMR和TDEE
        from decimal import Decimal

        weight = float(daily_log.weight_kg) if daily_log.weight_kg else (float(current_user.initial_weight) if current_user.initial_weight else 70)
        height = float(current_user.height) if current_user.height else 170

        bmr = calculate_bmr(
            weight=weight,
            height=height,
            age=current_user.age or 25,
            gender=current_user.gender or "male"
        )

        activity_multiplier = get_activity_multiplier(current_user.activity_level or "moderate")
        estimated_expenditure = float(daily_log.estimated_expenditure) if daily_log.estimated_expenditure else 0
        actual_intake = float(daily_log.actual_intake) if daily_log.actual_intake else 0

        tdee = bmr * activity_multiplier + estimated_expenditure
        calorie_deficit = tdee - actual_intake

        # 首先检查并分析缺失营养数据的餐食记录
        all_meals = db.query(MealLog).filter(MealLog.daily_log_id == daily_log.id).all()

        for meal in all_meals:
            # 如果餐食记录缺失营养分析数据，进行分析
            if not meal.analysis_data or not meal.analysis_data.get("estimatedCalories"):
                if meal.text:  # 只有有文本描述的才能分析
                    try:
                        print(f"正在分析餐食: {meal.text}")
                        # 分析单个餐食
                        meal_analysis = await gemini_service.analyze_meal(
                            text_input=meal.text,
                            image_data=None,  # 这里暂时不处理图片，因为图片路径需要读取文件
                            meal_type=meal.meal_type
                        )

                        # 更新餐食分析数据
                        meal.analysis_data = {
                            "generatedMealName": meal_analysis.generatedMealName,
                            "estimatedCalories": int(meal_analysis.estimatedCalories),
                            "estimatedProteinG": float(meal_analysis.estimatedProteinG or 0),
                            "estimatedCarbsG": float(meal_analysis.estimatedCarbsG or 0),
                            "estimatedFatG": float(meal_analysis.estimatedFatG or 0),
                            "description": meal_analysis.description,
                            "tags": meal_analysis.tags or [],
                            "identifiedIngredients": meal_analysis.identifiedIngredients or [],
                            "dominantColors": meal_analysis.dominantColors or [],
                            "cuisineStyle": meal_analysis.cuisineStyle or "",
                            "fatLossRating": getattr(meal_analysis, 'fatLossRating', 5),
                            "fatLossAdvantages": getattr(meal_analysis, 'fatLossAdvantages', []),
                            "fatLossDisadvantages": getattr(meal_analysis, 'fatLossDisadvantages', []),
                            "improvementTips": getattr(meal_analysis, 'improvementTips', [])
                        }
                        print(f"餐食分析完成: {meal_analysis.generatedMealName}, {meal_analysis.estimatedCalories} kcal")
                    except Exception as e:
                        print(f"餐食分析失败: {str(e)}")
                        # 如果分析失败，设置默认值
                        meal.analysis_data = {
                            "generatedMealName": meal.text[:20] + "..." if len(meal.text) > 20 else meal.text,
                            "estimatedCalories": 0,
                            "estimatedProteinG": 0,
                            "estimatedCarbsG": 0,
                            "estimatedFatG": 0,
                            "description": "分析失败",
                            "tags": [],
                            "identifiedIngredients": [],
                            "dominantColors": [],
                            "cuisineStyle": ""
                        }

        # 提交餐食分析数据的更新
        db.commit()

        # 调用AI分析全天营养数据
        analysis_result = await gemini_service.analyze_full_day(daily_log)

        # 重新计算当日总营养数据（基于更新后的餐食记录）
        total_calories = sum(meal.analysis_data.get("estimatedCalories", 0) for meal in all_meals if meal.analysis_data)
        total_protein = sum(meal.analysis_data.get("estimatedProteinG", 0) for meal in all_meals if meal.analysis_data)
        total_carbs = sum(meal.analysis_data.get("estimatedCarbsG", 0) for meal in all_meals if meal.analysis_data)
        total_fat = sum(meal.analysis_data.get("estimatedFatG", 0) for meal in all_meals if meal.analysis_data)

        # 更新记录（使用餐食累加值，而不是AI重新估算的值）
        daily_log.summary = analysis_result.get("dailySummary", "AI分析暂时不可用")
        daily_log.actual_intake = Decimal(str(total_calories))
        daily_log.protein_g = Decimal(str(total_protein))
        daily_log.carbs_g = Decimal(str(total_carbs))
        daily_log.fat_g = Decimal(str(total_fat))
        daily_log.estimated_expenditure = Decimal(str(analysis_result.get("estimatedExpenditureCalories", 0)))
        daily_log.bmr = Decimal(str(bmr))
        daily_log.tdee = Decimal(str(tdee))

        # 重新计算热量缺口，使用餐食累加的摄入量
        calorie_deficit = tdee - total_calories
        daily_log.calorie_deficit = Decimal(str(calorie_deficit))

        db.commit()
        db.refresh(daily_log)

        return {
            "success": True,
            "analysis": {
                "summary": daily_log.summary,
                "bmr": bmr,
                "tdee": tdee,
                "calorie_deficit": calorie_deficit,
                "estimatedIntakeCalories": float(daily_log.actual_intake) if daily_log.actual_intake else 0,
                "estimatedIntakeProteinG": float(daily_log.protein_g) if daily_log.protein_g else 0,
                "estimatedIntakeCarbsG": float(daily_log.carbs_g) if daily_log.carbs_g else 0,
                "estimatedIntakeFatG": float(daily_log.fat_g) if daily_log.fat_g else 0,
                "estimatedExpenditureCalories": float(daily_log.estimated_expenditure) if daily_log.estimated_expenditure else 0
            },
            "daily_log": {
                "id": daily_log.id,
                "summary": daily_log.summary,
                "bmr": daily_log.bmr,
                "tdee": daily_log.tdee,
                "calorie_deficit": daily_log.calorie_deficit,
                "actual_intake": daily_log.actual_intake,
                "protein_g": daily_log.protein_g,
                "carbs_g": daily_log.carbs_g,
                "fat_g": daily_log.fat_g,
                "estimated_expenditure": daily_log.estimated_expenditure
            }
        }

    except Exception as e:
        print(f"Full day analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch-analyze-v2")
async def batch_analyze_logs_v2(
    log_ids: list[int],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    批量分析多个日志记录
    """
    if not current_user.gemini_api_key:
        raise HTTPException(status_code=400, detail="API_KEY_MISSING")

    results = []

    for log_id in log_ids:
        try:
            daily_log = db.query(DailyLog).filter(
                DailyLog.id == log_id,
                DailyLog.user_id == current_user.id
            ).first()

            if not daily_log:
                results.append({"log_id": log_id, "success": False, "error": "记录不存在"})
                continue

            gemini_service = get_gemini_service(current_user.gemini_api_key)

            # 计算BMR和TDEE
            bmr = calculate_bmr(
                weight=daily_log.weight_kg or current_user.weight or 70,
                height=current_user.height or 170,
                age=current_user.age or 25,
                gender=current_user.gender or "male"
            )

            activity_multiplier = get_activity_multiplier(current_user.activity_level or "moderate")
            tdee = bmr * activity_multiplier + (daily_log.estimated_expenditure or 0)
            calorie_deficit = tdee - (daily_log.actual_intake or 0)

            # 获取餐食信息
            meals = db.query(MealLog).filter(MealLog.daily_log_id == daily_log.id).all()
            breakfast = next((meal.text for meal in meals if meal.meal_type == 'breakfast'), '无')
            lunch = next((meal.text for meal in meals if meal.meal_type == 'lunch'), '无')
            dinner = next((meal.text for meal in meals if meal.meal_type == 'dinner'), '无')

            # 准备分析数据
            analysis_text = f"""
            请分析以下全天饮食和运动数据，并给出健康建议：

            日期：{daily_log.date}
            体重：{daily_log.weight_kg or 0}kg
            早餐：{breakfast}
            午餐：{lunch}
            晚餐：{dinner}
            运动：{daily_log.activity or '无'}
            饮水：{daily_log.water_l or 0}L
            睡眠：{daily_log.sleep_h or 0}小时

            营养摄入：
            - 总热量：{daily_log.actual_intake or 0}卡
            - 蛋白质：{daily_log.protein_g or 0}g
            - 碳水化合物：{daily_log.carbs_g or 0}g
            - 脂肪：{daily_log.fat_g or 0}g

            代谢数据：
            - 基础代谢率(BMR)：{bmr}卡
            - 总消耗(TDEE)：{tdee}卡
            - 热量缺口：{calorie_deficit}卡

            请给出简洁的健康评价和建议（100字以内）。
            """

            # 调用AI生成小结
            summary_result = await gemini_service.generate_daily_summary(analysis_text)

            # 更新记录
            daily_log.summary = summary_result or "AI分析暂时不可用"
            daily_log.bmr = bmr
            daily_log.tdee = tdee
            daily_log.calorie_deficit = calorie_deficit

            results.append({"log_id": log_id, "success": True})

        except Exception as e:
            results.append({"log_id": log_id, "success": False, "error": str(e)})

    db.commit()

    return {
        "success": True,
        "results": results,
        "total": len(log_ids),
        "successful": len([r for r in results if r["success"]]),
        "failed": len([r for r in results if not r["success"]])
    }


def calculate_bmr(weight: float, height: float, age: int, gender: str) -> int:
    """计算基础代谢率 (BMR)"""
    if gender.lower() == "female":
        # Mifflin-St Jeor Equation for women
        bmr = 10 * weight + 6.25 * height - 5 * age - 161
    else:
        # Mifflin-St Jeor Equation for men
        bmr = 10 * weight + 6.25 * height - 5 * age + 5

    return int(bmr)


def get_activity_multiplier(activity_level: str) -> float:
    """获取活动水平乘数"""
    multipliers = {
        "sedentary": 1.2,      # 久坐
        "light": 1.375,        # 轻度活动
        "moderate": 1.55,      # 中度活动
        "active": 1.725,       # 高度活动
        "very_active": 1.9     # 极高活动
    }
    return multipliers.get(activity_level, 1.55)
