import os
import uuid
from datetime import datetime
from typing import Optional
from fastapi import UploadFile, HTTPException
from PIL import Image
import aiofiles
from .config import settings


def generate_filename(user_id: int, file_type: str, original_filename: str) -> str:
    """Generate a unique filename for uploaded files"""
    timestamp = int(datetime.now().timestamp())
    ext = os.path.splitext(original_filename)[1].lower()
    return f"user_{user_id}_{file_type}_{timestamp}{ext}"


def get_file_path(file_type: str, filename: str) -> str:
    """Get the full file path for a given file type and filename"""
    year = datetime.now().strftime("%Y")
    month = datetime.now().strftime("%m")
    
    directory = os.path.join(settings.upload_dir, file_type, year, month)
    os.makedirs(directory, exist_ok=True)
    
    return os.path.join(directory, filename)


async def save_upload_file(
    file: UploadFile,
    user_id: int,
    file_type: str,
    return_content: bool = False
) -> tuple[str, str] | tuple[str, str, bytes]:
    """
    Save an uploaded file and return (filename, file_path) or (filename, file_path, content)

    Args:
        file: The uploaded file
        user_id: ID of the user uploading the file
        file_type: Type of file ('meals' or 'chat')
        return_content: Whether to return file content as well

    Returns:
        Tuple of (filename, relative_file_path) or (filename, relative_file_path, content)
    """
    # Validate file size
    if file.size and file.size > settings.max_file_size:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {settings.max_file_size} bytes"
        )
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed types: {', '.join(allowed_types)}"
        )
    
    # Generate filename and path
    filename = generate_filename(user_id, file_type, file.filename or "image.jpg")
    file_path = get_file_path(file_type, filename)
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)

    # Optimize image if it's too large
    try:
        await optimize_image(file_path)
    except Exception as e:
        print(f"Warning: Could not optimize image {file_path}: {e}")

    # Return relative path for database storage
    relative_path = os.path.relpath(file_path, settings.upload_dir)

    if return_content:
        return filename, relative_path, content
    else:
        return filename, relative_path


async def optimize_image(file_path: str, max_width: int = 1024, quality: int = 85):
    """Optimize image by resizing and compressing"""
    try:
        with Image.open(file_path) as img:
            # Convert to RGB if necessary
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            
            # Resize if too large
            if img.width > max_width:
                ratio = max_width / img.width
                new_height = int(img.height * ratio)
                img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
            
            # Save with optimization
            img.save(file_path, "JPEG", quality=quality, optimize=True)
    except Exception as e:
        raise Exception(f"Failed to optimize image: {e}")


def get_full_file_path(relative_path: str) -> str:
    """Get full file path from relative path"""
    return os.path.join(settings.upload_dir, relative_path)


def file_exists(relative_path: str) -> bool:
    """Check if file exists"""
    full_path = get_full_file_path(relative_path)
    return os.path.exists(full_path)


def delete_file(relative_path: str) -> bool:
    """Delete a file and return success status"""
    try:
        full_path = get_full_file_path(relative_path)
        if os.path.exists(full_path):
            os.remove(full_path)
            return True
        return False
    except Exception:
        return False
