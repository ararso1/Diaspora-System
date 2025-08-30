from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, login 
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework import status, permissions
from rest_framework.throttling import AnonRateThrottle

from .serializers import DiasporaWriteSerializer, DiasporaSerializer
from .models import Diaspora

class PublicRegisterView(APIView):
    """
    Public registration for Diaspora users.
    - No auth required
    - Validates password confirmation if provided
    - Creates Django User (+ puts in 'Diaspora' group) and Diaspora in one shot
    - Returns Diaspora read serializer (includes 'user' slim fields)
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []            # avoid SessionAuthentication/CSRF on API calls
    throttle_classes = [AnonRateThrottle]  # optional: rate limit anonymous hits

    def post(self, request):
        data = request.data or {}

        # Optional: enforce password confirmation at transport layer
        user_payload = (data.get("user") or {})
        pwd = user_payload.get("password") or ""
        confirm = data.get("confirm_password") or user_payload.get("confirm_password") or ""
        if confirm and pwd != confirm:
            return Response({"detail": "Passwords do not match."}, status=status.HTTP_400_BAD_REQUEST)

        # Optional: basic email uniqueness guard (User.email not unique by default)
        email = (user_payload.get("email") or "").strip().lower()
        if not email:
            return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email__iexact=email).exists():
            return Response({"detail": "An account with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)

        # Use your existing write serializer to create both User + Diaspora
        ser = DiasporaWriteSerializer(data=data, context={"request": request})
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

        diaspora: Diaspora = ser.save()  # creates User, adds to Diaspora group, creates Diaspora

        # Return your standard read shape
        out = DiasporaSerializer(diaspora, context={"request": request}).data

        return Response(out, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def user_login(request):
    if request.method != "POST":
        return Response({"detail": "This view only handles POST requests."}, status=status.HTTP_400_BAD_REQUEST)

    identifier = request.data.get('username') or request.data.get('email')
    password = request.data.get('password')
    if not identifier or not password:
        return Response("Email and/or Password are Incorrect", status=status.HTTP_400_BAD_REQUEST)

    # Try authenticating directly as username
    user = authenticate(request, username=identifier, password=password)
    print(user)
    # If that fails, try resolving identifier as email to a username
    if user is None and '@' in identifier:
        try:
            resolved_user = User.objects.get(email=identifier)
            user = authenticate(request, username=resolved_user.username, password=password)
        except User.DoesNotExist:
            user = None
    if user is not None:
        login(request, user)
        print(user.groups.first().name)
        # Generate JWT token
        refresh = RefreshToken.for_user(user)   
        # Create a custom response with the token
        response_data = {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user_id': user.id,
            'role': user.groups.first().name if user.groups.exists() else 'Diaspora',  # Assuming first group is the role
        }
        return Response(response_data, status=status.HTTP_200_OK)

    else:
        return Response({"detail": "Invalid login credentials."}, status=status.HTTP_401_UNAUTHORIZED)
