from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services.s3_service import get_s3_service
import uuid
from app.core.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(
    prefix="/file-test",
    tags=["file-testing"],
    responses={404: {"description": "Not found"}},
)


@router.post("/upload")
async def upload_file_to_s3(
    file: UploadFile = File(...),
    user_id: str = Form("test-user"),
):
    """
    Public API endpoint to upload a file to S3 for testing purposes

    Args:
        file: The file to upload
        user_id: User ID for organizing files in S3 (default: test-user)

    Returns:
        dict: Upload result with S3 URL and metadata
    """
    logger.info(f"Uploading file to S3: {file.filename}")

    try:
        # Get S3 service instance
        s3_service = get_s3_service()

        # Check if S3 service is available
        if not s3_service.is_available():
            raise HTTPException(status_code=503, detail="S3 service is not available")

        # Read file content
        file_content = await file.read()

        # Generate S3 key
        # Calculate checksum for deduplication
        checksum = s3_service.calculate_checksum(file_content)
        s3_key = s3_service.generate_s3_key(user_id, file.filename, checksum)

        # Upload file to S3
        result = await s3_service.upload_file(
            file_data=file_content, s3_key=s3_key, content_type=file.content_type or "application/octet-stream"
        )

        logger.info(f"File uploaded successfully: {s3_key}")
        return {
            "message": "File uploaded successfully",
            "filename": file.filename,
            "s3_key": result["s3_key"],
            "s3_url": result["s3_url"],
            "content_type": file.content_type,
            "file_size": len(file_content),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")


@router.delete("/delete")
async def delete_file_from_s3(
    s3_key: str = Form(...),
):
    """
    Public API endpoint to delete a file from S3 for testing purposes

    Args:
        s3_key: The S3 key of the file to delete

    Returns:
        dict: Deletion result
    """
    logger.info(f"Deleting file from S3: {s3_key}")

    try:
        # Get S3 service instance
        s3_service = get_s3_service()

        # Check if S3 service is available
        if not s3_service.is_available():
            raise HTTPException(status_code=503, detail="S3 service is not available")

        # Delete file from S3
        success = await s3_service.delete_file(s3_key)

        if success:
            logger.info(f"File deleted successfully: {s3_key}")
            return {"message": "File deleted successfully", "s3_key": s3_key}
        else:
            logger.warning(f"File deletion failed: {s3_key}")
            raise HTTPException(status_code=404, detail="File not found or deletion failed")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File deletion failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"File deletion failed: {str(e)}")
