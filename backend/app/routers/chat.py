from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, ChatMessage
from ..schemas import ChatMessageCreate, ChatMessageResponse
from ..auth import get_current_active_user
from ..utils import save_upload_file
from ..services.gemini_service import get_gemini_service
import json

router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/history", response_model=List[ChatMessageResponse])
def get_chat_history(
    limit: int = 50,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get chat history for current user"""
    messages = db.query(ChatMessage).filter(
        ChatMessage.user_id == current_user.id
    ).order_by(ChatMessage.created_at.desc()).limit(limit).all()
    
    # Reverse to get chronological order
    return list(reversed(messages))


@router.post("/message")
async def send_chat_message(
    message: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Send a chat message and get AI response"""
    # Validate that at least message or image is provided
    if not message and not image:
        raise HTTPException(
            status_code=422,
            detail="Either message or image must be provided"
        )

    if not current_user.gemini_api_key:
        raise HTTPException(
            status_code=400,
            detail="Gemini API key not configured. Please update your API key in settings."
        )
    
    try:
        # Save user message to database
        image_path = None
        if image:
            _, image_path = await save_upload_file(image, current_user.id, "chat")
        
        # Provide default text for image-only messages to satisfy NOT NULL constraint
        message_text = message if message else "[图片分析]"

        user_message = ChatMessage(
            user_id=current_user.id,
            role="user",
            text=message_text,
            image_path=image_path
        )
        db.add(user_message)
        db.commit()
        db.refresh(user_message)
        
        # Get chat history for context
        recent_messages = db.query(ChatMessage).filter(
            ChatMessage.user_id == current_user.id
        ).order_by(ChatMessage.created_at.desc()).limit(10).all()
        
        # Convert to format expected by Gemini service
        chat_history = []
        for msg in reversed(recent_messages[1:]):  # Exclude the just-added message
            chat_history.append({
                "role": msg.role,
                "parts": [{"text": msg.text}]
            })
        
        # Get Gemini service
        gemini_service = get_gemini_service(current_user.gemini_api_key)
        
        # Process image if provided
        image_data = None
        if image:
            image.file.seek(0)  # Reset file pointer
            image_data = await image.read()
        
        # Generate AI response
        async def generate_response():
            # First, send the user message info (including image path if any)
            user_message_data = {
                'user_message': {
                    'id': user_message.id,
                    'role': user_message.role,
                    'text': user_message.text,
                    'image_path': user_message.image_path,
                    'created_at': user_message.created_at.isoformat()
                }
            }
            yield f"data: {json.dumps(user_message_data)}\n\n"

            full_response = ""
            async for chunk in gemini_service.chat_stream(
                message=message,
                image_data=image_data,
                chat_history=chat_history
            ):
                full_response += chunk
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
            
            # Save AI response to database
            # Ensure response is not empty to satisfy NOT NULL constraint
            response_text = full_response.strip() if full_response.strip() else "抱歉，我没有生成回复。"

            ai_message = ChatMessage(
                user_id=current_user.id,
                role="model",
                text=response_text
            )
            db.add(ai_message)
            db.commit()
            
            yield f"data: {json.dumps({'done': True})}\n\n"
        
        return StreamingResponse(
            generate_response(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream"
            }
        )

    except Exception as e:
        import traceback
        print(f"Chat error: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/history")
def clear_chat_history(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Clear chat history for current user"""
    deleted_count = db.query(ChatMessage).filter(
        ChatMessage.user_id == current_user.id
    ).delete()
    
    db.commit()
    
    return {"message": f"Deleted {deleted_count} chat messages"}


@router.delete("/message/{message_id}")
def delete_chat_message(
    message_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a specific chat message"""
    message = db.query(ChatMessage).filter(
        ChatMessage.id == message_id,
        ChatMessage.user_id == current_user.id
    ).first()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Delete associated image file if exists
    if message.image_path:
        from ..utils import delete_file
        delete_file(message.image_path)
    
    db.delete(message)
    db.commit()
    
    return {"message": "Chat message deleted successfully"}
