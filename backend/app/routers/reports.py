from typing import List, Optional
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, DailyLog, AnalysisReport
from ..schemas import AnalysisReportResponse
from ..auth import get_current_active_user
from ..services.gemini_service import get_gemini_service

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/generate", response_model=AnalysisReportResponse)
async def generate_analysis_report(
    days_back: int = Query(30, ge=7, le=365, description="Number of days to analyze"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Generate comprehensive analysis report"""
    if not current_user.gemini_api_key:
        raise HTTPException(
            status_code=400,
            detail="Gemini API key not configured. Please update your API key in settings."
        )
    
    try:
        # Get daily logs for the specified period
        start_date = date.today() - timedelta(days=days_back)
        daily_logs = db.query(DailyLog).filter(
            DailyLog.user_id == current_user.id,
            DailyLog.date >= start_date
        ).order_by(DailyLog.date.asc()).all()
        
        if not daily_logs:
            raise HTTPException(
                status_code=400,
                detail="No daily logs found for the specified period"
            )
        
        # Get Gemini service
        gemini_service = get_gemini_service(current_user.gemini_api_key)
        
        # Generate report
        report_data = await gemini_service.generate_analysis_report(
            user=current_user,
            daily_logs=daily_logs
        )
        
        # Save report to database
        analysis_report = AnalysisReport(
            user_id=current_user.id,
            report_data=report_data
        )
        
        db.add(analysis_report)
        db.commit()
        db.refresh(analysis_report)
        
        return analysis_report
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/latest", response_model=Optional[AnalysisReportResponse])
def get_latest_report(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get the latest analysis report"""
    report = db.query(AnalysisReport).filter(
        AnalysisReport.user_id == current_user.id
    ).order_by(AnalysisReport.generated_at.desc()).first()
    
    return report


@router.get("/", response_model=List[AnalysisReportResponse])
def get_analysis_reports(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get analysis reports history"""
    reports = db.query(AnalysisReport).filter(
        AnalysisReport.user_id == current_user.id
    ).order_by(AnalysisReport.generated_at.desc()).offset(skip).limit(limit).all()
    
    return reports


@router.get("/{report_id}", response_model=AnalysisReportResponse)
def get_analysis_report(
    report_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific analysis report"""
    report = db.query(AnalysisReport).filter(
        AnalysisReport.id == report_id,
        AnalysisReport.user_id == current_user.id
    ).first()
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return report


@router.delete("/{report_id}")
def delete_analysis_report(
    report_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete an analysis report"""
    report = db.query(AnalysisReport).filter(
        AnalysisReport.id == report_id,
        AnalysisReport.user_id == current_user.id
    ).first()
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    db.delete(report)
    db.commit()
    
    return {"message": "Report deleted successfully"}


@router.post("/analyze-day/{log_id}")
async def analyze_single_day(
    log_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Analyze a single day's data"""
    if not current_user.gemini_api_key:
        raise HTTPException(
            status_code=400,
            detail="Gemini API key not configured. Please update your API key in settings."
        )
    
    # Get daily log
    daily_log = db.query(DailyLog).filter(
        DailyLog.id == log_id,
        DailyLog.user_id == current_user.id
    ).first()
    
    if not daily_log:
        raise HTTPException(status_code=404, detail="Daily log not found")
    
    try:
        # Get Gemini service
        gemini_service = get_gemini_service(current_user.gemini_api_key)
        
        # Analyze the day
        analysis = await gemini_service.analyze_full_day(daily_log)
        
        # Update daily log with analysis results
        from decimal import Decimal

        daily_log.actual_intake = Decimal(str(analysis.get("estimatedIntakeCalories", 0)))
        daily_log.protein_g = Decimal(str(analysis.get("estimatedIntakeProteinG", 0)))
        daily_log.carbs_g = Decimal(str(analysis.get("estimatedIntakeCarbsG", 0)))
        daily_log.fat_g = Decimal(str(analysis.get("estimatedIntakeFatG", 0)))
        daily_log.estimated_expenditure = Decimal(str(analysis.get("estimatedExpenditureCalories", 0)))
        daily_log.summary = analysis.get("dailySummary", "")

        # Calculate calorie deficit
        if daily_log.tdee and daily_log.actual_intake:
            daily_log.calorie_deficit = daily_log.tdee - daily_log.actual_intake
        
        db.commit()
        db.refresh(daily_log)
        
        return {
            "message": "Day analysis completed successfully",
            "analysis": analysis,
            "updated_log": daily_log
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
