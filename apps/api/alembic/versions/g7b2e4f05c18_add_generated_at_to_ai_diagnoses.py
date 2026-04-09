"""add generated_at to ai_diagnoses

Revision ID: g7b2e4f05c18
Revises: eba0f47d249f
Create Date: 2026-04-09 00:00:00.000000

"""
from __future__ import annotations
from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = "g7b2e4f05c18"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "ai_diagnoses",
        sa.Column("generated_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("ai_diagnoses", "generated_at")
