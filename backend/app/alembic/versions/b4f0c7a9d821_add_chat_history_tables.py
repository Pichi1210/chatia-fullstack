"""Add chat history tables

Revision ID: b4f0c7a9d821
Revises: a7c4f2b91d03
Create Date: 2026-05-12 00:00:00.000000

"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "b4f0c7a9d821"
down_revision = "a7c4f2b91d03"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "chatsession",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(length=120), nullable=False),
        sa.Column("city", sa.String(length=120), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("owner_id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_chatsession_owner_id"),
        "chatsession",
        ["owner_id"],
        unique=False,
    )

    op.create_table(
        "chatmessage",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("chat_session_id", sa.UUID(), nullable=False),
        sa.Column("sender", sa.String(length=20), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("response_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["chat_session_id"],
            ["chatsession.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_chatmessage_chat_session_id"),
        "chatmessage",
        ["chat_session_id"],
        unique=False,
    )


def downgrade():
    op.drop_index(op.f("ix_chatmessage_chat_session_id"), table_name="chatmessage")
    op.drop_table("chatmessage")
    op.drop_index(op.f("ix_chatsession_owner_id"), table_name="chatsession")
    op.drop_table("chatsession")
