from enum import Enum


class RoleEnum(str, Enum):
    ADMIN = "Admin"
    TEACHER = "Teacher"
    STUDENT = "Student"
