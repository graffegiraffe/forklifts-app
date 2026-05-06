"""Initial schema: forklifts and incidents

Revision ID: 0001
Revises:
Create Date: 2026-05-06
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "forklifts",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("brand", sa.String(length=255), nullable=False),
        sa.Column("number", sa.String(length=255), nullable=False),
        sa.Column("load_capacity", sa.Numeric(precision=10, scale=3), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("modified_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("modified_by", sa.String(length=255), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "incidents",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("forklift_id", sa.Integer(), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["forklift_id"], ["forklifts.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index("ix_forklifts_number", "forklifts", ["number"])
    op.create_index("ix_incidents_forklift_id", "incidents", ["forklift_id"])
    op.create_index("ix_incidents_started_at", "incidents", ["started_at"])


def downgrade() -> None:
    op.drop_index("ix_incidents_started_at", table_name="incidents")
    op.drop_index("ix_incidents_forklift_id", table_name="incidents")
    op.drop_index("ix_forklifts_number", table_name="forklifts")
    op.drop_table("incidents")
    op.drop_table("forklifts")
