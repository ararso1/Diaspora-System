# diaspora/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api import (
    OfficeViewSet, DiasporaViewSet, PurposeViewSet,
    CaseViewSet, ReferralViewSet, ReportsViewSet
)
from .views import user_login, user_register

router = DefaultRouter()
router.register(r"offices", OfficeViewSet, basename="offices")
router.register(r"diasporas", DiasporaViewSet, basename="diasporas")
router.register(r"purposes", PurposeViewSet, basename="purposes")
router.register(r"cases", CaseViewSet, basename="cases")
router.register(r"referrals", ReferralViewSet, basename="referrals")
router.register(r"reports", ReportsViewSet, basename="reports")  # exposes custom actions

urlpatterns = [
    path("", include(router.urls)),
    path("login", user_login, name="user_login"),
    path("register", user_register, name="user_register"),
]

