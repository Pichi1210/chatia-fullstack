"""Add medical recommendation models

Revision ID: a7c4f2b91d03
Revises: fe56fa70289e
Create Date: 2026-05-06 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "a7c4f2b91d03"
down_revision = "fe56fa70289e"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "medicalinstitutiontype",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("urgency_level", sa.String(length=50), nullable=True),
        sa.Column("is_emergency_capable", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_medicalinstitutiontype_name"), "medicalinstitutiontype", ["name"], unique=True)

    op.create_table(
        "medicalservice",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", sa.String(length=100), nullable=True),
        sa.Column("requires_appointment", sa.Boolean(), nullable=False),
        sa.Column("is_emergency_service", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_medicalservice_category"), "medicalservice", ["category"], unique=False)
    op.create_index(op.f("ix_medicalservice_name"), "medicalservice", ["name"], unique=True)

    op.create_table(
        "medicalspecialty",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_medicalspecialty_name"), "medicalspecialty", ["name"], unique=True)

    op.create_table(
        "healthneed",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("urgency_level", sa.String(length=50), nullable=True),
        sa.Column("keywords", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_healthneed_name"), "healthneed", ["name"], unique=True)

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS medicalcenter (
            id SERIAL PRIMARY KEY,
            name VARCHAR NOT NULL,
            institution_type_id INTEGER NULL,
            city VARCHAR NULL,
            district VARCHAR NULL,
            address VARCHAR NULL,
            latitude DOUBLE PRECISION NULL,
            longitude DOUBLE PRECISION NULL,
            phone VARCHAR NULL,
            website VARCHAR NULL,
            working_hours VARCHAR NULL,
            rating DOUBLE PRECISION NULL,
            price_level VARCHAR NULL,
            has_emergency BOOLEAN NOT NULL DEFAULT false,
            is_public BOOLEAN NOT NULL DEFAULT false,
            description TEXT NULL,
            raw_data JSONB NULL,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
            updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
        )
        """
    )
    op.execute("ALTER TABLE medicalcenter ADD COLUMN IF NOT EXISTS institution_type_id INTEGER NULL")
    op.execute("ALTER TABLE medicalcenter ADD COLUMN IF NOT EXISTS district VARCHAR NULL")
    op.execute("ALTER TABLE medicalcenter ADD COLUMN IF NOT EXISTS website VARCHAR NULL")
    op.execute("ALTER TABLE medicalcenter ADD COLUMN IF NOT EXISTS price_level VARCHAR NULL")
    op.execute("ALTER TABLE medicalcenter ADD COLUMN IF NOT EXISTS has_emergency BOOLEAN NOT NULL DEFAULT false")
    op.execute("ALTER TABLE medicalcenter ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false")
    op.execute("ALTER TABLE medicalcenter ADD COLUMN IF NOT EXISTS description TEXT NULL")
    op.execute("CREATE INDEX IF NOT EXISTS ix_medicalcenter_name ON medicalcenter (name)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_medicalcenter_city ON medicalcenter (city)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_medicalcenter_institution_type_id ON medicalcenter (institution_type_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_medicalcenter_district ON medicalcenter (district)")
    op.create_foreign_key(
        "fk_medicalcenter_institution_type_id",
        "medicalcenter",
        "medicalinstitutiontype",
        ["institution_type_id"],
        ["id"],
    )

    op.create_table(
        "medicalcenterservice",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("medical_center_id", sa.Integer(), nullable=False),
        sa.Column("medical_service_id", sa.Integer(), nullable=False),
        sa.Column("available", sa.Boolean(), nullable=False),
        sa.Column("price_estimate", sa.String(), nullable=True),
        sa.Column("appointment_required", sa.Boolean(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["medical_center_id"], ["medicalcenter.id"]),
        sa.ForeignKeyConstraint(["medical_service_id"], ["medicalservice.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_medicalcenterservice_medical_center_id"), "medicalcenterservice", ["medical_center_id"], unique=False)
    op.create_index(op.f("ix_medicalcenterservice_medical_service_id"), "medicalcenterservice", ["medical_service_id"], unique=False)

    op.create_table(
        "medicalcenterspecialty",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("medical_center_id", sa.Integer(), nullable=False),
        sa.Column("medical_specialty_id", sa.Integer(), nullable=False),
        sa.Column("available", sa.Boolean(), nullable=False),
        sa.Column("doctor_count", sa.Integer(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["medical_center_id"], ["medicalcenter.id"]),
        sa.ForeignKeyConstraint(["medical_specialty_id"], ["medicalspecialty.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_medicalcenterspecialty_medical_center_id"), "medicalcenterspecialty", ["medical_center_id"], unique=False)
    op.create_index(op.f("ix_medicalcenterspecialty_medical_specialty_id"), "medicalcenterspecialty", ["medical_specialty_id"], unique=False)

    op.create_table(
        "needservicerule",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("health_need_id", sa.Integer(), nullable=False),
        sa.Column("recommended_service_id", sa.Integer(), nullable=True),
        sa.Column("recommended_specialty_id", sa.Integer(), nullable=True),
        sa.Column("recommended_institution_type_id", sa.Integer(), nullable=True),
        sa.Column("priority", sa.Integer(), nullable=False),
        sa.Column("urgency_required", sa.String(length=50), nullable=True),
        sa.Column("explanation", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["health_need_id"], ["healthneed.id"]),
        sa.ForeignKeyConstraint(["recommended_institution_type_id"], ["medicalinstitutiontype.id"]),
        sa.ForeignKeyConstraint(["recommended_service_id"], ["medicalservice.id"]),
        sa.ForeignKeyConstraint(["recommended_specialty_id"], ["medicalspecialty.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_needservicerule_health_need_id"), "needservicerule", ["health_need_id"], unique=False)
    op.create_index(op.f("ix_needservicerule_priority"), "needservicerule", ["priority"], unique=False)
    op.create_index(op.f("ix_needservicerule_recommended_institution_type_id"), "needservicerule", ["recommended_institution_type_id"], unique=False)
    op.create_index(op.f("ix_needservicerule_recommended_service_id"), "needservicerule", ["recommended_service_id"], unique=False)
    op.create_index(op.f("ix_needservicerule_recommended_specialty_id"), "needservicerule", ["recommended_specialty_id"], unique=False)

    op.create_table(
        "triagequestion",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("health_need_id", sa.Integer(), nullable=False),
        sa.Column("question_text", sa.Text(), nullable=False),
        sa.Column("answer_type", sa.String(length=50), nullable=False),
        sa.Column("priority", sa.Integer(), nullable=False),
        sa.Column("is_required", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["health_need_id"], ["healthneed.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_triagequestion_health_need_id"), "triagequestion", ["health_need_id"], unique=False)
    op.create_index(op.f("ix_triagequestion_priority"), "triagequestion", ["priority"], unique=False)

    op.create_table(
        "recommendationrule",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("health_need_id", sa.Integer(), nullable=False),
        sa.Column("min_risk_score", sa.Integer(), nullable=False),
        sa.Column("max_risk_score", sa.Integer(), nullable=False),
        sa.Column("recommended_institution_type_id", sa.Integer(), nullable=True),
        sa.Column("recommended_service_id", sa.Integer(), nullable=True),
        sa.Column("recommended_specialty_id", sa.Integer(), nullable=True),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("priority", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["health_need_id"], ["healthneed.id"]),
        sa.ForeignKeyConstraint(["recommended_institution_type_id"], ["medicalinstitutiontype.id"]),
        sa.ForeignKeyConstraint(["recommended_service_id"], ["medicalservice.id"]),
        sa.ForeignKeyConstraint(["recommended_specialty_id"], ["medicalspecialty.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_recommendationrule_health_need_id"), "recommendationrule", ["health_need_id"], unique=False)
    op.create_index(op.f("ix_recommendationrule_priority"), "recommendationrule", ["priority"], unique=False)
    op.create_index(op.f("ix_recommendationrule_recommended_institution_type_id"), "recommendationrule", ["recommended_institution_type_id"], unique=False)
    op.create_index(op.f("ix_recommendationrule_recommended_service_id"), "recommendationrule", ["recommended_service_id"], unique=False)
    op.create_index(op.f("ix_recommendationrule_recommended_specialty_id"), "recommendationrule", ["recommended_specialty_id"], unique=False)

    op.create_table(
        "triageansweroption",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("question_id", sa.Integer(), nullable=False),
        sa.Column("option_text", sa.Text(), nullable=False),
        sa.Column("risk_score", sa.Integer(), nullable=False),
        sa.Column("next_question_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["next_question_id"], ["triagequestion.id"]),
        sa.ForeignKeyConstraint(["question_id"], ["triagequestion.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_triageansweroption_next_question_id"), "triageansweroption", ["next_question_id"], unique=False)
    op.create_index(op.f("ix_triageansweroption_question_id"), "triageansweroption", ["question_id"], unique=False)


def downgrade():
    op.drop_index(op.f("ix_triageansweroption_question_id"), table_name="triageansweroption")
    op.drop_index(op.f("ix_triageansweroption_next_question_id"), table_name="triageansweroption")
    op.drop_table("triageansweroption")
    op.drop_index(op.f("ix_recommendationrule_recommended_specialty_id"), table_name="recommendationrule")
    op.drop_index(op.f("ix_recommendationrule_recommended_service_id"), table_name="recommendationrule")
    op.drop_index(op.f("ix_recommendationrule_recommended_institution_type_id"), table_name="recommendationrule")
    op.drop_index(op.f("ix_recommendationrule_priority"), table_name="recommendationrule")
    op.drop_index(op.f("ix_recommendationrule_health_need_id"), table_name="recommendationrule")
    op.drop_table("recommendationrule")
    op.drop_index(op.f("ix_triagequestion_priority"), table_name="triagequestion")
    op.drop_index(op.f("ix_triagequestion_health_need_id"), table_name="triagequestion")
    op.drop_table("triagequestion")
    op.drop_index(op.f("ix_needservicerule_recommended_specialty_id"), table_name="needservicerule")
    op.drop_index(op.f("ix_needservicerule_recommended_service_id"), table_name="needservicerule")
    op.drop_index(op.f("ix_needservicerule_recommended_institution_type_id"), table_name="needservicerule")
    op.drop_index(op.f("ix_needservicerule_priority"), table_name="needservicerule")
    op.drop_index(op.f("ix_needservicerule_health_need_id"), table_name="needservicerule")
    op.drop_table("needservicerule")
    op.drop_index(op.f("ix_medicalcenterspecialty_medical_specialty_id"), table_name="medicalcenterspecialty")
    op.drop_index(op.f("ix_medicalcenterspecialty_medical_center_id"), table_name="medicalcenterspecialty")
    op.drop_table("medicalcenterspecialty")
    op.drop_index(op.f("ix_medicalcenterservice_medical_service_id"), table_name="medicalcenterservice")
    op.drop_index(op.f("ix_medicalcenterservice_medical_center_id"), table_name="medicalcenterservice")
    op.drop_table("medicalcenterservice")
    op.drop_constraint("fk_medicalcenter_institution_type_id", "medicalcenter", type_="foreignkey")
    op.drop_index(op.f("ix_medicalcenter_district"), table_name="medicalcenter")
    op.drop_index(op.f("ix_medicalcenter_institution_type_id"), table_name="medicalcenter")
    op.drop_column("medicalcenter", "description")
    op.drop_column("medicalcenter", "is_public")
    op.drop_column("medicalcenter", "has_emergency")
    op.drop_column("medicalcenter", "price_level")
    op.drop_column("medicalcenter", "website")
    op.drop_column("medicalcenter", "district")
    op.drop_column("medicalcenter", "institution_type_id")
    op.drop_index(op.f("ix_healthneed_name"), table_name="healthneed")
    op.drop_table("healthneed")
    op.drop_index(op.f("ix_medicalspecialty_name"), table_name="medicalspecialty")
    op.drop_table("medicalspecialty")
    op.drop_index(op.f("ix_medicalservice_name"), table_name="medicalservice")
    op.drop_index(op.f("ix_medicalservice_category"), table_name="medicalservice")
    op.drop_table("medicalservice")
    op.drop_index(op.f("ix_medicalinstitutiontype_name"), table_name="medicalinstitutiontype")
    op.drop_table("medicalinstitutiontype")
