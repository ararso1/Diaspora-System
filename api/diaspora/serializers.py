# diaspora/serializers.py
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework import serializers
from .models import Office, Diaspora, Purpose, Case, Referral, Announcement

User = get_user_model()

# --- Slim user exposure for read ---
class UserSlimSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "date_joined"]
        read_only_fields = fields


class OfficeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Office
        fields = "__all__"


# --- Diaspora read serializer (includes user fields) ---
class DiasporaSerializer(serializers.ModelSerializer):
    user = UserSlimSerializer(read_only=True)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Diaspora
        fields = [
            "id", "diaspora_id", "user", "full_name",
            "gender", "dob",
            "primary_phone", "whatsapp",
            "country_of_residence", "city_of_residence",
            "arrival_date", "expected_stay_duration", "is_returnee",
            "preferred_language", "communication_opt_in",
            "address_local", "emergency_contact_name", "emergency_contact_phone",
            "passport_no", "id_number",
            "owner_office", "created_by",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "diaspora_id", "created_at", "updated_at", "created_by"]


# --- Nested write serializer for registration / update ---
class UserForDiasporaWriteSerializer(serializers.Serializer):
    """
    Minimal subset to create or update the auth.User associated with Diaspora.
    If 'id' is provided, we'll attach to an existing user; otherwise we create.
    """
    id = serializers.IntegerField(required=False)
    username = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(required=False, write_only=True, allow_blank=True)


class DiasporaWriteSerializer(serializers.ModelSerializer):
    user = UserForDiasporaWriteSerializer(write_only=True)

    class Meta:
        model = Diaspora
        fields = [
            "id", "diaspora_id", "user",
            "gender", "dob",
            "primary_phone", "whatsapp",
            "country_of_residence", "city_of_residence",
            "arrival_date", "expected_stay_duration", "is_returnee",
            "preferred_language", "communication_opt_in",
            "address_local", "emergency_contact_name", "emergency_contact_phone",
            "passport_no", "id_number",
            "owner_office",
        ]
        read_only_fields = ["id", "diaspora_id"]

    def _ensure_diaspora_group(self, user: User):
        try:
            grp, _ = Group.objects.get_or_create(name="Diaspora")
            user.groups.add(grp)
        except Exception:
            # If groups app not migrated yet, ignore silently
            pass

    def create(self, validated_data):
        user_data = validated_data.pop("user", {})
        user_id = user_data.get("id")

        if user_id:
            user = User.objects.get(pk=user_id)
            for f in ["email", "first_name", "last_name", "username"]:
                val = user_data.get(f)
                if val:
                    setattr(user, f, val)
            if user_data.get("password"):
                user.set_password(user_data["password"])
            else:
                user.set_password("123456")
            user.save()
        else:
            # If username missing, use email as username
            username = user_data.get("username") or user_data.get("email")
            
            # Generate random password if not provided
            password = user_data.get("password") or "123456"
            
            user = User.objects.create_user(
                username=username,
                email=user_data.get("email"),
                password=password,
                first_name=user_data.get("first_name", ""),
                last_name=user_data.get("last_name", ""),
            )
            self._ensure_diaspora_group(user)

        request = self.context.get("request")
        created_by = request.user if request and request.user.is_authenticated else None

        diaspora = Diaspora.objects.create(user=user, created_by=created_by, **validated_data)
        return diaspora

    def to_representation(self, instance):
        # After create/update, return the read serializer structure
        return DiasporaSerializer(instance, context=self.context).data


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

class AnnouncementSerializer(serializers.ModelSerializer):

    class Meta:
        model = Announcement
        fields = [
            "id", "title", "content", "is_active",
            "created_at", "updated_at", "created_by", "updated_by",
        ]
        read_only_fields = ["created_at", "updated_at", "created_by", "updated_by"]