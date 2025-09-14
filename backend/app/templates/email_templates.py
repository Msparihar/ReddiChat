"""Email templates for ReddiChat."""

LOGIN_NOTIFICATION_TEMPLATE = """
Dear Admin,

A new user has logged in to ReddiChat using Google OAuth.

User Details:
- Name: {user_name}
- Email: {user_email}
- Provider: {provider}
- Login Time: {login_time}
- User ID: {user_id}

This is an automated notification from ReddiChat.

Best regards,
ReddiChat System
"""


def get_login_notification_template(user_details: dict) -> str:
    """
    Generate the login notification email content.

    Args:
        user_details (dict): Dictionary containing user details
            - user_name: Name of the user who logged in
            - user_email: Email of the user who logged in
            - provider: OAuth provider used (e.g., "google")
            - login_time: Timestamp of login
            - user_id: User ID in the system

    Returns:
        str: Formatted email content
    """
    return LOGIN_NOTIFICATION_TEMPLATE.format(
        user_name=user_details["user_name"],
        user_email=user_details["user_email"],
        provider=user_details["provider"],
        login_time=user_details["login_time"],
        user_id=user_details["user_id"],
    )
