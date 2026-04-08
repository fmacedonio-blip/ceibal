"""add_course_uuid

Revision ID: 9639de0a572a
Revises: b2dae5f3247c
Create Date: 2026-04-08 15:38:09.396463

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9639de0a572a'
down_revision: Union[str, Sequence[str], None] = 'b2dae5f3247c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('courses', sa.Column('course_uuid', sa.UUID(), nullable=True))
    op.execute("UPDATE courses SET course_uuid = gen_random_uuid() WHERE course_uuid IS NULL")
    op.alter_column('courses', 'course_uuid', nullable=False)
    op.create_unique_constraint('uq_courses_course_uuid', 'courses', ['course_uuid'])


def downgrade() -> None:
    op.drop_constraint('uq_courses_course_uuid', 'courses', type_='unique')
    op.drop_column('courses', 'course_uuid')
