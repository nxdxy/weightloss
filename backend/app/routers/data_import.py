from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, DailyLog, MealLog
from ..auth import get_current_active_user
import json
import csv
import io
from datetime import datetime, date

router = APIRouter(prefix="/data-import", tags=["data import"])


@router.post("/from-csv")
async def import_from_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Import data from CSV file"""

    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV file")

    try:
        # Read CSV content
        content = await file.read()
        text = content.decode('utf-8-sig')  # Handle BOM

        # Parse CSV
        csv_reader = csv.DictReader(io.StringIO(text))

        # Field mapping (Chinese and English aliases)
        field_mapping = {
            # Date fields
            '日期': 'date', '日期天数': 'date', 'date': 'date',
            # Basic metrics - with and without parentheses
            '晨重kg': 'weight_kg', '体重kg': 'weight_kg', '体重': 'weight_kg', '晨重': 'weight_kg', 'weight': 'weight_kg',
            '晨重(kg)': 'weight_kg', '体重(kg)': 'weight_kg', '晨重 (kg)': 'weight_kg', '体重 (kg)': 'weight_kg',
            '腰围cm': 'waist_cm', '腰围': 'waist_cm', 'waist': 'waist_cm',
            '腰围(cm)': 'waist_cm', '腰围 (cm)': 'waist_cm',
            '饮水量l': 'water_l', '饮水l': 'water_l', '饮水量': 'water_l', '饮水': 'water_l', 'water': 'water_l',
            '饮水量(l)': 'water_l', '饮水量 (l)': 'water_l', '饮水量(L)': 'water_l', '饮水量 (L)': 'water_l',
            '睡眠h': 'sleep_h', '睡眠': 'sleep_h', 'sleep': 'sleep_h',
            '睡眠(h)': 'sleep_h', '睡眠 (h)': 'sleep_h',
            # Metabolism
            'bmr': 'bmr', '基础代谢': 'bmr',
            'tdee': 'tdee', '总消耗': 'tdee',
            # Nutrition - with and without parentheses
            '实际摄入kcal': 'actual_intake', '实际摄入': 'actual_intake', 'actualintake': 'actual_intake',
            '实际摄入(kcal)': 'actual_intake', '实际摄入 (kcal)': 'actual_intake',
            '目标摄入kcal': 'actual_intake', '目标摄入': 'actual_intake',
            '目标摄入(kcal)': 'actual_intake', '目标摄入 (kcal)': 'actual_intake',
            '预估消耗kcal': 'estimated_expenditure', '运动消耗kcal': 'estimated_expenditure', '运动消耗': 'estimated_expenditure', 'expenditure': 'estimated_expenditure',
            '预估消耗(kcal)': 'estimated_expenditure', '预估消耗 (kcal)': 'estimated_expenditure',
            '运动消耗(kcal)': 'estimated_expenditure', '运动消耗 (kcal)': 'estimated_expenditure',
            '蛋白质g': 'protein_g', '蛋白质': 'protein_g', 'protein': 'protein_g',
            '蛋白质(g)': 'protein_g', '蛋白质 (g)': 'protein_g',
            '碳水g': 'carbs_g', '碳水': 'carbs_g', 'carbs': 'carbs_g', '碳水化合物': 'carbs_g',
            '碳水(g)': 'carbs_g', '碳水 (g)': 'carbs_g', '碳水化合物(g)': 'carbs_g', '碳水化合物 (g)': 'carbs_g',
            '脂肪g': 'fat_g', '脂肪': 'fat_g', 'fat': 'fat_g',
            '脂肪(g)': 'fat_g', '脂肪 (g)': 'fat_g',
            '热量缺口kcal': 'calorie_deficit', '热量缺口': 'calorie_deficit', 'caloriedeficit': 'calorie_deficit',
            '热量缺口(kcal)': 'calorie_deficit', '热量缺口 (kcal)': 'calorie_deficit',
            # Meals
            '早餐': 'breakfast', 'breakfast': 'breakfast',
            '午餐': 'lunch', 'lunch': 'lunch',
            '晚餐': 'dinner', 'dinner': 'dinner',
            # Other
            '运动情况': 'activity', '运动': 'activity', 'activity': 'activity',
            '备注感受': 'summary', '备注': 'summary', '感受': 'summary', 'notes': 'summary', '当日小结': 'summary', 'summary': 'summary'
        }

        # Normalize field names
        def normalize_field(field_name: str) -> str:
            # Remove spaces, underscores, parentheses and convert to lowercase
            return field_name.strip().lower().replace(' ', '').replace('_', '').replace('(', '').replace(')', '')

        # Create reverse mapping
        normalized_mapping = {}
        for key, value in field_mapping.items():
            normalized_mapping[normalize_field(key)] = value

        imported_count = 0
        skipped_count = 0

        for row in csv_reader:
            try:
                # Map CSV fields to database fields
                mapped_data = {}
                meal_data = {}

                for csv_field, csv_value in row.items():
                    if not csv_value or csv_value.strip() == '':
                        continue

                    normalized_field = normalize_field(csv_field)
                    if normalized_field in normalized_mapping:
                        db_field = normalized_mapping[normalized_field]

                        if db_field in ['breakfast', 'lunch', 'dinner']:
                            meal_data[db_field] = csv_value.strip()
                        elif db_field == 'date':
                            # Parse date
                            try:
                                if '/' in csv_value:
                                    date_obj = datetime.strptime(csv_value.strip(), '%Y/%m/%d').date()
                                elif '-' in csv_value:
                                    date_obj = datetime.strptime(csv_value.strip(), '%Y-%m-%d').date()
                                else:
                                    continue
                                mapped_data[db_field] = date_obj
                            except ValueError:
                                continue
                        elif db_field in ['weight_kg', 'waist_cm', 'water_l', 'sleep_h', 'bmr', 'tdee',
                                        'actual_intake', 'estimated_expenditure', 'protein_g', 'carbs_g',
                                        'fat_g', 'calorie_deficit']:
                            # Parse numeric values
                            try:
                                # Handle range values like "65~66"
                                if '~' in csv_value:
                                    csv_value = csv_value.split('~')[-1]

                                numeric_value = float(csv_value.strip())
                                mapped_data[db_field] = numeric_value
                            except ValueError:
                                continue
                        else:
                            mapped_data[db_field] = csv_value.strip()

                # Must have date
                if 'date' not in mapped_data:
                    continue

                # Check if log already exists
                existing_log = db.query(DailyLog).filter(
                    DailyLog.user_id == current_user.id,
                    DailyLog.date == mapped_data['date']
                ).first()

                if existing_log:
                    skipped_count += 1
                    continue

                # Calculate BMR if weight is available
                if 'weight_kg' in mapped_data and mapped_data['weight_kg']:
                    from .meals import calculate_bmr, get_activity_multiplier

                    bmr = calculate_bmr(
                        weight=float(mapped_data['weight_kg']),
                        height=float(current_user.height) if current_user.height else 170,
                        age=current_user.age if current_user.age else 25,
                        gender=current_user.gender if current_user.gender else "male"
                    )

                    activity_multiplier = get_activity_multiplier(current_user.activity_level or "moderate")
                    tdee = bmr * activity_multiplier + (mapped_data.get('estimated_expenditure', 0) or 0)
                    calorie_deficit = tdee - (mapped_data.get('actual_intake', 0) or 0)

                    mapped_data['bmr'] = bmr
                    mapped_data['tdee'] = tdee
                    mapped_data['calorie_deficit'] = calorie_deficit

                # Create daily log
                daily_log = DailyLog(
                    user_id=current_user.id,
                    **mapped_data
                )

                db.add(daily_log)
                db.flush()  # Get the ID

                # Add meals
                for meal_type, meal_text in meal_data.items():
                    if meal_text:
                        meal_log = MealLog(
                            daily_log_id=daily_log.id,
                            meal_type=meal_type,
                            text=meal_text
                        )
                        db.add(meal_log)

                imported_count += 1

            except Exception as e:
                print(f"Error importing row: {e}")
                continue

        db.commit()

        return {
            "message": "CSV import completed",
            "imported_logs": imported_count,
            "skipped_logs": skipped_count,
            "total_processed": imported_count + skipped_count
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"CSV import failed: {str(e)}")


@router.post("/from-json")
async def import_from_json(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Import data from JSON file (from original localStorage format)"""

    if not file.filename.endswith('.json'):
        raise HTTPException(status_code=400, detail="File must be a JSON file")
    
    try:
        # Read and parse JSON file
        content = await file.read()
        data = json.loads(content.decode('utf-8'))
        
        imported_count = 0
        skipped_count = 0
        
        # Import daily logs
        if 'dailyLogs' in data:
            for log_data in data['dailyLogs']:
                try:
                    # Parse date
                    log_date = datetime.strptime(log_data['date'], '%Y-%m-%d').date()
                    
                    # Check if log already exists
                    existing_log = db.query(DailyLog).filter(
                        DailyLog.user_id == current_user.id,
                        DailyLog.date == log_date
                    ).first()
                    
                    if existing_log:
                        skipped_count += 1
                        continue
                    
                    # Create new daily log
                    daily_log = DailyLog(
                        user_id=current_user.id,
                        date=log_date,
                        weight_kg=log_data.get('weight'),
                        waist_cm=log_data.get('waist'),
                        water_l=log_data.get('water'),
                        sleep_h=log_data.get('sleep'),
                        bmr=log_data.get('bmr'),
                        tdee=log_data.get('tdee'),
                        actual_intake=log_data.get('actualIntake'),
                        estimated_expenditure=log_data.get('estimatedExpenditure'),
                        protein_g=log_data.get('proteinG'),
                        carbs_g=log_data.get('carbsG'),
                        fat_g=log_data.get('fatG'),
                        calorie_deficit=log_data.get('calorieDeficit'),
                        activity=log_data.get('activity', ''),
                        summary=log_data.get('summary', '')
                    )
                    
                    db.add(daily_log)
                    db.flush()  # Get the ID
                    
                    # Import meals for this day
                    if 'meals' in log_data:
                        for meal_type, meal_data in log_data['meals'].items():
                            if meal_data and isinstance(meal_data, dict):
                                meal_log = MealLog(
                                    daily_log_id=daily_log.id,
                                    meal_type=meal_type,
                                    text=meal_data.get('text', ''),
                                    analysis_data=meal_data.get('analysisData')
                                )
                                db.add(meal_log)
                    
                    imported_count += 1
                    
                except Exception as e:
                    print(f"Error importing log for {log_data.get('date', 'unknown')}: {e}")
                    continue
        
        db.commit()
        
        return {
            "message": "Data import completed",
            "imported_logs": imported_count,
            "skipped_logs": skipped_count,
            "total_processed": imported_count + skipped_count
        }
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON file")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")


