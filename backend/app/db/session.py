from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL, echo=settings.ENV == "development"
)  # echo=True means Shows SQL queries in terminal

AsyncSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


# After commit, SQLAlchemy normally “expires” objects, meaning it may need to re-fetch them.

# user = User(email="a@b.com")
# session.add(user)
# await session.commit()
# print(user.email)

# If expired, SQLAlchemy may re-query DB, so with false Objects stay usable after commit
