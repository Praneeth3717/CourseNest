# app/utils/files.py

import os
from app.core.config import settings


def build_file_url(path: str | None) -> str | None:
    if not path:
        return None

    return f"{settings.BACKEND_URL}/{path}"


def delete_file(file_path: str | None) -> None:
    if not file_path:
        return

    if os.path.exists(file_path):
        os.remove(file_path)