@router.post("/from-localStorage")
async def import_from_localstorage(
    data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Import data from localStorage format (direct JSON object)"""
    
    try:
        imported_count = 0
        skipped_count = 0
        
        # Import daily logs
        if 'dailyLogs' in data:
            for log_data in data['dailyLogs']:
                try:
                    # Parse date
                    log_date = datetime.strptime(log_data['date'], '%Y-%m-%d').date()
                    
                    # Check if log already exists
                    existing_log = db.query(DailyLog).filter(
                        DailyLog.user_id == current_user.id,
                        DailyLog.date == log_date
                    ).first()
                    
                    if existing_log:
                        skipped_count += 1
                        continue
                    
                    # Create new daily log
                    daily_log = DailyLog(
                        user_id=current_user.id,
                        date=log_date,
                        weight_kg=log_data.get('weight'),
                        waist_cm=log_data.get('waist'),
                        water_l=log_data.get('water'),
                        sleep_h=log_data.get('sleep'),
                        bmr=log_data.get('bmr'),
                        tdee=log_data.get('tdee'),
                        actual_intake=log_data.get('actualIntake'),
                        estimated_expenditure=log_data.get('estimatedExpenditure'),
                        protein_g=log_data.get('proteinG'),
                        carbs_g=log_data.get('carbsG'),
                        fat_g=log_data.get('fatG'),
                        calorie_deficit=log_data.get('calorieDeficit'),
                        activity=log_data.get('activity', ''),
                        summary=log_data.get('summary', '')
                    )
                    
                    db.add(daily_log)
                    db.flush()  # Get the ID
                    
                    # Import meals for this day
                    if 'meals' in log_data:
                        for meal_type, meal_data in log_data['meals'].items():
                            if meal_data and isinstance(meal_data, dict):
                                meal_log = MealLog(
                                    daily_log_id=daily_log.id,
                                    meal_type=meal_type,
                                    text=meal_data.get('text', ''),
                                    analysis_data=meal_data.get('analysisData')
                                )
                                db.add(meal_log)
                    
                    imported_count += 1
                    
                except Exception as e:
                    print(f"Error importing log for {log_data.get('date', 'unknown')}: {e}")
                    continue
        
        db.commit()
        
        return {
            "message": "Data import completed",
            "imported_logs": imported_count,
            "skipped_logs": skipped_count,
            "total_processed": imported_count + skipped_count
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")


@router.get("/export")
async def export_data(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Export user data to JSON format"""
    
    try:
        # Get all daily logs for the user
        daily_logs = db.query(DailyLog).filter(
            DailyLog.user_id == current_user.id
        ).order_by(DailyLog.date.asc()).all()
        
        export_data = {
            "user": {
                "username": current_user.username,
                "email": current_user.email,
                "exported_at": datetime.now().isoformat()
            },
            "dailyLogs": []
        }
        
        for log in daily_logs:
            log_data = {
                "date": log.date.strftime('%Y-%m-%d'),
                "weight": float(log.weight_kg) if log.weight_kg else None,
                "waist": float(log.waist_cm) if log.waist_cm else None,
                "water": float(log.water_l) if log.water_l else None,
                "sleep": float(log.sleep_h) if log.sleep_h else None,
                "bmr": float(log.bmr) if log.bmr else None,
                "tdee": float(log.tdee) if log.tdee else None,
                "actualIntake": float(log.actual_intake) if log.actual_intake else None,
                "estimatedExpenditure": float(log.estimated_expenditure) if log.estimated_expenditure else None,
                "proteinG": float(log.protein_g) if log.protein_g else None,
                "carbsG": float(log.carbs_g) if log.carbs_g else None,
                "fatG": float(log.fat_g) if log.fat_g else None,
                "calorieDeficit": float(log.calorie_deficit) if log.calorie_deficit else None,
                "activity": log.activity or "",
                "summary": log.summary or "",
                "meals": {}
            }
            
            # Add meals
            for meal in log.meal_logs:
                log_data["meals"][meal.meal_type] = {
                    "text": meal.text,
                    "analysisData": meal.analysis_data
                }
            
            export_data["dailyLogs"].append(log_data)
        
        return export_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")
