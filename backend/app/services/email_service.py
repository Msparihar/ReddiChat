"""Email service implementation for ReddiChat."""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Optional
from app.core.config import settings
from app.core.logger import get_logger
from app.templates.email_templates import get_login_notification_template

logger = get_logger(__name__)


class EmailService:
    """Service for handling email operations."""

    def __init__(self):
        """Initialize the email service with configuration."""
        # Use new email config first, fall back to legacy config
        self.sender_email = settings.SENDER_EMAIL or settings.EMAIL
        self.sender_password = settings.SENDER_EMAIL_PASSWORD or settings.EMAIL_PASSWORD
        self.smtp_server = settings.SMTP_SERVER
        self.smtp_port = settings.SMTP_PORT
        self.notification_email = settings.NOTIFICATION_EMAIL

        if not self.sender_email or not self.sender_password:
            logger.warning("Email settings not configured - email notifications will be disabled")
            logger.info(
                "Please set either SENDER_EMAIL/SENDER_EMAIL_PASSWORD or EMAIL/EMAIL_PASSWORD in your .env file"
            )
            self.enabled = False
        else:
            self.enabled = True
            logger.info("EmailService initialized with SMTP configuration")

    def _send_email(self, recipient_email: str, subject: str, body: str) -> bool:
        """
        Send an email using SMTP.

        Args:
            recipient_email (str): Recipient's email address
            subject (str): Email subject
            body (str): Email body content

        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        if not self.enabled:
            logger.warning("Email service is disabled - skipping email send")
            return False

        try:
            # Create message
            msg = MIMEMultipart()
            msg["From"] = self.sender_email
            msg["To"] = recipient_email
            msg["Subject"] = subject

            # Add body
            msg.attach(MIMEText(body, "plain"))

            # Create SMTP session and send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
                server.send_message(msg)

            logger.info(f"Email sent successfully to {recipient_email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email to {recipient_email}: {str(e)}")
            return False

    async def send_login_notification(self, user_name: str, user_email: str, provider: str, user_id: str) -> bool:
        """
        Send a login notification email.

        Args:
            user_name (str): Name of the user who logged in
            user_email (str): Email of the user who logged in
            provider (str): OAuth provider used (e.g., "google")
            user_id (str): User ID in the system

        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        try:
            # Only send notifications for Google OAuth logins
            if provider.lower() != "google":
                logger.info(f"Skipping email notification for non-Google provider: {provider}")
                return True

            subject = "ReddiChat - New User Login Notification"

            # Prepare user details for template
            user_details = {
                "user_name": user_name or "Unknown",
                "user_email": user_email,
                "provider": provider,
                "login_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
                "user_id": user_id,
            }

            body = get_login_notification_template(user_details)

            # Send email to the configured notification email
            success = self._send_email(self.notification_email, subject, body)

            if success:
                logger.info(f"Login notification sent for user: {user_email} via {provider}")
            else:
                logger.error(f"Failed to send login notification for user: {user_email}")

            return success

        except Exception as e:
            logger.error(f"Error preparing login notification email: {str(e)}")
            return False


# Global email service instance
_email_service: Optional[EmailService] = None


def get_email_service() -> EmailService:
    """
    Get the global email service instance.

    Returns:
        EmailService: The email service instance
    """
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service
