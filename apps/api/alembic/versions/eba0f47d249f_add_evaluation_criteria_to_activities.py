"""add_evaluation_criteria_to_activities

Revision ID: eba0f47d249f
Revises: f6a1d3e94b07
Create Date: 2026-04-09 00:55:42.303430

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'eba0f47d249f'
down_revision: Union[str, Sequence[str], None] = 'f6a1d3e94b07'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('activities', sa.Column('evaluation_criteria', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('activities', 'evaluation_criteria')
