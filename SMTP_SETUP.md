# SMTP Setup Guide for APIRADx

This guide explains how to configure SMTP email sending for the APIRADx authentication system. The system uses FastAPI-Mail to send verification emails and password reset emails.

## Environment Variables

All SMTP configuration is done through environment variables in the backend `.env` file:

```env
# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM=noreply@apiradx.com
SMTP_FROM_NAME=APIRADx
SMTP_TLS=True
SMTP_SSL=False
```

## Gmail SMTP Setup (Production)

### Step 1: Enable 2-Factor Authentication

1. Go to [Google Account](https://myaccount.google.com)
2. Select **Security**
3. Under "Signing in to Google", enable **2-Step Verification**

### Step 2: Generate App Password

1. In the same Security section, click **App passwords**
2. Click **Select app** and choose **Mail**
3. Click **Select device** and choose your device
4. Click **Generate**
5. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### Step 3: Configure Environment Variables

Add the following to your backend `.env` file:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=abcd-efgh-ijkl-mnop
SMTP_FROM=noreply@apiradx.com
SMTP_FROM_NAME=APIRADx
SMTP_TLS=True
SMTP_SSL=False
```

### Important Notes

- **Never use your regular Gmail password** - use only the App Password
- App passwords are 16 characters long with spaces
- Remove spaces when copying to `.env` file
- Gmail has daily sending limits (500/day for free accounts)

## Mailtrap SMTP Setup (Development)

Mailtrap is a fake SMTP server for development and testing. It captures emails without actually sending them.

### Step 1: Create Mailtrap Account

1. Go to [Mailtrap](https://mailtrap.io)
2. Sign up for a free account
3. Create a new inbox

### Step 2: Get SMTP Credentials

1. Open your inbox in Mailtrap
2. Go to the **SMTP Settings** tab
3. Copy the credentials

### Step 3: Configure Environment Variables

Add the following to your backend `.env` file:

```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USERNAME=your-mailtrap-username
SMTP_PASSWORD=your-mailtrap-password
SMTP_FROM=noreply@apiradx.com
SMTP_FROM_NAME=APIRADx
SMTP_TLS=False
SMTP_SSL=False
```

### Important Notes

- Mailtrap is for development only
- Emails are captured in the Mailtrap dashboard
- Free tier has limited email capture
- Switch to real SMTP for production

## Other SMTP Providers

### Outlook/Office 365

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USERNAME=your-email@outlook.com
SMTP_PASSWORD=your-password
SMTP_TLS=True
SMTP_SSL=False
```

### SendGrid

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_TLS=True
SMTP_SSL=False
```

### Amazon SES

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USERNAME=your-aws-access-key-id
SMTP_PASSWORD=your-aws-secret-access-key
SMTP_TLS=True
SMTP_SSL=False
```

## SMTP Configuration Options

### TLS vs SSL

- **TLS (Transport Layer Security)**: Uses port 587, recommended for most providers
- **SSL (Secure Sockets Layer)**: Uses port 465, legacy but still supported

Set in `.env`:
```env
SMTP_TLS=True   # For TLS (port 587)
SMTP_SSL=False  # For SSL (port 465), set to True
```

### Common SMTP Ports

- **25**: Standard SMTP (not recommended, often blocked)
- **587**: Submission with TLS (recommended)
- **465**: SMTPS with SSL (legacy)
- **2525**: Mailtrap and some development servers

## Testing SMTP Configuration

### Test Email Sending

Create a simple test script in the backend directory:

```python
# test_email.py
from email_service import send_verification_email
from config import settings

async def test_email():
    try:
        await send_verification_email(
            recipient_email="test@example.com",
            recipient_name="Test User",
            verification_token="test-token-123"
        )
        print("Email sent successfully!")
    except Exception as e:
        print(f"Failed to send email: {e}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_email())
```

Run the test:
```bash
python test_email.py
```

## Troubleshooting

### Authentication Failed

- Verify username and password are correct
- For Gmail, ensure you're using an App Password (not regular password)
- Check if 2FA is enabled (required for App Passwords)

### Connection Timeout

- Verify SMTP_HOST and SMTP_PORT are correct
- Check firewall settings
- Ensure SMTP port is not blocked by your network

### SSL/TLS Errors

- Try switching between `SMTP_TLS` and `SMTP_SSL`
- Verify your SMTP provider supports the chosen protocol
- Check port matches the protocol (587 for TLS, 465 for SSL)

### Email Not Received

- Check spam/junk folders
- Verify `SMTP_FROM` email is valid
- Check daily sending limits for your provider
- Verify recipient email address is correct

### Gmail Sending Limits

Free Gmail accounts have limits:
- 500 emails per day
- 100 recipients per email
- Rate limiting may apply if sending too quickly

For higher limits, consider:
- Google Workspace (paid)
- Transactional email services (SendGrid, Mailgun, AWS SES)

## Security Best Practices

1. **Never commit `.env` file** to version control
2. **Use strong, unique passwords** for SMTP accounts
3. **Use App Passwords** for Gmail instead of regular passwords
4. **Rotate SMTP credentials** periodically
5. **Monitor email delivery** for bounce rates and spam complaints
6. **Use DKIM/SPF records** for production domains

## Production Recommendations

For production deployments, consider using a dedicated transactional email service:

- **SendGrid**: Reliable, good deliverability, free tier available
- **Mailgun**: Powerful API, good for developers
- **AWS SES**: Cost-effective at scale, integrates with AWS
- **Postmark**: Excellent deliverability, simple pricing

These services provide:
- Better deliverability rates
- Analytics and tracking
- Webhooks for events
- Dedicated IP addresses (paid plans)
- Dkim/SPF configuration

## Switching Between Environments

### Development (Mailtrap)

```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USERNAME=your-mailtrap-username
SMTP_PASSWORD=your-mailtrap-password
SMTP_TLS=False
```

### Production (Gmail)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_TLS=True
```

Use environment-specific `.env` files or a configuration management system to switch between environments.

## Email Templates

The system uses premium APIRADx branded HTML email templates:

- **Background**: #FFF6EA
- **Primary Color**: #5A4A33
- **Buttons**: Rounded with hover effects
- **Logo**: APIRADx branding
- **Responsive**: Mobile-friendly design

Templates are located in `backend/email_service.py`:
- `create_verification_email()`: Email verification template
- `create_password_reset_email()`: Password reset template

## Support

For issues with SMTP configuration:
1. Check the backend logs for error messages
2. Verify environment variables are loaded correctly
3. Test with a simple email client first
4. Contact your SMTP provider's support if needed
