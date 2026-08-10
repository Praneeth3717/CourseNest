import asyncio

from app.db.base import Base
from app.db.session import engine

from app.models import (
    User,
    Role,
    Student,
    Teacher,
    Course,
    Enrollment,
    ClassSession,
    Attendance,
    Certificate,
    Conversation,
    ChatMessage,
    StudentTokenQuota,
)


async def reset_database():
    async with engine.begin() as conn:
        print(Base.metadata.tables.keys())

        await conn.run_sync(Base.metadata.drop_all)


asyncio.run(reset_database())
