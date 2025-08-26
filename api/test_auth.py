#!/usr/bin/env python
"""
Test script to verify authentication with both username and email
"""
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')
django.setup()

from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from diaspora.backends import EmailOrUsernameModelBackend

def test_authentication():
    """Test authentication with both username and email"""
    
    # Create a test user
    username = "testuser"
    email = "test@example.com"
    password = "testpass123"
    
    # Delete user if exists
    User.objects.filter(username=username).delete()
    
    # Create new user
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name="Test",
        last_name="User"
    )
    
    print(f"Created user: {user.username} ({user.email})")
    
    # Test authentication with username
    print("\n1. Testing authentication with username...")
    auth_user = authenticate(username=username, password=password)
    if auth_user:
        print(f"✓ Authentication with username successful: {auth_user.username}")
    else:
        print("✗ Authentication with username failed")
    
    # Test authentication with email
    print("\n2. Testing authentication with email...")
    auth_user = authenticate(username=email, password=password)
    if auth_user:
        print(f"✓ Authentication with email successful: {auth_user.username}")
    else:
        print("✗ Authentication with email failed")
    
    # Test with custom backend directly
    print("\n3. Testing with custom backend directly...")
    backend = EmailOrUsernameModelBackend()
    
    # Test username
    auth_user = backend.authenticate(None, username=username, password=password)
    if auth_user:
        print(f"✓ Custom backend with username successful: {auth_user.username}")
    else:
        print("✗ Custom backend with username failed")
    
    # Test email
    auth_user = backend.authenticate(None, username=email, password=password)
    if auth_user:
        print(f"✓ Custom backend with email successful: {auth_user.username}")
    else:
        print("✗ Custom backend with email failed")
    
    # Test case insensitive
    print("\n4. Testing case insensitive authentication...")
    auth_user = backend.authenticate(None, username=email.upper(), password=password)
    if auth_user:
        print(f"✓ Case insensitive email authentication successful: {auth_user.username}")
    else:
        print("✗ Case insensitive email authentication failed")
    
    # Test invalid credentials
    print("\n5. Testing invalid credentials...")
    auth_user = backend.authenticate(None, username=username, password="wrongpassword")
    if auth_user:
        print("✗ Authentication with wrong password succeeded (should fail)")
    else:
        print("✓ Authentication with wrong password correctly failed")
    
    # Clean up
    user.delete()
    print(f"\n✓ Test completed. User {username} deleted.")

if __name__ == "__main__":
    test_authentication()
