from uuid import UUID
from datetime import datetime, date
from pydantic import BaseModel, EmailStr, Field

from app.models.student import GenderEnum

from app.constants.roles import RoleEnum


class MessageResponse(BaseModel):
    message: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class AccessTokenRequest(BaseModel):
    refresh_token: str


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class PasswordTokenRequest(BaseModel):
    token: str
    password: str = Field(min_length=6, max_length=128)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6, max_length=128)


class TeacherProfileResponse(BaseModel):
    id: UUID
    user_id: UUID
    full_name: str
    phone: str | None
    dob: date | None
    gender: GenderEnum | None
    specialization: str | None
    qualification: str | None
    experience_years: int | None
    address: str | None
    profile_image: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class StudentProfileResponse(BaseModel):
    id: UUID
    user_id: UUID
    full_name: str
    phone: str | None
    dob: date | None
    gender: GenderEnum | None
    address: str | None
    profile_image: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class CurrentUserResponse(BaseModel):
    id: UUID
    email: EmailStr
    role: RoleEnum
    is_active: bool
    created_at: datetime

    profile: TeacherProfileResponse | StudentProfileResponse | None
