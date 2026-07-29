from fastapi_mail import FastMail, MessageSchema, ConnectionConfig

from app.core.config import settings

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=True,
)


async def send_password_setup_email(email: str, setup_link: str):
    message = MessageSchema(
        subject="Set Your Password",
        recipients=[email],
        body=f"""
Hello,

Your account has been created successfully.

Please click the link below to set your password:

{setup_link}

This link will expire in 1 hour.

If you did not expect this email, you can ignore it.
        """,
        subtype="plain",
    )

    fm = FastMail(conf)

    await fm.send_message(message)


async def send_password_reset_email(email: str, reset_link: str):
    message = MessageSchema(
        subject="Reset Your Password",
        recipients=[email],
        body=f"""
Hello,

We received a request to reset your password.

Click the link below to reset it:

{reset_link}

This link expires in 1 hour.

If you did not request this, you can ignore this email.
        """,
        subtype="plain",
    )

    fm = FastMail(conf)

    await fm.send_message(message)
