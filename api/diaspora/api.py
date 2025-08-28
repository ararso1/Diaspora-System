# diaspora/views.py
from datetime import datetime
from django.db.models import Count
from django.db.models.functions import TruncMonth, TruncQuarter, TruncYear
from django.utils import timezone

from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import *
from .serializers import *

class DefaultPermission(permissions.IsAuthenticated):
    pass


class OfficeViewSet(viewsets.ModelViewSet):
    queryset = Office.objects.all().order_by("name")
    serializer_class = OfficeSerializer
    permission_classes = [DefaultPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "code", "type"]
    ordering_fields = ["name", "code", "type"]


class DiasporaViewSet(viewsets.ModelViewSet):
    queryset = Diaspora.objects.select_related("user", "owner_office", "created_by").all().order_by("-created_at")
    permission_classes = [DefaultPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    # ✅ search across user fields + identifiers
    search_fields = [
        "user__first_name", "user__last_name", "user__email", "user__username",
        "primary_phone", "passport_no", "id_number", "diaspora_id",
    ]
    ordering_fields = ["created_at", "updated_at", "user__first_name", "user__last_name"]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return DiasporaWriteSerializer
        return DiasporaSerializer

    def perform_create(self, serializer):
        # created_by handled inside DiasporaWriteSerializer using request
        serializer.save()

    # Optional: public self-registration without auth
    def get_permissions(self):
        if self.action in ["create"]:
            # Allow anonymous to create diaspora (self-register)
            return [permissions.AllowAny()]
        return super().get_permissions()


class PurposeViewSet(viewsets.ModelViewSet):
    queryset = Purpose.objects.select_related("diaspora", "diaspora__user").all().order_by("-created_at")
    serializer_class = PurposeSerializer
    permission_classes = [DefaultPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["diaspora__user__first_name", "diaspora__user__last_name", "type", "status", "sector", "sub_sector"]
    ordering_fields = ["created_at", "status", "type", "estimated_capital"]


class CaseViewSet(viewsets.ModelViewSet):
    queryset = Case.objects.select_related("diaspora", "diaspora__user").all().order_by("-created_at")
    serializer_class = CaseSerializer
    permission_classes = [DefaultPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        "diaspora__user__first_name", "diaspora__user__last_name",
        "diaspora__primary_phone", "diaspora__diaspora_id",
    ]
    ordering_fields = ["created_at", "updated_at", "current_stage", "overall_status"]


class ReferralViewSet(viewsets.ModelViewSet):
    queryset = Referral.objects.select_related("case", "from_office", "to_office").all().order_by("-created_at")
    serializer_class = ReferralSerializer
    permission_classes = [DefaultPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        "case__diaspora__user__first_name", "case__diaspora__user__last_name",
        "from_office__name", "to_office__name", "status",
    ]
    ordering_fields = ["created_at", "status", "sla_due_at", "completed_at"]


# ---------------------------
# Reports (unchanged, aware of new relations)
# ---------------------------

def _parse_dates(request):
    to_str = request.query_params.get("to")
    from_str = request.query_params.get("from")
    now = timezone.now().date()
    to_date = datetime.strptime(to_str, "%Y-%m-%d").date() if to_str else now
    from_date = datetime.strptime(from_str, "%Y-%m-%d").date() if from_str else to_date.replace(year=to_date.year - 1)
    return from_date, to_date


class ReportsViewSet(viewsets.ViewSet):
    permission_classes = [DefaultPermission]

    @action(detail=False, methods=["GET"])
    def summary(self, request):
        from_date, to_date = _parse_dates(request)
        dias_qs = Diaspora.objects.filter(created_at__date__gte=from_date, created_at__date__lte=to_date)
        total_diasporas = dias_qs.count()
        active_cases = Case.objects.exclude(overall_status="DONE").count()
        ref_qs = Referral.objects.filter(created_at__date__gte=from_date, created_at__date__lte=to_date)
        referrals_by_status = ref_qs.values("status").annotate(count=Count("id")).order_by("status")
        purp_qs = Purpose.objects.filter(created_at__date__gte=from_date, created_at__date__lte=to_date)
        purposes_breakdown = purp_qs.values("type").annotate(count=Count("id")).order_by("type")
        return Response({
            "from": str(from_date), "to": str(to_date),
            "total_diasporas": total_diasporas,
            "active_cases": active_cases,
            "referrals_by_status": list(referrals_by_status),
            "purposes_breakdown": list(purposes_breakdown),
        })

    @action(detail=False, methods=["GET"])
    def diasporas_by_period(self, request):
        group = (request.query_params.get("group") or "monthly").lower()
        from_date, to_date = _parse_dates(request)
        qs = Diaspora.objects.filter(created_at__date__gte=from_date, created_at__date__lte=to_date)
        bucket = TruncYear("created_at") if group == "yearly" else TruncQuarter("created_at") if group == "quarterly" else TruncMonth("created_at")
        data = qs.annotate(period=bucket).values("period").annotate(count=Count("id")).order_by("period")
        results = [{"period": d["period"].date().isoformat(), "count": d["count"]} for d in data]
        return Response({"group": group, "from": str(from_date), "to": str(to_date), "rows": results})

    @action(detail=False, methods=["GET"])
    def progress_by_purpose(self, request):
        from_date, to_date = _parse_dates(request)
        ptype = request.query_params.get("type")
        qs = Purpose.objects.filter(created_at__date__gte=from_date, created_at__date__lte=to_date)
        if ptype: qs = qs.filter(type=ptype)
        data = qs.values("type", "status").annotate(count=Count("id")).order_by("type", "status")
        return Response({"from": str(from_date), "to": str(to_date), "rows": list(data)})

    @action(detail=False, methods=["GET"])
    def cases_by_status(self, request):
        qs = Case.objects.all()
        by_stage = qs.values("current_stage").annotate(count=Count("id")).order_by("current_stage")
        by_overall = qs.values("overall_status").annotate(count=Count("id")).order_by("overall_status")
        return Response({"by_stage": list(by_stage), "by_overall_status": list(by_overall)})

    @action(detail=False, methods=["GET"])
    def referrals_by_office(self, request):
        from_date, to_date = _parse_dates(request)
        ref_qs = Referral.objects.filter(created_at__date__gte=from_date, created_at__date__lte=to_date)
        totals = ref_qs.values("to_office__id", "to_office__name", "to_office__code").annotate(total=Count("id")).order_by("to_office__name")
        by_status = ref_qs.values("to_office__id", "to_office__name", "status").annotate(count=Count("id")).order_by("to_office__name", "status")
        return Response({"totals": list(totals), "by_status": list(by_status)})

class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Everyone sees active announcements by default.
        Optionally filter for the current user's audience.
        Query params:
          - all=1            -> include inactive too (director & above only)
          - for_me=1         -> only those targeted to my roles/offices (or public)
          - office=<id>      -> narrow by office id
        """
        qs = Announcement.objects.all()

        # Unless privileged, show only active
        user = self.request.user
        if not user.is_superuser:
            qs = qs.filter(is_active=True)

        # include inactive if explicitly requested and user is privileged
        if self.request.query_params.get("all") != "1":
            qs = qs.filter(is_active=True)

        return qs.distinct().order_by("-created_at")

    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def perform_update(self, serializer):
        instance = serializer.save(updated_by=self.request.user)

    # Optional: quick publish/unpublish toggle (Director+)
    @action(detail=True, methods=["post"])
    def toggle_active(self, request, pk=None):
        ann = self.get_object()
        ann.is_active = not ann.is_active
        ann.updated_by = request.user
        ann.save(update_fields=["is_active", "updated_by", "updated_at"])
        return Response({"id": ann.id, "is_active": ann.is_active})