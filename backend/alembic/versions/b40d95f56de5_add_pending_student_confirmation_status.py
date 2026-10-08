"""add pending student confirmation status

Revision ID: b40d95f56de5
Revises: c9fae5e5658a
Create Date: 2026-09-22 14:17:16.420627

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b40d95f56de5'
down_revision: Union[str, Sequence[str], None] = 'c9fae5e5658a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TYPE complaint_status ADD VALUE IF NOT EXISTS 'PENDING_STUDENT_CONFIRMATION';")


def downgrade() -> None:
    """Downgrade schema."""
    pass  # PostgreSQL me enum se value remove karna directly possible nahi hai, isliye downgrade khali hai
