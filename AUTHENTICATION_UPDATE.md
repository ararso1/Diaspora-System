# Authentication System Update: Username and Email Support

## Overview
The Django project has been updated to accept both username and email for user authentication, providing a more flexible and user-friendly login experience.

## Backend Changes (Django)

### 1. Custom Authentication Backend
**File:** `api/diaspora/backends.py`
- Created `EmailOrUsernameModelBackend` class
- Supports case-insensitive authentication with both username and email
- Includes security measures to prevent timing attacks
- Uses Django's `Q` objects for efficient database queries

### 2. Updated Settings
**File:** `api/api/settings.py`
- Added custom authentication backend to `AUTHENTICATION_BACKENDS`
- Custom backend is listed first for priority

### 3. Enhanced Serializers
**File:** `api/diaspora/serializers.py`
- Added `LoginSerializer` with `identifier` field (accepts username or email)
- Added `RegisterSerializer` for user registration
- Added `UserSerializer` for user data serialization
- Proper validation and error handling

### 4. Updated Views
**File:** `api/diaspora/views.py`
- Modified `user_login` to use new serializer
- Added `user_register` endpoint
- Improved error messages and response structure
- Updated to handle new user data format

### 5. URL Configuration
**File:** `api/diaspora/urls.py`
- Added `/register` endpoint for user registration

## Frontend Changes (Next.js)

### 1. Updated Login Form
**File:** `frontend/src/components/Auth/SigninWithPassword.tsx`
- Changed input field from "Email" to "Username or Email"
- Updated field name from `email` to `identifier`
- Changed input type from `email` to `text`
- Updated icon from `EmailIcon` to `UserIcon`
- Added helpful text explaining the dual functionality
- Updated error messages to reflect both username and email support

### 2. Updated API Utility
**File:** `frontend/src/utils/api.ts`
- Modified `loginUser` function to send `identifier` instead of `username`
- Added `registerUser` function for user registration
- Updated parameter names for consistency

### 3. Updated Registration Form
**File:** `frontend/src/app/auth/sign-up/page.tsx`
- Simplified form to focus on essential fields
- Added username field
- Made email required
- Removed unnecessary fields (phone, national ID, address)
- Updated to use new registration API endpoint
- Added automatic redirect to login after successful registration

## API Endpoints

### Login
```
POST /api/login/
{
  "identifier": "username_or_email",
  "password": "user_password"
}
```

### Registration
```
POST /api/register/
{
  "username": "unique_username",
  "email": "user@example.com",
  "password": "secure_password",
  "password2": "secure_password",
  "first_name": "First",
  "last_name": "Last"
}
```

## Testing

### Backend Tests
**File:** `api/test_auth.py`
- Comprehensive test script for authentication backend
- Tests username authentication
- Tests email authentication
- Tests case-insensitive matching
- Tests invalid credentials
- Automatically cleans up test data

### Frontend Tests
**File:** `frontend/test-auth-integration.js`
- Browser console test script
- Tests registration and login flows
- Tests both username and email authentication
- Can be run in browser console for integration testing

## Security Features

1. **Case-Insensitive Matching**: Username and email matching is case-insensitive
2. **Timing Attack Prevention**: Custom backend includes measures to prevent timing attacks
3. **Password Validation**: Uses Django's built-in password validators
4. **JWT Tokens**: Secure token-based authentication
5. **Input Validation**: Comprehensive validation on both frontend and backend

## User Experience Improvements

1. **Flexible Login**: Users can sign in with either username or email
2. **Clear Labels**: Form labels clearly indicate both options are accepted
3. **Helpful Text**: Additional guidance text explains the dual functionality
4. **Consistent Error Messages**: Error messages reflect both username and email support
5. **Streamlined Registration**: Simplified registration process with essential fields only

## Migration Notes

- Existing users can continue using their current login method
- No database migration required
- Backward compatible with existing authentication
- New users can choose their preferred login method

## Usage Examples

### Login with Username
```javascript
const response = await loginUser("john_doe", "password123");
```

### Login with Email
```javascript
const response = await loginUser("john@example.com", "password123");
```

### Registration
```javascript
const response = await registerUser({
  username: "john_doe",
  email: "john@example.com",
  password: "password123",
  password2: "password123",
  first_name: "John",
  last_name: "Doe"
});
```

## Future Enhancements

1. **Password Reset**: Add password reset functionality using email
2. **Email Verification**: Add email verification for new registrations
3. **Social Login**: Integrate social media login options
4. **Two-Factor Authentication**: Add 2FA support
5. **Account Lockout**: Implement account lockout after failed attempts
