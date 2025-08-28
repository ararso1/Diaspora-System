from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, login 
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
# Create your views here.
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
