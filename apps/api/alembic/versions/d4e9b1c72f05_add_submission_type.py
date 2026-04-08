"""add submission_type to submissions

Revision ID: d4e9b1c72f05
Revises: c3f8a2d91e04
Create Date: 2026-04-08 00:00:00.000000

"""
from __future__ import annotations
from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = "d4e9b1c72f05"
down_revision: Union[str, None] = "c3f8a2d91e04"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "submissions",
        sa.Column("submission_type", sa.Text(), nullable=False, server_default="handwrite"),
    )


def downgrade() -> None:
    op.drop_column("submissions", "submission_type")
