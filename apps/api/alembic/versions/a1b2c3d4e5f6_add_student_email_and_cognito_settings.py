"""add_student_email

Revision ID: a1b2c3d4e5f6
Revises: eba0f47d249f
Create Date: 2026-04-09 12:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "eba0f47d249f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("students", sa.Column("email", sa.String(), nullable=True))
    op.create_index(op.f("ix_students_email"), "students", ["email"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_students_email"), table_name="students")
    op.drop_column("students", "email")
