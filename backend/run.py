#!/usr/bin/env python3
"""
AI Fitness Pal Backend Server
Run this script to start the development server
"""

import uvicorn
import os
from app.config import settings

if __name__ == "__main__":
    # Ensure upload directories exist
    os.makedirs(os.path.join(settings.upload_dir, "meals"), exist_ok=True)
    os.makedirs(os.path.join(settings.upload_dir, "chat"), exist_ok=True)
    
    print("🚀 Starting AI Fitness Pal Backend Server...")
    print(f"📊 Database: {settings.database_url}")
    print(f"📁 Upload Directory: {settings.upload_dir}")
    print(f"🌐 CORS Origins: {settings.allowed_origins}")
    print(f"🔧 Debug Mode: {settings.debug}")
    print("=" * 50)
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8889,
        reload=settings.debug,
        log_level="info" if settings.debug else "warning"
    )
