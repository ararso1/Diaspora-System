# diaspora/serializers.py
from rest_framework import serializers
from .models import Office, Diaspora, Purpose, Case, Referral


class OfficeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Office
        fields = "__all__"


class PurposeSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source="get_type_display", read_only=True)

    class Meta:
        model = Purpose
        fields = [
            "id", "diaspora", "type", "type_display", "description",
            "sector", "sub_sector", "investment_type", "estimated_capital",
            "currency", "jobs_expected", "land_requirement", "land_size",
            "preferred_location_note", "status", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class DiasporaSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    purposes = PurposeSerializer(many=True, read_only=True)

    class Meta:
        model = Diaspora
        fields = [
            "id", "diaspora_id", "first_name", "last_name", "full_name",
            "gender", "dob",
            "primary_phone", "email", "whatsapp",
            "country_of_residence", "city_of_residence",
            "arrival_date", "expected_stay_duration", "is_returnee",
            "preferred_language", "communication_opt_in",
            "address_local", "emergency_contact_name", "emergency_contact_phone",
            "passport_no", "id_number",
            "owner_office", "created_by",
            "created_at", "updated_at", "purposes",
        ]
        read_only_fields = ["id", "diaspora_id", "created_at", "updated_at"]


class CaseSerializer(serializers.ModelSerializer):
    diaspora = DiasporaSerializer(read_only=True)
    diaspora_id = serializers.PrimaryKeyRelatedField(
        source="diaspora",
        queryset=Diaspora.objects.all(),
        write_only=True,
        required=True,
    )

    class Meta:
        model = Case
        fields = ["id", "diaspora", "diaspora_id", "current_stage", "overall_status", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class ReferralSerializer(serializers.ModelSerializer):
    class Meta:
        model = Referral
        fields = [
            "id", "case", "from_office", "to_office", "reason",
            "payload_json", "status", "received_at", "completed_at",
            "sla_due_at", "created_at", "last_synced_at",
        ]
        read_only_fields = ["id", "created_at", "last_synced_at"]
