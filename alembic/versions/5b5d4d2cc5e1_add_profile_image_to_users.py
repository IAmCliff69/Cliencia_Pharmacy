"""add profile image to users

Revision ID: 5b5d4d2cc5e1
Revises: 17dcdd8252a1
Create Date: 2026-09-16 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "5b5d4d2cc5e1"
down_revision: Union[str, Sequence[str], None] = "17dcdd8252a1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("profile_image_url", sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "profile_image_url")