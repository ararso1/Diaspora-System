# diaspora/serializers.py
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import Office, Diaspora, Purpose, Case, Referral


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'password2', 'email', 'first_name', 'last_name')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    """
    Serializer for user login that accepts either username or email
    """
    identifier = serializers.CharField(
        label="Username or Email",
        help_text="Enter your username or email address"
    )
    password = serializers.CharField(
        label="Password",
        style={'input_type': 'password'},
        help_text="Enter your password"
    )

    def validate(self, attrs):
        identifier = attrs.get('identifier')
        password = attrs.get('password')

        if identifier and password:
            # Use Django's authenticate to ensure backend is attached to user
            user = authenticate(
                request=self.context.get('request'),
                username=identifier,
                password=password,
            )
            
            if not user:
                raise serializers.ValidationError(
                    "Unable to log in with provided credentials."
                )
            
            if not user.is_active:
                raise serializers.ValidationError(
                    "User account is disabled."
                )
            
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError(
                "Must include 'identifier' and 'password'."
            )


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_active']
        read_only_fields = ['id']


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
