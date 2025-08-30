// Simple test script to verify frontend authentication integration
// Run this in the browser console on the login page

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Test data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'testpass123'
};

// Test login with username
async function testLoginWithUsername() {
  console.log('Testing login with username...');
  try {
    const response = await fetch(`${API_URL}/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: testUser.username,
        password: testUser.password
      })
    });
    
    const data = await response.json();
    if (response.ok) {
      console.log('✅ Login with username successful:', data);
      return data;
    } else {
      console.log('❌ Login with username failed:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ Login with username error:', error);
    return null;
  }
}

// Test login with email
async function testLoginWithEmail() {
  console.log('Testing login with email...');
  try {
    const response = await fetch(`${API_URL}/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: testUser.email,
        password: testUser.password
      })
    });
    
    const data = await response.json();
    if (response.ok) {
      console.log('✅ Login with email successful:', data);
      return data;
    } else {
      console.log('❌ Login with email failed:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ Login with email error:', error);
    return null;
  }
}

// Test registration
async function testRegistration() {
  console.log('Testing user registration...');
  try {
    const response = await fetch(`${API_URL}/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: testUser.username,
        email: testUser.email,
        password: testUser.password,
        password2: testUser.password,
        first_name: 'Test',
        last_name: 'User'
      })
    });
    
    const data = await response.json();
    if (response.ok) {
      console.log('✅ Registration successful:', data);
      return data;
    } else {
      console.log('❌ Registration failed:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ Registration error:', error);
    return null;
  }
}

// Run all tests
async function runTests() {
  console.log('🧪 Starting authentication integration tests...\n');
  
  // Test registration first
  const registrationResult = await testRegistration();
  
  if (registrationResult) {
    console.log('\n--- Testing Login ---');
    // Test login with username
    await testLoginWithUsername();
    
    // Test login with email
    await testLoginWithEmail();
  }
  
  console.log('\n🏁 Tests completed!');
}

// Export for use in browser console
window.testAuthIntegration = {
  runTests,
  testLoginWithUsername,
  testLoginWithEmail,
  testRegistration
};

console.log('🔧 Test functions loaded. Run testAuthIntegration.runTests() to start testing.');
