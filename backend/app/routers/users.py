from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import UserResponse, UserUpdate, ApiKeyUpdate
from ..auth import get_current_active_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/profile", response_model=UserResponse)
def get_user_profile(current_user: User = Depends(get_current_active_user)):
    """Get current user profile"""
    return current_user


@router.put("/profile", response_model=UserResponse)
def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    # Check if email is being updated and already exists
    if user_update.email and user_update.email != current_user.email:
        existing_user = db.query(User).filter(User.email == user_update.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    # Update user fields
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    
    return current_user


@router.put("/api-key")
def update_api_key(
    api_key_update: ApiKeyUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update user's Gemini API key"""
    current_user.gemini_api_key = api_key_update.gemini_api_key
    db.commit()
    
    return {"message": "API key updated successfully"}


@router.get("/api-key")
def get_api_key_status(current_user: User = Depends(get_current_active_user)):
    """Check if user has API key configured"""
    has_api_key = bool(current_user.gemini_api_key)
    return {"has_api_key": has_api_key}
