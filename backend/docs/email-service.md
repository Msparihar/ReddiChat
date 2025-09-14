# Email Service Documentation

## Overview

The ReddiChat email service sends notifications when users log in using Google OAuth. This service is designed to notify administrators about new user logins.

## Features

- **Gmail OAuth Login Notifications**: Sends email alerts when users log in with Google
- **SMTP Configuration**: Configurable SMTP settings for different email providers
- **Error Handling**: Graceful error handling that doesn't interrupt the login process
- **Template System**: Customizable email templates for different notification types

## Configuration

### Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Email Configuration (New format - recommended)
SENDER_EMAIL=your-email@gmail.com
SENDER_EMAIL_PASSWORD=your-gmail-app-password
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
NOTIFICATION_EMAIL=manishsparihar2020@gmail.com

# Legacy Email Configuration (also supported for backward compatibility)
EMAIL=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
```

**Note**: The configuration uses `os.getenv()` to read environment variables from your `.env` file. The service supports both new (`SENDER_EMAIL`/`SENDER_EMAIL_PASSWORD`) and legacy (`EMAIL`/`EMAIL_PASSWORD`) configuration formats for backward compatibility.

### Gmail Setup

To use Gmail as the sender:

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this password as `SENDER_EMAIL_PASSWORD`

## Usage

### Automatic Notifications

The email service automatically sends notifications when:

- A user logs in with Google OAuth
- The login is successful and the user is created/updated in the database

### Manual Testing

You can test the email service using the provided test script:

```bash
cd backend
uv run test_email_service.py
```

## Email Template

The login notification email includes:

- User's name and email
- OAuth provider used (Google)
- Login timestamp
- User ID in the system

## Error Handling

- Email sending failures are logged but don't interrupt the login process
- If email configuration is missing, the service is disabled gracefully
- All email operations are wrapped in try-catch blocks

## Files Structure

```
backend/
├── app/
│   ├── services/
│   │   └── email_service.py          # Main email service
│   ├── templates/
│   │   └── email_templates.py        # Email templates
│   ├── core/
│   │   └── config.py                 # Email configuration
│   └── routers/
│       └── auth.py                   # OAuth callback integration
├── test_email_service.py             # Test script
└── docs/
    └── email-service.md              # This documentation
```

## Security Considerations

- Email credentials are stored in environment variables
- App passwords are used instead of main account passwords
- SMTP connections use TLS encryption
- Email sending failures don't expose sensitive information

## Troubleshooting

### Common Issues

1. **"Email service is disabled"**
   - Check that `SENDER_EMAIL` and `SENDER_EMAIL_PASSWORD` are set
   - Verify the environment variables are loaded correctly

2. **"Authentication failed"**
   - Verify the Gmail app password is correct
   - Ensure 2FA is enabled on the Gmail account
   - Check that the app password is for "Mail" application

3. **"Connection refused"**
   - Verify SMTP server and port settings
   - Check firewall settings
   - Ensure the email provider allows SMTP connections

### Debug Mode

Enable debug logging to see detailed email service logs:

```python
import logging
logging.getLogger("app.services.email_service").setLevel(logging.DEBUG)
```

## Future Enhancements

- Support for multiple email providers
- HTML email templates
- Email queuing for better reliability
- User preference settings for notifications
- Email analytics and tracking
