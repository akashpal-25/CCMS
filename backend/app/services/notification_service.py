import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from sqlalchemy.orm import Session
from app.models.notification import Notification

from app.core.config import settings


def send_email(to_email: str, subject: str, body: str) -> bool:
    try:
        message = MIMEMultipart()
        message["From"] = settings.SMTP_FROM_EMAIL
        message["To"] = to_email
        message["Subject"] = subject
        message.attach(MIMEText(body, "plain"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, to_email, message.as_string())

        return True
    except Exception as e:
        print(f"Email sending failed: {e}")
        return False


def send_otp_email(to_email: str, otp: str) -> bool:
    subject = "CCMS - Password Reset OTP"
    body = f"""
Hello,

Your OTP for password reset is: {otp}

This OTP is valid for 10 minutes. Do not share this OTP with anyone.

If you did not request this, please ignore this email.

- CCMS Team
"""
    return send_email(to_email, subject, body)


def create_notification(db: Session, user_id, complaint_id, notif_type: str, message: str):
    notification = Notification(
        user_id=user_id,
        complaint_id=complaint_id,
        type=notif_type,
        message=message,
    )
    db.add(notification)
    db.commit()
    return notification