# diaspora/models.py
import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.contrib.auth.models import Group

User = get_user_model()

def default_diaspora_id():
    now = timezone.now()
    return f"HR-DIAS-{now.year}-{uuid.uuid4().hex[:4].upper()}"

class Office(models.Model):
    class OfficeType(models.TextChoices):
        DIASPORA = "DIASPORA", "Diaspora Office"
        INVESTMENT = "INVESTMENT", "Investment Bureau"
        LAND = "LAND", "City Land Management Bureau"
        NIGID = "NIGID", "Trade/License (Nigid)"
        OTHER = "OTHER", "Other"

    name = models.CharField(max_length=150, unique=True)
    code = models.CharField(max_length=20, unique=True)
    type = models.CharField(max_length=20, choices=OfficeType.choices)
    contact_email = models.EmailField(null=True, blank=True)
    contact_phone = models.CharField(max_length=20, null=True, blank=True)
    address = models.TextField(blank=True)

    def __str__(self): return f"{self.name} ({self.code})"


class Diaspora(models.Model):
    class Gender(models.TextChoices):
        MALE = "MALE", "Male"
        FEMALE = "FEMALE", "Female"
        OTHER = "OTHER", "Other"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    diaspora_id = models.CharField(max_length=40, unique=True, default=default_diaspora_id)

    # 🔗 attach to default auth.User
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="diaspora_profile")

    gender = models.CharField(max_length=10, choices=Gender.choices, null=True, blank=True)
    dob = models.DateField(null=True, blank=True)

    primary_phone = models.CharField(max_length=20, db_index=True, blank=True)
    whatsapp = models.CharField(max_length=20, null=True, blank=True)

    country_of_residence = models.CharField(max_length=80, blank=True)
    city_of_residence = models.CharField(max_length=120, null=True, blank=True)

    arrival_date = models.DateField(null=True, blank=True)
    expected_stay_duration = models.CharField(max_length=50, null=True, blank=True)
    is_returnee = models.BooleanField(default=False)

    preferred_language = models.CharField(max_length=30, default="English")
    communication_opt_in = models.BooleanField(default=True)

    address_local = models.TextField(null=True, blank=True)
    emergency_contact_name = models.CharField(max_length=120, null=True, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, null=True, blank=True)

    passport_no = models.CharField(max_length=50, null=True, blank=True, db_index=True)
    id_number = models.CharField(max_length=50, null=True, blank=True, db_index=True)

    owner_office = models.ForeignKey(Office, null=True, on_delete=models.SET_NULL, related_name="owned_diasporas")
    created_by = models.ForeignKey(User, null=True, on_delete=models.SET_NULL, related_name="created_diasporas")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def full_name(self):
        # source of truth = user
        return f"{(self.user.first_name or '').strip()} {(self.user.last_name or '').strip()}".strip() or (self.user.email or self.user.username)

    def __str__(self):
        return f"{self.full_name} ({self.diaspora_id})"


class Purpose(models.Model):
    class PurposeType(models.TextChoices):
        INVESTMENT = "INVESTMENT", "Investment"
        TOURISM = "TOURISM", "Tourism"
        FAMILY = "FAMILY", "Family"
        STUDY = "STUDY", "Study"
        CHARITY_NGO = "CHARITY_NGO", "Charity/NGO"
        OTHER = "OTHER", "Other"

    diaspora = models.ForeignKey(Diaspora, on_delete=models.CASCADE, related_name="purposes")
    type = models.CharField(max_length=20, choices=PurposeType.choices)
    description = models.TextField(blank=True)

    # investment fields
    sector = models.CharField(max_length=120, null=True, blank=True)
    sub_sector = models.CharField(max_length=120, null=True, blank=True)
    investment_type = models.CharField(max_length=80, null=True, blank=True)
    estimated_capital = models.DecimalField(max_digits=16, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=10, null=True, blank=True)
    jobs_expected = models.PositiveIntegerField(null=True, blank=True)
    land_requirement = models.BooleanField(default=False)
    land_size = models.FloatField(null=True, blank=True)
    preferred_location_note = models.CharField(max_length=200, null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[("DRAFT","Draft"),("SUBMITTED","Submitted"),("UNDER_REVIEW","Under Review"),
                 ("APPROVED","Approved"),("REJECTED","Rejected"),("ON_HOLD","On Hold")],
        default="DRAFT",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["type"]), models.Index(fields=["status"])]

    def __str__(self): return f"{self.get_type_display()} for {self.diaspora.full_name}"


class Case(models.Model):
    class Stage(models.TextChoices):
        INTAKE="INTAKE","Intake"; SCREENING="SCREENING","Screening"; REFERRAL="REFERRAL","Referral"
        PROCESSING="PROCESSING","Processing"; COMPLETED="COMPLETED","Completed"; CLOSED="CLOSED","Closed"
    class OverallStatus(models.TextChoices):
        ACTIVE="ACTIVE","Active"; PAUSED="PAUSED","Paused"; DONE="DONE","Completed"; REJECTED="REJECTED","Rejected"

    diaspora = models.OneToOneField(Diaspora, on_delete=models.CASCADE, related_name="case")
    current_stage = models.CharField(max_length=20, choices=Stage.choices, default=Stage.INTAKE)
    overall_status = models.CharField(max_length=20, choices=OverallStatus.choices, default=OverallStatus.ACTIVE)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Referral(models.Model):
    class ReferralStatus(models.TextChoices):
        SENT="SENT","Sent"; RECEIVED="RECEIVED","Received"; IN_PROGRESS="IN_PROGRESS","In Progress"
        COMPLETED="COMPLETED","Completed"; REJECTED="REJECTED","Rejected"

    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name="referrals")
    from_office = models.ForeignKey(Office, on_delete=models.PROTECT, related_name="sent_referrals")
    to_office = models.ForeignKey(Office, on_delete=models.PROTECT, related_name="received_referrals")
    reason = models.TextField(blank=True)
    payload_json = models.JSONField(default=dict, blank=True)

    status = models.CharField(max_length=20, choices=ReferralStatus.choices, default=ReferralStatus.SENT)
    received_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    sla_due_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    last_synced_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [models.Index(fields=["status"]), models.Index(fields=["to_office","status"])]

    def __str__(self): return f"{self.case_id} → {self.to_office.code} [{self.status}]"

class Announcement(models.Model):
    title       = models.CharField(max_length=200)
    content     = models.TextField()
    is_active   = models.BooleanField(default=True)
    is_for_internal = models.BooleanField(default=False)  # if True, only visible to staff users
    # audit
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)
    created_by  = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="ann_created")
    updated_by  = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="ann_updated")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title