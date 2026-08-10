from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.db.base import Base
from app.db.session import engine, AsyncSessionLocal

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

from app.seed_data.seed import run_seed

from app.api.routes import (
    auth,
    role,
    students,
    teachers,
    course,
    enrollment,
    classSession,
    attendance,
    admin,
    chat,
)

app = FastAPI(title="ChatBot")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.on_event("startup")
async def startup():
    await init_db()

    async with AsyncSessionLocal() as db:
        await run_seed(db)


app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(role.router)
app.include_router(auth.router)
app.include_router(teachers.router)
app.include_router(students.router)
app.include_router(course.router)
app.include_router(enrollment.router)
app.include_router(classSession.router)
app.include_router(attendance.router)
app.include_router(admin.router)
app.include_router(chat.router)
