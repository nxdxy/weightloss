from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..database import get_db
import os
import psutil
from datetime import datetime

router = APIRouter(tags=["health"])

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    """健康检查端点"""
    try:
        # 检查数据库连接
        db.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    # 检查磁盘空间
    disk_usage = psutil.disk_usage('/')
    disk_free_gb = disk_usage.free / (1024**3)
    
    # 检查内存使用
    memory = psutil.virtual_memory()
    memory_usage_percent = memory.percent
    
    # 检查上传目录
    uploads_dir = "/app/uploads"
    uploads_exists = os.path.exists(uploads_dir)
    uploads_writable = os.access(uploads_dir, os.W_OK) if uploads_exists else False
    
    # 检查数据目录
    data_dir = "/app/data"
    data_exists = os.path.exists(data_dir)
    data_writable = os.access(data_dir, os.W_OK) if data_exists else False
    
    health_status = {
        "status": "healthy" if db_status == "healthy" else "unhealthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",  # 可以从环境变量或配置文件读取
        "checks": {
            "database": {
                "status": db_status,
                "type": "sqlite"
            },
            "disk": {
                "free_gb": round(disk_free_gb, 2),
                "status": "healthy" if disk_free_gb > 1 else "warning"
            },
            "memory": {
                "usage_percent": memory_usage_percent,
                "status": "healthy" if memory_usage_percent < 80 else "warning"
            },
            "uploads": {
                "exists": uploads_exists,
                "writable": uploads_writable,
                "status": "healthy" if uploads_exists and uploads_writable else "unhealthy"
            },
            "data": {
                "exists": data_exists,
                "writable": data_writable,
                "status": "healthy" if data_exists and data_writable else "unhealthy"
            }
        }
    }
    
    return health_status

@router.get("/health/detailed")
def detailed_health_check(db: Session = Depends(get_db)):
    """详细健康检查"""
    try:
        # 数据库详细信息
        result = db.execute(text("SELECT COUNT(*) as user_count FROM users")).fetchone()
        user_count = result[0] if result else 0
        
        result = db.execute(text("SELECT COUNT(*) as meal_count FROM meal_logs")).fetchone()
        meal_count = result[0] if result else 0
        
        db_info = {
            "status": "healthy",
            "user_count": user_count,
            "meal_count": meal_count
        }
    except Exception as e:
        db_info = {
            "status": "unhealthy",
            "error": str(e)
        }
    
    # 系统信息
    system_info = {
        "cpu_percent": psutil.cpu_percent(interval=1),
        "memory": {
            "total": psutil.virtual_memory().total,
            "available": psutil.virtual_memory().available,
            "percent": psutil.virtual_memory().percent
        },
        "disk": {
            "total": psutil.disk_usage('/').total,
            "free": psutil.disk_usage('/').free,
            "percent": psutil.disk_usage('/').percent
        }
    }
    
    return {
        "status": "healthy" if db_info["status"] == "healthy" else "unhealthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": db_info,
        "system": system_info
    }
