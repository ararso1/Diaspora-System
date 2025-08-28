# diaspora/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api import *
from .views import user_login

router = DefaultRouter()
router.register(r"offices", OfficeViewSet, basename="offices")
router.register(r"diasporas", DiasporaViewSet, basename="diasporas")  # /api/v1/diasporas
router.register(r"purposes", PurposeViewSet, basename="purposes")
router.register(r"cases", CaseViewSet, basename="cases")
router.register(r"referrals", ReferralViewSet, basename="referrals")
router.register(r"reports", ReportsViewSet, basename="reports")
router.register(r'announcements', AnnouncementViewSet, basename='announcement')

urlpatterns = [
    path("", include(router.urls)),
    path("login/", user_login, name="user_login"),  
]

