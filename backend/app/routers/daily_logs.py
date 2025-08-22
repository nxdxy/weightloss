from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from ..database import get_db
from ..models import User, DailyLog, MealLog
from ..schemas import DailyLogCreate, DailyLogUpdate, DailyLogResponse
from ..auth import get_current_active_user

router = APIRouter(prefix="/daily-logs", tags=["daily logs"])


def _process_meal_analysis_data(analysis_data):
    """处理餐食分析数据的向后兼容性"""
    if not analysis_data:
        return analysis_data

    # 创建数据副本以避免修改原始数据
    processed_data = analysis_data.copy()

    # 处理 fatLossAdvantages 的向后兼容性
    if 'fatLossAdvantages' in processed_data:
        if isinstance(processed_data['fatLossAdvantages'], str):
            # 如果是字符串，转换为单元素数组
            processed_data['fatLossAdvantages'] = [processed_data['fatLossAdvantages']] if processed_data['fatLossAdvantages'].strip() else []

    # 处理 fatLossDisadvantages 的向后兼容性
    if 'fatLossDisadvantages' in processed_data:
        if isinstance(processed_data['fatLossDisadvantages'], str):
            # 如果是字符串，转换为单元素数组
            processed_data['fatLossDisadvantages'] = [processed_data['fatLossDisadvantages']] if processed_data['fatLossDisadvantages'].strip() else []

    return processed_data


@router.get("/", response_model=List[DailyLogResponse])
def get_daily_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's daily logs with optional date filtering"""
    query = db.query(DailyLog).options(joinedload(DailyLog.meal_logs)).filter(DailyLog.user_id == current_user.id)

    if start_date:
        query = query.filter(DailyLog.date >= start_date)
    if end_date:
        query = query.filter(DailyLog.date <= end_date)

    logs = query.order_by(DailyLog.date.desc()).offset(skip).limit(limit).all()

    # 处理每个日志的餐食分析数据
    for log in logs:
        for meal in log.meal_logs:
            if meal.analysis_data:
                meal.analysis_data = _process_meal_analysis_data(meal.analysis_data)

    return logs


@router.post("/", response_model=DailyLogResponse)
def create_daily_log(
    log: DailyLogCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new daily log"""
    # Check if log for this date already exists
    existing_log = db.query(DailyLog).filter(
        and_(DailyLog.user_id == current_user.id, DailyLog.date == log.date)
    ).first()
    
    if existing_log:
        raise HTTPException(
            status_code=400,
            detail=f"Daily log for {log.date} already exists"
        )
    
    # Create new daily log
    db_log = DailyLog(
        user_id=current_user.id,
        **log.dict()
    )
    
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    
    return db_log


@router.get("/{log_id}", response_model=DailyLogResponse)
def get_daily_log(
    log_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific daily log"""
    log = db.query(DailyLog).options(joinedload(DailyLog.meal_logs)).filter(
        and_(DailyLog.id == log_id, DailyLog.user_id == current_user.id)
    ).first()

    if not log:
        raise HTTPException(status_code=404, detail="Daily log not found")

    # 处理餐食分析数据
    for meal in log.meal_logs:
        if meal.analysis_data:
            meal.analysis_data = _process_meal_analysis_data(meal.analysis_data)

    return log


@router.get("/by-date/{log_date}", response_model=DailyLogResponse)
def get_daily_log_by_date(
    log_date: date,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get daily log by date"""
    log = db.query(DailyLog).options(joinedload(DailyLog.meal_logs)).filter(
        and_(DailyLog.user_id == current_user.id, DailyLog.date == log_date)
    ).first()

    if not log:
        raise HTTPException(status_code=404, detail="Daily log not found for this date")

    # 处理餐食分析数据
    for meal in log.meal_logs:
        if meal.analysis_data:
            meal.analysis_data = _process_meal_analysis_data(meal.analysis_data)

    return log


@router.put("/{log_id}", response_model=DailyLogResponse)
def update_daily_log(
    log_id: int,
    log_update: DailyLogUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a daily log"""
    log = db.query(DailyLog).filter(
        and_(DailyLog.id == log_id, DailyLog.user_id == current_user.id)
    ).first()
    
    if not log:
        raise HTTPException(status_code=404, detail="Daily log not found")
    
    # Update fields
    update_data = log_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(log, field, value)
    
    db.commit()
    db.refresh(log)
    
    return log


@router.delete("/{log_id}")
def delete_daily_log(
    log_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a daily log"""
    log = db.query(DailyLog).filter(
        and_(DailyLog.id == log_id, DailyLog.user_id == current_user.id)
    ).first()
    
    if not log:
        raise HTTPException(status_code=404, detail="Daily log not found")
    
    db.delete(log)
    db.commit()
    
    return {"message": "Daily log deleted successfully"}


@router.get("/debug/meal-logs")
def debug_meal_logs(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Debug endpoint to check meal logs"""
    meal_logs = db.query(MealLog).join(DailyLog).filter(
        DailyLog.user_id == current_user.id
    ).all()

    result = []
    for meal in meal_logs:
        result.append({
            "id": meal.id,
            "daily_log_id": meal.daily_log_id,
            "meal_type": meal.meal_type,
            "text": meal.text,
            "image_path": meal.image_path,
            "analysis_data": meal.analysis_data,
            "daily_log_date": meal.daily_log.date.isoformat()
        })

    return {
        "total_meal_logs": len(result),
        "meal_logs": result
    }
