"""add_activity_reading_text

Revision ID: 3e195500d64d
Revises: 9639de0a572a
Create Date: 2026-04-08 16:41:05.477612

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3e195500d64d'
down_revision: Union[str, Sequence[str], None] = '9639de0a572a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('activities', sa.Column('reading_text', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('activities', 'reading_text')
