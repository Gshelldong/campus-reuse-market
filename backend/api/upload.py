from fastapi import APIRouter, Depends, File, UploadFile

from dependencies import get_current_user
from models.user import User
from utils.file import save_upload_file

router = APIRouter(prefix="/api/upload", tags=["文件上传"])


@router.post("/image")
def upload_image(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    url = save_upload_file(file)
    return {"url": url}
