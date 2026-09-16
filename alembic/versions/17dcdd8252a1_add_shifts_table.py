"""add shifts table

Revision ID: 17dcdd8252a1
Revises: 440e1333c245
Create Date: 2026-09-15 23:55:53.769603

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '17dcdd8252a1'
down_revision: Union[str, Sequence[str], None] = '440e1333c245'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table(
        "shifts",
        sa.Column("shift_id", sa.Integer(), primary_key=True, index=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.user_id"), nullable=False),
        sa.Column("opened_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("closed_at", sa.DateTime(), nullable=True),
        sa.Column("status", sa.String(10), nullable=False, server_default="open"),
    )


def downgrade() -> None:
    op.drop_table("shifts")