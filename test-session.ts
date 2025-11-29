/**
 * Session Persistence Test Script
 * Tests signup, login, and /api/auth/me in both development and production modes
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';
const isProduction = process.env.NODE_ENV === 'production';

interface TestResult {
  name: string;
  success: boolean;
  details: string;
}

// In production mode, we need to simulate being behind a proxy (like Render)
// by adding the X-Forwarded-Proto header so secure cookies work correctly
function getHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extraHeaders };
  if (isProduction) {
    // Simulate Render's reverse proxy
    headers['X-Forwarded-Proto'] = 'https';
  }
  return headers;
}

async function testSignupFlow(): Promise<TestResult> {
  const testEmail = `signup-test-${Date.now()}@university.edu`;
  const testPassword = 'TestPassword123!';
  
  console.log('\n--- Test: Signup Flow ---');
  console.log(`Email: ${testEmail}`);
  
  try {
    // Step 1: Signup
    console.log('1. POST /api/auth/signup...');
    const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        fullName: 'Signup Test User',
        universityName: 'Test University',
        country: 'United States'
      }),
    });
    
    const signupData = await signupRes.json();
    const cookies = signupRes.headers.get('set-cookie');
    
    console.log(`   Status: ${signupRes.status}`);
    console.log(`   Set-Cookie: ${cookies ? 'Present ✓' : 'MISSING ✗'}`);
    
    if (signupRes.status !== 200) {
      return { name: 'Signup Flow', success: false, details: `Signup failed with ${signupRes.status}: ${JSON.stringify(signupData)}` };
    }
    
    if (!cookies) {
      return { name: 'Signup Flow', success: false, details: 'No session cookie returned from signup' };
    }
    
    // Extract session cookie
    const sessionCookie = cookies.split(';')[0];
    console.log(`   Cookie: ${sessionCookie.substring(0, 40)}...`);
    
    // Step 2: Call /api/auth/me
    console.log('2. GET /api/auth/me with cookie...');
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: getHeaders({ 'Cookie': sessionCookie }),
    });
    
    const meData = await meRes.json();
    console.log(`   Status: ${meRes.status}`);
    
    if (meRes.status === 200 && meData.email === testEmail) {
      console.log('   ✓ /api/auth/me returned logged-in user');
      return { name: 'Signup Flow', success: true, details: 'Signup + /api/auth/me works correctly' };
    } else {
      return { name: 'Signup Flow', success: false, details: `/api/auth/me returned ${meRes.status}: ${JSON.stringify(meData)}` };
    }
  } catch (error: any) {
    return { name: 'Signup Flow', success: false, details: `Error: ${error.message}` };
  }
}

async function testLoginFlow(): Promise<TestResult> {
  const testEmail = `login-test-${Date.now()}@university.edu`;
  const testPassword = 'TestPassword123!';
  
  console.log('\n--- Test: Login Flow ---');
  console.log(`Email: ${testEmail}`);
  
  try {
    // Step 1: Create user first
    console.log('1. Creating test user via signup...');
    const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        fullName: 'Login Test User',
        universityName: 'Test University',
        country: 'United States'
      }),
    });
    
    if (signupRes.status !== 200) {
      return { name: 'Login Flow', success: false, details: 'Failed to create test user' };
    }
    console.log('   User created ✓');
    
    // Step 2: Login with new session
    console.log('2. POST /api/auth/login...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    
    const loginData = await loginRes.json();
    const cookies = loginRes.headers.get('set-cookie');
    
    console.log(`   Status: ${loginRes.status}`);
    console.log(`   Set-Cookie: ${cookies ? 'Present ✓' : 'MISSING ✗'}`);
    
    if (loginRes.status !== 200) {
      return { name: 'Login Flow', success: false, details: `Login failed with ${loginRes.status}` };
    }
    
    if (!cookies) {
      return { name: 'Login Flow', success: false, details: 'No session cookie returned from login' };
    }
    
    const sessionCookie = cookies.split(';')[0];
    
    // Step 3: Call /api/auth/me
    console.log('3. GET /api/auth/me with login cookie...');
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: getHeaders({ 'Cookie': sessionCookie }),
    });
    
    const meData = await meRes.json();
    console.log(`   Status: ${meRes.status}`);
    
    if (meRes.status === 200 && meData.email === testEmail) {
      console.log('   ✓ /api/auth/me returned logged-in user');
      return { name: 'Login Flow', success: true, details: 'Login + /api/auth/me works correctly' };
    } else {
      return { name: 'Login Flow', success: false, details: `/api/auth/me returned ${meRes.status}: ${JSON.stringify(meData)}` };
    }
  } catch (error: any) {
    return { name: 'Login Flow', success: false, details: `Error: ${error.message}` };
  }
}

async function testCookieAttributes(): Promise<TestResult> {
  console.log('\n--- Test: Cookie Attributes ---');
  
  try {
    const testEmail = `cookie-test-${Date.now()}@university.edu`;
    
    const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        email: testEmail,
        password: 'TestPassword123!',
        fullName: 'Cookie Test User',
        universityName: 'Test University',
        country: 'United States'
      }),
    });
    
    const cookies = signupRes.headers.get('set-cookie') || '';
    console.log(`Full Set-Cookie: ${cookies}`);
    
    const hasHttpOnly = cookies.toLowerCase().includes('httponly');
    const hasSameSite = cookies.toLowerCase().includes('samesite=lax');
    const hasPath = cookies.includes('Path=/');
    const hasMaxAge = cookies.toLowerCase().includes('max-age') || cookies.toLowerCase().includes('expires');
    const hasSecure = cookies.toLowerCase().includes('secure');
    
    console.log(`   HttpOnly: ${hasHttpOnly ? '✓' : '✗'}`);
    console.log(`   SameSite=Lax: ${hasSameSite ? '✓' : '✗'}`);
    console.log(`   Path=/: ${hasPath ? '✓' : '✗'}`);
    console.log(`   Max-Age/Expires: ${hasMaxAge ? '✓' : '✗'}`);
    
    if (isProduction) {
      console.log(`   Secure (production): ${hasSecure ? '✓' : '✗'}`);
      if (!hasSecure) {
        return { name: 'Cookie Attributes', success: false, details: 'Secure flag missing in production mode' };
      }
    } else {
      console.log(`   Secure (development): ${hasSecure ? 'Present' : 'Not set ✓'}`);
    }
    
    if (hasHttpOnly && hasSameSite && hasPath && cookies) {
      return { name: 'Cookie Attributes', success: true, details: 'All required cookie attributes present' };
    } else {
      return { name: 'Cookie Attributes', success: false, details: 'Missing required cookie attributes' };
    }
  } catch (error: any) {
    return { name: 'Cookie Attributes', success: false, details: `Error: ${error.message}` };
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('SESSION PERSISTENCE TEST');
  console.log('='.repeat(60));
  console.log(`Target: ${BASE_URL}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  if (isProduction) {
    console.log(`Simulating proxy: X-Forwarded-Proto: https`);
  }
  console.log('='.repeat(60));
  
  const results: TestResult[] = [];
  
  results.push(await testSignupFlow());
  results.push(await testLoginFlow());
  results.push(await testCookieAttributes());
  
  console.log('\n' + '='.repeat(60));
  console.log('RESULTS SUMMARY');
  console.log('='.repeat(60));
  
  let allPassed = true;
  for (const result of results) {
    const status = result.success ? '✓ PASS' : '✗ FAIL';
    console.log(`${status}: ${result.name}`);
    console.log(`       ${result.details}`);
    if (!result.success) allPassed = false;
  }
  
  console.log('='.repeat(60));
  
  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED!\n');
    console.log('Sessions are persisting correctly.');
    if (isProduction) {
      console.log('Production mode tested successfully with simulated proxy headers.');
      console.log('The app should work on Render with the current configuration.');
    }
    process.exit(0);
  } else {
    console.log('\n💥 SOME TESTS FAILED!\n');
    console.log('Review the failures above and fix the issues.');
    process.exit(1);
  }
}

main().catch(console.error);
