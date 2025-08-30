# diaspora/management/commands/seed_diaspora.py
import uuid
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.utils import timezone

from diaspora.models import Office, Diaspora, Purpose, Case, Referral

User = get_user_model()


class Command(BaseCommand):
    help = "Seed 5 records for each table: Office, User, Diaspora, Purpose, Case, Referral."

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("Seeding diaspora demo data…"))

        # 1) Groups
        diaspora_group, _ = Group.objects.get_or_create(name="Diaspora")
        officer_group, _ = Group.objects.get_or_create(name="Officer")

        # 2) Offices (5)
        offices_def = [
            ("Harari Diaspora Office", "HRO-DIAS", Office.OfficeType.DIASPORA),
            ("Investment Bureau", "HRO-INV", Office.OfficeType.INVESTMENT),
            ("City Land Management", "HRO-LAND", Office.OfficeType.LAND),
            ("Nigid / Trade License", "HRO-NIGID", Office.OfficeType.NIGID),
            ("Regional ICT Office", "HRO-ICT", Office.OfficeType.OTHER),
        ]
        offices = []
        for name, code, otype in offices_def:
            office, _ = Office.objects.get_or_create(
                code=code,
                defaults=dict(name=name, type=otype, contact_email=f"{code.lower()}@example.com"),
            )
            # ensure fields are up to date
            office.name = name
            office.type = otype
            office.save()
            offices.append(office)
        diaspora_office = offices[0]
        invest_office = offices[1]
        land_office = offices[2]
        nigid_office = offices[3]
        ict_office = offices[4]

        # 3) Users (5) – all Diaspora users
        base_users = [
            ("lensa", "lensa.m", "lensa.m@example.com", "Lensa", "Mohammed"),
            ("yonas", "yonas.t", "yonas.t@example.com", "Yonas", "Tesfaye"),
            ("hanna", "hanna.a", "hanna.a@example.com", "Hanna", "Abdella"),
            ("michael", "michael.k", "michael.k@example.com", "Michael", "Kedir"),
            ("samira", "samira.b", "samira.b@example.com", "Samira", "Beker"),
        ]
        users = []
        for uname, username, email, first, last in base_users:
            user, created = User.objects.get_or_create(
                username=username,
                defaults=dict(email=email, first_name=first, last_name=last),
            )
            if created:
                user.set_password("Pass12345!")  # demo password
            else:
                # ensure consistent demo names/emails if they changed
                user.email = email
                user.first_name = first
                user.last_name = last
            user.save()
            user.groups.add(diaspora_group)  # mark as Diaspora
            users.append(user)

        # 4) Diasporas (5) – link 1–1 to users
        # Make dates distributed across months for nice charts
        now = timezone.now()
        created_dates = [
            now - timedelta(days=10),
            now - timedelta(days=35),
            now - timedelta(days=65),
            now - timedelta(days=95),
            now - timedelta(days=125),
        ]
        phones = ["+251911000101", "+251911000102", "+251911000103", "+251911000104", "+251911000105"]
        passports = ["ETP10001", "ETP10002", "ETP10003", "ETP10004", "ETP10005"]
        idnums = ["DD-0001", "DD-0002", "DD-0003", "DD-0004", "DD-0005"]
        residence = [("UAE", "Dubai"), ("USA", "Washington"), ("UK", "London"), ("Saudi Arabia", "Riyadh"), ("Kenya", "Nairobi")]

        diasporas = []
        for i in range(5):
            user = users[i]
            created_at = created_dates[i]
            country, city = residence[i]

            diaspora, _ = Diaspora.objects.get_or_create(
                user=user,
                defaults=dict(
                    gender=Diaspora.Gender.MALE if i % 2 == 0 else Diaspora.Gender.FEMALE,
                    dob=date(1990 + i, 1 + (i % 12), 10 + i),
                    primary_phone=phones[i],
                    whatsapp=phones[i],
                    country_of_residence=country,
                    city_of_residence=city,
                    arrival_date=(now - timedelta(days=5 + i)).date(),
                    expected_stay_duration="2 weeks" if i % 2 == 0 else "1 month",
                    is_returnee=bool(i % 2),
                    preferred_language="English",
                    communication_opt_in=True,
                    address_local=f"Harar, Subcity {i+1}",
                    emergency_contact_name=f"Contact {i+1}",
                    emergency_contact_phone=f"+2519000000{i+1}",
                    passport_no=passports[i],
                    id_number=idnums[i],
                    owner_office=diaspora_office,
                    created_by=None,
                ),
            )
            # Manually adjust created_at for nicer reporting (requires a save(update_fields=[]) hack)
            if diaspora.created_at.date() != created_at.date():
                Diaspora.objects.filter(pk=diaspora.pk).update(created_at=created_at)
                diaspora.refresh_from_db()
            diasporas.append(diaspora)

        # 5) Purposes (5) – each a different type & status
        purpose_types = [
            Purpose.PurposeType.INVESTMENT,
            Purpose.PurposeType.TOURISM,
            Purpose.PurposeType.FAMILY,
            Purpose.PurposeType.STUDY,
            Purpose.PurposeType.CHARITY_NGO,
        ]
        purpose_statuses = ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "ON_HOLD"]
        sectors = ["Manufacturing", "Hospitality", "N/A", "Education", "Health/NGO"]

        purposes = []
        for i in range(5):
            p, _ = Purpose.objects.get_or_create(
                diaspora=diasporas[i],
                type=purpose_types[i],
                defaults=dict(
                    description=f"{purpose_types[i].label} purpose for {diasporas[i].full_name}",
                    sector=sectors[i] if purpose_types[i] == Purpose.PurposeType.INVESTMENT or i in (0, 1, 4) else None,
                    sub_sector="Light Industry" if i == 0 else None,
                    investment_type="New Company" if i == 0 else None,
                    estimated_capital=1000000 + (i * 250000) if i == 0 else None,
                    currency="ETB" if i == 0 else None,
                    jobs_expected=25 + (i * 5) if i == 0 else None,
                    land_requirement=True if i == 0 else False,
                    land_size=1.5 if i == 0 else None,
                    preferred_location_note="Industrial park" if i == 0 else None,
                    status=purpose_statuses[i],
                ),
            )
            purposes.append(p)

        # 6) Cases (5) – varying stages & overall statuses
        stages = [
            Case.Stage.INTAKE,
            Case.Stage.SCREENING,
            Case.Stage.REFERRAL,
            Case.Stage.PROCESSING,
            Case.Stage.COMPLETED,
        ]
        overall_statuses = [
            Case.OverallStatus.ACTIVE,
            Case.OverallStatus.ACTIVE,
            Case.OverallStatus.PAUSED,
            Case.OverallStatus.ACTIVE,
            Case.OverallStatus.DONE,
        ]
        cases = []
        for i in range(5):
            c, created = Case.objects.get_or_create(
                diaspora=diasporas[i],
                defaults=dict(current_stage=stages[i], overall_status=overall_statuses[i]),
            )
            if not created:
                c.current_stage = stages[i]
                c.overall_status = overall_statuses[i]
                c.save(update_fields=["current_stage", "overall_status"])
            cases.append(c)

        # 7) Referrals (5) – varying to_office and statuses
        referral_targets = [invest_office, land_office, nigid_office, invest_office, land_office]
        ref_statuses = [
            Referral.ReferralStatus.SENT,
            Referral.ReferralStatus.RECEIVED,
            Referral.ReferralStatus.IN_PROGRESS,
            Referral.ReferralStatus.COMPLETED,
            Referral.ReferralStatus.REJECTED,
        ]
        referrals = []
        for i in range(5):
            r, created = Referral.objects.get_or_create(
                case=cases[i],
                from_office=diaspora_office,
                to_office=referral_targets[i],
                defaults=dict(
                    reason=f"Automated referral #{i+1}",
                    payload_json={"checklist": ["ID Copy", "Passport", "Application Form"][: (2 + (i % 2))]},
                    status=ref_statuses[i],
                    received_at=None if i == 0 else now - timedelta(days=2 + i),
                    completed_at=None if ref_statuses[i] not in [Referral.ReferralStatus.COMPLETED] else now - timedelta(days=1),
                    sla_due_at=now + timedelta(days=7 - i),
                ),
            )
            if not created:
                r.status = ref_statuses[i]
                r.to_office = referral_targets[i]
                r.save(update_fields=["status", "to_office"])
            referrals.append(r)

        # Summary
        self.stdout.write(self.style.SUCCESS("✅ Seed complete."))
        self.stdout.write(
            f"Offices: {Office.objects.count()}, Users: {User.objects.count()}, "
            f"Diasporas: {Diaspora.objects.count()}, Purposes: {Purpose.objects.count()}, "
            f"Cases: {Case.objects.count()}, Referrals: {Referral.objects.count()}"
        )
