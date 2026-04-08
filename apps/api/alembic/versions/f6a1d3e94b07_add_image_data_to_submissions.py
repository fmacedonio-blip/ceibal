"""add image_data to submissions

Revision ID: f6a1d3e94b07
Revises: e5f0c2d83a06
Create Date: 2026-04-08 00:00:00.000000

"""
from __future__ import annotations
from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = "f6a1d3e94b07"
down_revision: Union[str, None] = "e5f0c2d83a06"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("submissions", sa.Column("image_data", sa.LargeBinary(), nullable=True))
    op.add_column("submissions", sa.Column("image_content_type", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("submissions", "image_content_type")
    op.drop_column("submissions", "image_data")
