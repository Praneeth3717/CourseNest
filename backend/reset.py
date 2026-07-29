import asyncio

from app.db.base import Base
from app.db.session import engine

from app.models.user import User
from app.models.role import Role
from app.models.student import Student
from app.models.teacher import Teacher
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.classSession import ClassSession
from app.models.attendance import Attendance
from app.models.certificate import Certificate
from app.models.conversation import Conversation
from app.models.chat_message import ChatMessage
from app.models.student_token_quota import StudentTokenQuota


async def reset_database():
    async with engine.begin() as conn:
        print(Base.metadata.tables.keys())

        await conn.run_sync(Base.metadata.drop_all)


asyncio.run(reset_database())
