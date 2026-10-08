"""create employee id sequence

Revision ID: 842fffcf7ade
Revises: b40d95f56de5
Create Date: 2026-09-30 04:46:48.333230

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '842fffcf7ade'
down_revision: Union[str, Sequence[str], None] = 'b40d95f56de5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("CREATE SEQUENCE staff_employee_id_seq START 1;")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DROP SEQUENCE staff_employee_id_seq;")
