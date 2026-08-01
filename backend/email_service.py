from fastapi_mail import FastMail, MessageSchema, MessageType
from fastapi_mail.config import ConnectionConfig
from pydantic import EmailStr
from typing import Optional
from config import settings
from datetime import datetime


# Configure FastAPI-Mail
conf = ConnectionConfig(
    MAIL_USERNAME=settings.SMTP_USERNAME,
    MAIL_PASSWORD=settings.SMTP_PASSWORD,
    MAIL_FROM=settings.SMTP_FROM,
    MAIL_PORT=settings.SMTP_PORT,
    MAIL_SERVER=settings.SMTP_HOST,
    MAIL_FROM_NAME=settings.SMTP_FROM_NAME,
    MAIL_STARTTLS=settings.SMTP_TLS,
    MAIL_SSL_TLS=settings.SMTP_SSL,
    USE_CREDENTIALS=True if settings.SMTP_USERNAME else False,
    VALIDATE_CERTS=True,
)

fastmail = FastMail(conf)


def create_verification_email(
    recipient_email: EmailStr,
    recipient_name: str,
    verification_token: str
) -> MessageSchema:
    """Create email verification message."""
    verification_url = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - APIRADx</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                background-color: #FFF6EA;
                margin: 0;
                padding: 20px;
                line-height: 1.6;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }}
            .header {{
                background-color: #5A4A33;
                padding: 30px;
                text-align: center;
            }}
            .logo {{
                font-size: 28px;
                font-weight: bold;
                color: #ffffff;
                margin: 0;
            }}
            .content {{
                padding: 40px 30px;
            }}
            h1 {{
                color: #5A4A33;
                font-size: 24px;
                margin-bottom: 20px;
            }}
            p {{
                color: #333333;
                font-size: 16px;
                margin-bottom: 20px;
            }}
            .button {{
                display: inline-block;
                padding: 14px 32px;
                background-color: #5A4A33;
                color: #ffffff;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                margin: 20px 0;
            }}
            .button:hover {{
                background-color: #4A3A23;
            }}
            .footer {{
                background-color: #f5f5f5;
                padding: 20px 30px;
                text-align: center;
                font-size: 12px;
                color: #666666;
            }}
            .expiry {{
                background-color: #FFF3CD;
                border: 1px solid #FFC107;
                border-radius: 6px;
                padding: 12px;
                margin: 20px 0;
                font-size: 14px;
                color: #856404;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 class="logo">APIRADx</h1>
            </div>
            <div class="content">
                <h1>Welcome to APIRADx!</h1>
                <p>Hi {recipient_name},</p>
                <p>Thank you for registering with APIRADx. We're excited to have you on board as part of our enterprise API security platform.</p>
                <p>To complete your registration and activate your account, please verify your email address by clicking the button below:</p>
                <a href="{verification_url}" class="button">Verify Email</a>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #5A4A33; font-size: 14px;">{verification_url}</p>
                <div class="expiry">
                    <strong>⚠️ Important:</strong> This verification link will expire in 24 hours. Please verify your email before then.
                </div>
                <p>If you didn't create an account with APIRADx, you can safely ignore this email.</p>
            </div>
            <div class="footer">
                <p>&copy; {datetime.now().year} APIRADx. All rights reserved.</p>
                <p>This is an automated email. Please do not reply to this message.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return MessageSchema(
        subject="Verify Your Email - APIRADx",
        recipients=[recipient_email],
        body=html_content,
        subtype=MessageType.html
    )


def create_password_reset_email(
    recipient_email: EmailStr,
    recipient_name: str,
    reset_token: str
) -> MessageSchema:
    """Create password reset message."""
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - APIRADx</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                background-color: #FFF6EA;
                margin: 0;
                padding: 20px;
                line-height: 1.6;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }}
            .header {{
                background-color: #5A4A33;
                padding: 30px;
                text-align: center;
            }}
            .logo {{
                font-size: 28px;
                font-weight: bold;
                color: #ffffff;
                margin: 0;
            }}
            .content {{
                padding: 40px 30px;
            }}
            h1 {{
                color: #5A4A33;
                font-size: 24px;
                margin-bottom: 20px;
            }}
            p {{
                color: #333333;
                font-size: 16px;
                margin-bottom: 20px;
            }}
            .button {{
                display: inline-block;
                padding: 14px 32px;
                background-color: #5A4A33;
                color: #ffffff;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                margin: 20px 0;
            }}
            .button:hover {{
                background-color: #4A3A23;
            }}
            .footer {{
                background-color: #f5f5f5;
                padding: 20px 30px;
                text-align: center;
                font-size: 12px;
                color: #666666;
            }}
            .expiry {{
                background-color: #FFF3CD;
                border: 1px solid #FFC107;
                border-radius: 6px;
                padding: 12px;
                margin: 20px 0;
                font-size: 14px;
                color: #856404;
            }}
            .warning {{
                background-color: #F8D7DA;
                border: 1px solid #F5C6CB;
                border-radius: 6px;
                padding: 12px;
                margin: 20px 0;
                font-size: 14px;
                color: #721C24;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 class="logo">APIRADx</h1>
            </div>
            <div class="content">
                <h1>Password Reset Request</h1>
                <p>Hi {recipient_name},</p>
                <p>We received a request to reset your password for your APIRADx account. If you made this request, please click the button below to reset your password:</p>
                <a href="{reset_url}" class="button">Reset Password</a>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #5A4A33; font-size: 14px;">{reset_url}</p>
                <div class="expiry">
                    <strong>⚠️ Important:</strong> This password reset link will expire in 30 minutes for your security.
                </div>
                <div class="warning">
                    <strong>Security Notice:</strong> If you didn't request a password reset, please ignore this email and your password will remain unchanged. You may want to secure your account by changing your password.
                </div>
            </div>
            <div class="footer">
                <p>&copy; {datetime.now().year} APIRADx. All rights reserved.</p>
                <p>This is an automated email. Please do not reply to this message.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return MessageSchema(
        subject="Reset Your Password - APIRADx",
        recipients=[recipient_email],
        body=html_content,
        subtype=MessageType.html
    )


async def send_verification_email(
    recipient_email: EmailStr,
    recipient_name: str,
    verification_token: str
):
    """Send verification email."""
    message = create_verification_email(recipient_email, recipient_name, verification_token)
    await fastmail.send_message(message)


async def send_password_reset_email(
    recipient_email: EmailStr,
    recipient_name: str,
    reset_token: str
):
    """Send password reset email."""
    message = create_password_reset_email(recipient_email, recipient_name, reset_token)
    await fastmail.send_message(message)
