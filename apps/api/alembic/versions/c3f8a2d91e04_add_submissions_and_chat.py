"""add submissions and chat

Revision ID: c3f8a2d91e04
Revises: 56056c40e5b1
Create Date: 2026-04-08 00:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "c3f8a2d91e04"
down_revision: str | None = "56056c40e5b1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # --- submissions ---
    op.create_table(
        "submissions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("student_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("teacher_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("class_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("grade", sa.SmallInteger(), nullable=True),
        sa.Column("school_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("s3_key", sa.Text(), nullable=True),
        sa.Column(
            "submitted_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.Text(), nullable=False, server_default="pending"),
        sa.Column("total_errors", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("spelling_errors", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("concordance_errors", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("ambiguous_count", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("avg_confidence", sa.Numeric(4, 3), nullable=True),
        sa.Column("requires_review", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("lectura_insuficiente", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("ai_result", postgresql.JSONB(), nullable=True),
    )
    op.create_index("ix_submissions_student_id", "submissions", ["student_id"])
    op.create_index("ix_submissions_class_id", "submissions", ["class_id"])
    # Partial index: submissions pending review by class
    op.execute(
        "CREATE INDEX ix_submissions_class_requires_review ON submissions (class_id, requires_review) WHERE requires_review = true"
    )
    # GIN index on ai_result JSONB
    op.execute(
        "CREATE INDEX ix_submissions_ai_result_gin ON submissions USING gin (ai_result)"
    )

    # --- submission_errors ---
    op.create_table(
        "submission_errors",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "submission_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("submissions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("student_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("class_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("grade", sa.SmallInteger(), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("error_type", sa.Text(), nullable=False),
        sa.Column("error_text", sa.Text(), nullable=False),
        sa.Column("ocurrencias", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("confianza", sa.Numeric(4, 3), nullable=True),
        sa.Column("es_ambigua", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("requiere_revision", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.create_index("ix_submission_errors_submission_id", "submission_errors", ["submission_id"])
    op.create_index("ix_submission_errors_class_submitted_at", "submission_errors", ["class_id", "submitted_at"])
    op.create_index("ix_submission_errors_student_submitted_at", "submission_errors", ["student_id", "submitted_at"])
    op.create_index("ix_submission_errors_error_type_grade", "submission_errors", ["error_type", "grade"])

    # --- chat_sessions ---
    op.create_table(
        "chat_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "submission_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("submissions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("student_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "started_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("last_message_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("turn_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
    )
    op.create_index("ix_chat_sessions_submission_id", "chat_sessions", ["submission_id"])
    op.create_index("ix_chat_sessions_student_id", "chat_sessions", ["student_id"])

    # --- chat_messages ---
    op.create_table(
        "chat_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "session_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("chat_sessions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("role", sa.Text(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("tokens_used", sa.Integer(), nullable=True),
    )
    op.create_index("ix_chat_messages_session_id", "chat_messages", ["session_id"])


def downgrade() -> None:
    op.drop_table("chat_messages")
    op.drop_table("chat_sessions")
    op.drop_table("submission_errors")
    op.drop_table("submissions")
