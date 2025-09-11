import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from app.core.config import settings
import logging
from typing import Optional
import hashlib
import os

logger = logging.getLogger(__name__)


class S3Service:
    """Service for handling S3 file operations"""

    def __init__(self):
        self.s3_client = None
        self._initialize_client()

    def _initialize_client(self):
        """Initialize S3 client with credentials"""
        try:
            if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
                # Check if using DigitalOcean Spaces
                if "sfo" in settings.AWS_REGION or "nyc" in settings.AWS_REGION or "ams" in settings.AWS_REGION:
                    # DigitalOcean Spaces endpoint
                    endpoint_url = f"https://{settings.AWS_REGION}.digitaloceanspaces.com"
                    self.s3_client = boto3.client(
                        "s3",
                        endpoint_url=endpoint_url,
                        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                        region_name=settings.AWS_REGION,
                    )
                else:
                    # Standard AWS S3
                    self.s3_client = boto3.client(
                        "s3",
                        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                        region_name=settings.AWS_REGION,
                    )
            else:
                # Try to use default credentials (IAM role, etc.)
                self.s3_client = boto3.client("s3", region_name=settings.AWS_REGION)

            # Test connection
            self.s3_client.head_bucket(Bucket=settings.S3_BUCKET)
            logger.info(f"S3 client initialized successfully for bucket: {settings.S3_BUCKET}")

        except NoCredentialsError:
            logger.warning("AWS credentials not found. S3 functionality will be disabled.")
            self.s3_client = None
        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            if error_code == "404":
                logger.error(f"S3 bucket '{settings.S3_BUCKET}' not found")
            else:
                logger.error(f"S3 client initialization failed: {str(e)}")
            self.s3_client = None
        except Exception as e:
            logger.error(f"Unexpected error initializing S3 client: {str(e)}")
            self.s3_client = None

    def is_available(self) -> bool:
        """Check if S3 service is available"""
        return self.s3_client is not None

    def generate_s3_key(self, user_id: str, filename: str, checksum: str) -> str:
        """Generate S3 key for file storage"""
        # Use checksum prefix for deduplication and organization
        prefix = checksum[:8] if checksum else "unknown"
        return f"user-files/{user_id}/{prefix}/{filename}"

    async def upload_file(self, file_data: bytes, s3_key: str, content_type: str, metadata: dict = None) -> dict:
        """
        Upload file to S3

        Args:
            file_data: Binary file data
            s3_key: S3 object key
            content_type: MIME type of the file
            metadata: Additional metadata to store

        Returns:
            dict: Upload result with S3 URL and metadata
        """
        if not self.is_available():
            raise Exception("S3 service is not available")

        try:
            # Prepare extra args
            extra_args = {"ContentType": content_type, "Metadata": metadata or {}}

            # Upload file
            self.s3_client.put_object(Bucket=settings.S3_BUCKET, Key=s3_key, Body=file_data, **extra_args)

            # Generate appropriate URL based on provider
            if "sfo" in settings.AWS_REGION or "nyc" in settings.AWS_REGION or "ams" in settings.AWS_REGION:
                # DigitalOcean Spaces URL
                s3_url = f"https://{settings.S3_BUCKET}.{settings.AWS_REGION}.digitaloceanspaces.com/{s3_key}"
            else:
                # AWS S3 URL
                s3_url = f"https://{settings.S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{s3_key}"

            logger.info(f"File uploaded successfully to S3: {s3_key}")

            return {"s3_bucket": settings.S3_BUCKET, "s3_key": s3_key, "s3_url": s3_url, "upload_success": True}

        except ClientError as e:
            error_msg = f"S3 upload failed: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)
        except Exception as e:
            error_msg = f"Unexpected error during S3 upload: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)

    async def download_file(self, s3_key: str) -> bytes:
        """
        Download file from S3

        Args:
            s3_key: S3 object key

        Returns:
            bytes: File binary data
        """
        if not self.is_available():
            raise Exception("S3 service is not available")

        try:
            response = self.s3_client.get_object(Bucket=settings.S3_BUCKET, Key=s3_key)
            file_data = response["Body"].read()

            logger.info(f"File downloaded successfully from S3: {s3_key}")
            return file_data

        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            if error_code == "NoSuchKey":
                error_msg = f"File not found in S3: {s3_key}"
            else:
                error_msg = f"S3 download failed: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)
        except Exception as e:
            error_msg = f"Unexpected error during S3 download: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)

    async def delete_file(self, s3_key: str) -> bool:
        """
        Delete file from S3

        Args:
            s3_key: S3 object key

        Returns:
            bool: True if deletion was successful
        """
        if not self.is_available():
            logger.warning("S3 service not available, cannot delete file")
            return False

        try:
            self.s3_client.delete_object(Bucket=settings.S3_BUCKET, Key=s3_key)
            logger.info(f"File deleted successfully from S3: {s3_key}")
            return True

        except ClientError as e:
            logger.error(f"S3 deletion failed: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error during S3 deletion: {str(e)}")
            return False

    async def file_exists(self, s3_key: str) -> bool:
        """
        Check if file exists in S3

        Args:
            s3_key: S3 object key

        Returns:
            bool: True if file exists
        """
        if not self.is_available():
            return False

        try:
            self.s3_client.head_object(Bucket=settings.S3_BUCKET, Key=s3_key)
            return True
        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            if error_code == "404":
                return False
            else:
                logger.error(f"Error checking file existence: {str(e)}")
                return False
        except Exception as e:
            logger.error(f"Unexpected error checking file existence: {str(e)}")
            return False

    def calculate_checksum(self, data: bytes) -> str:
        """Calculate SHA256 checksum of file data"""
        return hashlib.sha256(data).hexdigest()

    def generate_presigned_url(self, s3_key: str, expiration: int = 86400) -> Optional[str]:
        """
        Generate a pre-signed URL for file access

        Args:
            s3_key: S3 object key
            expiration: URL expiration time in seconds (default 24 hours)

        Returns:
            str: Pre-signed URL or None if generation fails
        """
        if not self.is_available():
            logger.warning("S3 service not available, cannot generate pre-signed URL")
            return None

        try:
            url = self.s3_client.generate_presigned_url(
                "get_object", Params={"Bucket": settings.S3_BUCKET, "Key": s3_key}, ExpiresIn=expiration
            )
            logger.debug(f"Generated pre-signed URL for: {s3_key}")
            return url

        except ClientError as e:
            logger.error(f"Failed to generate pre-signed URL for {s3_key}: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error generating pre-signed URL: {str(e)}")
            return None


# Global S3 service instance
s3_service = S3Service()


def get_s3_service() -> S3Service:
    """Dependency injection for S3 service"""
    return s3_service
