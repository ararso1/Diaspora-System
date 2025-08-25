# diaspora/views.py
from datetime import datetime
from django.db.models import Count, Q
from django.db.models.functions import TruncMonth, TruncQuarter, TruncYear
from django.utils import timezone

from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Office, Diaspora, Purpose, Case, Referral
from .serializers import (
    OfficeSerializer, DiasporaSerializer, PurposeSerializer,
    CaseSerializer, ReferralSerializer
)


class DefaultPermission(permissions.IsAuthenticated):
    """
    Replace/extend with per-role permissions later.
    """
    pass


class OfficeViewSet(viewsets.ModelViewSet):
    queryset = Office.objects.all().order_by("name")
    serializer_class = OfficeSerializer
    permission_classes = [DefaultPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "code", "type"]
    ordering_fields = ["name", "code", "type"]


class DiasporaViewSet(viewsets.ModelViewSet):
    queryset = Diaspora.objects.all().select_related("owner_office", "created_by").order_by("-created_at")
    serializer_class = DiasporaSerializer
    permission_classes = [DefaultPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        "first_name", "last_name", "primary_phone",
        "passport_no", "id_number", "diaspora_id", "email",
    ]
    ordering_fields = ["created_at", "updated_at", "first_name", "last_name"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)


class PurposeViewSet(viewsets.ModelViewSet):
    queryset = Purpose.objects.select_related("diaspora").all().order_by("-created_at")
    serializer_class = PurposeSerializer
    permission_classes = [DefaultPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["diaspora__first_name", "diaspora__last_name", "type", "status", "sector", "sub_sector"]
    ordering_fields = ["created_at", "status", "type", "estimated_capital"]


class CaseViewSet(viewsets.ModelViewSet):
    queryset = Case.objects.select_related("diaspora").all().order_by("-created_at")
    serializer_class = CaseSerializer
    permission_classes = [DefaultPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        "diaspora__first_name", "diaspora__last_name", "diaspora__primary_phone",
        "diaspora__diaspora_id",
    ]
    ordering_fields = ["created_at", "updated_at", "current_stage", "overall_status"]


class ReferralViewSet(viewsets.ModelViewSet):
    queryset = Referral.objects.select_related("case", "from_office", "to_office").all().order_by("-created_at")
    serializer_class = ReferralSerializer
    permission_classes = [DefaultPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        "case__diaspora__first_name", "case__diaspora__last_name",
        "from_office__name", "to_office__name", "status",
    ]
    ordering_fields = ["created_at", "status", "sla_due_at", "completed_at"]


# ---------------------------
# Reports for dashboards
# ---------------------------

def _parse_dates(request):
    """
    Parse ?from=YYYY-MM-DD&to=YYYY-MM-DD (inclusive ranges).
    Defaults to last 12 months if not provided.
    """
    to_str = request.query_params.get("to")
    from_str = request.query_params.get("from")
    now = timezone.now().date()

    if to_str:
        to_date = datetime.strptime(to_str, "%Y-%m-%d").date()
    else:
        to_date = now

    if from_str:
        from_date = datetime.strptime(from_str, "%Y-%m-%d").date()
    else:
        # default: last 12 months
        from_date = to_date.replace(year=to_date.year - 1)

    return from_date, to_date


class ReportsViewSet(viewsets.ViewSet):
    permission_classes = [DefaultPermission]

    @action(detail=False, methods=["GET"])
    def summary(self, request):
        """
        High-level counts for the dashboard.
        - total_diasporas (date filtered)
        - active_cases
        - referrals_by_status
        - purposes_breakdown
        """
        from_date, to_date = _parse_dates(request)
        # Diasporas created in range:
        dias_qs = Diaspora.objects.filter(created_at__date__gte=from_date, created_at__date__lte=to_date)
        total_diasporas = dias_qs.count()

        active_cases = Case.objects.exclude(overall_status="DONE").count()

        # Referrals by status (in range by created_at)
        ref_qs = Referral.objects.filter(created_at__date__gte=from_date, created_at__date__lte=to_date)
        referrals_by_status = (
            ref_qs.values("status")
            .annotate(count=Count("id"))
            .order_by("status")
        )

        # Purposes breakdown by type (in range by purpose.created_at)
        purp_qs = Purpose.objects.filter(created_at__date__gte=from_date, created_at__date__lte=to_date)
        purposes_breakdown = (
            purp_qs.values("type")
            .annotate(count=Count("id"))
            .order_by("type")
        )

        return Response({
            "from": str(from_date),
            "to": str(to_date),
            "total_diasporas": total_diasporas,
            "active_cases": active_cases,
            "referrals_by_status": list(referrals_by_status),
            "purposes_breakdown": list(purposes_breakdown),
        })

    @action(detail=False, methods=["GET"])
    def diasporas_by_period(self, request):
        """
        Group diaspora registrations by period.
        ?group=monthly|quarterly|yearly (default monthly)
        Uses created_at as the registration time.
        """
        group = (request.query_params.get("group") or "monthly").lower()
        from_date, to_date = _parse_dates(request)

        qs = Diaspora.objects.filter(created_at__date__gte=from_date, created_at__date__lte=to_date)

        if group == "yearly":
            bucket = TruncYear("created_at")
        elif group == "quarterly":
            bucket = TruncQuarter("created_at")
        else:
            bucket = TruncMonth("created_at")

        data = (
            qs.annotate(period=bucket)
              .values("period")
              .annotate(count=Count("id"))
              .order_by("period")
        )

        # format ISO date for the period key
        results = [{"period": d["period"].date().isoformat(), "count": d["count"]} for d in data]
        return Response({"group": group, "from": str(from_date), "to": str(to_date), "rows": results})

    @action(detail=False, methods=["GET"])
    def progress_by_purpose(self, request):
        """
        For the dashboard: show purposes and their progress/status.
        ?type=INVESTMENT|TOURISM|FAMILY|STUDY|CHARITY_NGO|OTHER (optional)
        Returns counts per status for each purpose type within date range.
        """
        from_date, to_date = _parse_dates(request)
        ptype = request.query_params.get("type")

        qs = Purpose.objects.filter(created_at__date__gte=from_date, created_at__date__lte=to_date)
        if ptype:
            qs = qs.filter(type=ptype)

        # Count by purpose type and status
        data = (
            qs.values("type", "status")
              .annotate(count=Count("id"))
              .order_by("type", "status")
        )
        return Response({"from": str(from_date), "to": str(to_date), "rows": list(data)})

    @action(detail=False, methods=["GET"])
    def cases_by_status(self, request):
        """
        Group cases by current_stage and overall_status.
        """
        qs = Case.objects.all()
        by_stage = qs.values("current_stage").annotate(count=Count("id")).order_by("current_stage")
        by_overall = qs.values("overall_status").annotate(count=Count("id")).order_by("overall_status")
        return Response({"by_stage": list(by_stage), "by_overall_status": list(by_overall)})

    @action(detail=False, methods=["GET"])
    def referrals_by_office(self, request):
        """
        For each 'to_office', count referrals by status (in range).
        """
        from_date, to_date = _parse_dates(request)
        ref_qs = Referral.objects.filter(created_at__date__gte=from_date, created_at__date__lte=to_date)

        # totals by office
        totals = (
            ref_qs.values("to_office__id", "to_office__name", "to_office__code")
                 .annotate(total=Count("id"))
                 .order_by("to_office__name")
        )
        # detailed by office + status
        by_status = (
            ref_qs.values("to_office__id", "to_office__name", "status")
                 .annotate(count=Count("id"))
                 .order_by("to_office__name", "status")
        )
        return Response({"totals": list(totals), "by_status": list(by_status)})
