"""add_student_uuid_and_activity_fields

Revision ID: b2dae5f3247c
Revises: d4e9b1c72f05
Create Date: 2026-04-08 15:05:19.848788

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2dae5f3247c'
down_revision: Union[str, Sequence[str], None] = 'd4e9b1c72f05'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add description, type, subject to activities
    op.add_column('activities', sa.Column('description', sa.Text(), nullable=True))
    op.add_column('activities', sa.Column('type', sa.String(), nullable=True))
    op.add_column('activities', sa.Column('subject', sa.String(), nullable=True))
    op.execute("UPDATE activities SET subject = 'Lengua' WHERE subject IS NULL")
    op.alter_column('activities', 'subject', nullable=False)

    # Add student_uuid to students (nullable first, then fill, then set unique+not null)
    op.add_column('students', sa.Column('student_uuid', sa.UUID(), nullable=True))
    op.execute("UPDATE students SET student_uuid = gen_random_uuid() WHERE student_uuid IS NULL")
    op.alter_column('students', 'student_uuid', nullable=False)
    op.create_unique_constraint('uq_students_student_uuid', 'students', ['student_uuid'])


def downgrade() -> None:
    op.drop_constraint('uq_students_student_uuid', 'students', type_='unique')
    op.drop_column('students', 'student_uuid')
    op.drop_column('activities', 'subject')
    op.drop_column('activities', 'type')
    op.drop_column('activities', 'description')
