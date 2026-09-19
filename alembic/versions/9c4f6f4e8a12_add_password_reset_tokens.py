"""add password reset tokens

Revision ID: 9c4f6f4e8a12
Revises: 440e1333c245
Create Date: 2026-09-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9c4f6f4e8a12"
down_revision: Union[str, Sequence[str], None] = "5b5d4d2cc5e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("password_reset_token_hash", sa.String(length=64), nullable=True),
    )
    op.create_unique_constraint(
        "uq_users_password_reset_token_hash",
        "users",
        ["password_reset_token_hash"],
    )
    op.add_column(
        "users",
        sa.Column("password_reset_expires_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "password_reset_expires_at")
    op.drop_constraint(
        "uq_users_password_reset_token_hash",
        "users",
        type_="unique",
    )
    op.drop_column("users", "password_reset_token_hash")
