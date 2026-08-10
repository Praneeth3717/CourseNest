from enum import Enum


class RoleEnum(str, Enum):
    ADMIN = "Admin"
    TEACHER = "Teacher"
    STUDENT = "Student"


class GenderEnum(str, Enum):
    MALE = "Male"
    FEMALE = "Female"
    OTHER = "Other"


class CourseStatus(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"


class SessionStatusEnum(str, Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"


class AttendanceStatus(str, Enum):
    PRESENT = "present"
    ABSENT = "absent"


class ChatRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
