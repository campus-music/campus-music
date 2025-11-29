/**
 * Session Persistence Test
 * Tests that login/signup creates a session and /api/auth/me works
 */

const BASE_URL = 'http://localhost:5000';

async function testSessionPersistence() {
  const testEmail = `test-${Date.now()}@university.edu`;
  const testPassword = 'TestPassword123!';
  
  console.log('\n=== Session Persistence Test ===\n');
  console.log(`Test Email: ${testEmail}`);
  
  // Step 1: Signup
  console.log('\n1. Testing POST /api/auth/signup...');
  const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      fullName: 'Test User',
      universityName: 'Test University',
      country: 'United States'
    }),
    credentials: 'include',
  });
  
  const signupData = await signupRes.json();
  const cookies = signupRes.headers.get('set-cookie');
  
  console.log(`   Status: ${signupRes.status}`);
  console.log(`   Response: ${JSON.stringify(signupData)}`);
  console.log(`   Set-Cookie header: ${cookies ? 'Present' : 'MISSING!'}`);
  
  if (signupRes.status !== 200) {
    console.log('\n❌ Signup failed!');
    return false;
  }
  
  if (!cookies) {
    console.log('\n❌ No session cookie returned!');
    return false;
  }
  
  // Extract cookie for next request
  const sessionCookie = cookies.split(';')[0];
  console.log(`   Cookie to use: ${sessionCookie.substring(0, 50)}...`);
  
  // Step 2: Test /api/auth/me with cookie
  console.log('\n2. Testing GET /api/auth/me with session cookie...');
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    method: 'GET',
    headers: { 
      'Cookie': sessionCookie
    },
  });
  
  const meData = await meRes.json();
  console.log(`   Status: ${meRes.status}`);
  console.log(`   Response: ${JSON.stringify(meData)}`);
  
  if (meRes.status === 200 && meData.email === testEmail) {
    console.log('\n✅ SUCCESS! Session persistence is working correctly.');
    console.log('   - Signup returned a session cookie');
    console.log('   - /api/auth/me returned the logged-in user');
    return true;
  } else {
    console.log('\n❌ FAILURE! /api/auth/me returned 401 or wrong user.');
    return false;
  }
}

// Also test login flow
async function testLoginFlow() {
  const testEmail = `login-test-${Date.now()}@university.edu`;
  const testPassword = 'TestPassword123!';
  
  console.log('\n\n=== Login Flow Test ===\n');
  
  // First create user
  console.log('1. Creating test user...');
  const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      fullName: 'Login Test User',
      universityName: 'Test University',
      country: 'United States'
    }),
  });
  
  if (signupRes.status !== 200) {
    console.log(`   Signup failed: ${signupRes.status}`);
    return false;
  }
  console.log('   User created successfully');
  
  // Now test login
  console.log('\n2. Testing POST /api/auth/login...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
    }),
  });
  
  const loginData = await loginRes.json();
  const cookies = loginRes.headers.get('set-cookie');
  
  console.log(`   Status: ${loginRes.status}`);
  console.log(`   Response: ${JSON.stringify(loginData)}`);
  console.log(`   Set-Cookie: ${cookies ? 'Present' : 'MISSING!'}`);
  
  if (!cookies) {
    console.log('\n❌ Login did not return session cookie!');
    return false;
  }
  
  const sessionCookie = cookies.split(';')[0];
  
  // Test /api/auth/me
  console.log('\n3. Testing GET /api/auth/me after login...');
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { 'Cookie': sessionCookie },
  });
  
  const meData = await meRes.json();
  console.log(`   Status: ${meRes.status}`);
  console.log(`   Response: ${JSON.stringify(meData)}`);
  
  if (meRes.status === 200 && meData.email === testEmail) {
    console.log('\n✅ Login flow works correctly!');
    return true;
  } else {
    console.log('\n❌ Login flow failed!');
    return false;
  }
}

async function main() {
  try {
    const signupTest = await testSessionPersistence();
    const loginTest = await testLoginFlow();
    
    console.log('\n\n=== FINAL RESULTS ===');
    console.log(`Signup + /me test: ${signupTest ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Login + /me test: ${loginTest ? '✅ PASS' : '❌ FAIL'}`);
    
    if (signupTest && loginTest) {
      console.log('\n🎉 All session tests passed! Sessions are persisting correctly.');
      process.exit(0);
    } else {
      console.log('\n💥 Some tests failed. Check the output above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Test error:', error);
    process.exit(1);
  }
}

main();
