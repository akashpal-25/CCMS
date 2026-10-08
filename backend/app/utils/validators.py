import re


def validate_password_strength(password: str) -> list[str]:
    """
    Returns a list of error messages.
    Empty list means password is valid.
    """
    errors = []

    if len(password) < 8:
        errors.append("Password must be at least 8 characters long.")
    if not re.search(r"[A-Z]", password):
        errors.append("Password must contain at least one uppercase letter.")
    if not re.search(r"[a-z]", password):
        errors.append("Password must contain at least one lowercase letter.")
    if not re.search(r"[0-9]", password):
        errors.append("Password must contain at least one number.")
    if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]", password):
        errors.append("Password must contain at least one special character.")

    return errors

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "application/pdf"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf"}


def validate_file(filename: str, content_type: str, file_size: int, max_size_mb: int) -> list[str]:
    errors = []
    import os

    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        errors.append(f"File type '{ext}' not allowed. Allowed: JPG, PNG, PDF.")

    if content_type not in ALLOWED_MIME_TYPES:
        errors.append("Invalid file content type.")

    max_bytes = max_size_mb * 1024 * 1024
    if file_size > max_bytes:
        errors.append(f"File size exceeds {max_size_mb}MB limit.")

    return errors