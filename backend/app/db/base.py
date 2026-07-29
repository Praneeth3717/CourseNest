from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Any class inheriting from this is a database model/table
