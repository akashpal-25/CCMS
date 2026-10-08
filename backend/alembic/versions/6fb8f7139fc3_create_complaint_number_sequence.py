"""create complaint number sequence

Revision ID: 6fb8f7139fc3
Revises: 23ec1dfa2a0c
Create Date: 2026-09-08 13:50:00.479784

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6fb8f7139fc3'
down_revision: Union[str, Sequence[str], None] = '23ec1dfa2a0c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE SEQUENCE complaint_number_seq START 1;")


def downgrade() -> None:
    op.execute("DROP SEQUENCE complaint_number_seq;")
