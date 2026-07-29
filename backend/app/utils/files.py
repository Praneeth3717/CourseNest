# app/utils/files.py

from app.core.config import settings


def build_file_url(path: str | None) -> str | None:
    if not path:
        return None

    return f"{settings.BACKEND_URL}/{path}"