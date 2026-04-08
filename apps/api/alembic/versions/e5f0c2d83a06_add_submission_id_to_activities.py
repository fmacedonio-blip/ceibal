"""add submission_id to activities

Revision ID: e5f0c2d83a06
Revises: d4e9b1c72f05
Create Date: 2026-04-08 00:00:00.000000

"""
from __future__ import annotations
from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "e5f0c2d83a06"
down_revision: Union[str, None] = "3e195500d64d"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "activities",
        sa.Column("submission_id", postgresql.UUID(as_uuid=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("activities", "submission_id")
