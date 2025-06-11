// debug_token.js - Script untuk debug token authentication
console.log('🔍 Debug Token Authentication\n');

// Simulate browser localStorage
const mockLocalStorage = {
  'currentSession': '{"userId":1,"email":"test@example.com","nama":"Test User","accountType":"email","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTcwNDEwMDAwMCwiZXhwIjoxNzA0MTg2NDAwfQ.test","loginAt":"2024-01-01T12:00:00.000Z"}',
  'authToken': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTcwNDEwMDAwMCwiZXhwIjoxNzA0MTg2NDAwfQ.test'
};

console.log('📱 Simulating browser localStorage:');
Object.keys(mockLocalStorage).forEach(key => {
  console.log(`${key}:`, mockLocalStorage[key]);
});

console.log('\n🔑 Token extraction logic:');

// Simulate Profile.jsx token extraction
const session = JSON.parse(mockLocalStorage.currentSession || '{}');
const token = session.token || mockLocalStorage.authToken;

console.log('Session object:', session);
console.log('Token from session:', session.token ? 'Found' : 'Not found');
console.log('Token from authToken:', mockLocalStorage.authToken ? 'Found' : 'Not found');
console.log('Final token:', token ? 'Found' : 'Not found');

if (token) {
  console.log('Token preview:', token.substring(0, 50) + '...');
  
  // Decode JWT token (basic decode, no verification)
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      console.log('Token payload:', payload);
      
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        console.log('❌ Token is EXPIRED');
      } else {
        console.log('✅ Token is VALID (not expired)');
      }
    }
  } catch (e) {
    console.log('❌ Invalid token format');
  }
}

console.log('\n🌐 API Request simulation:');
console.log('Headers that would be sent:');
console.log({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
});

console.log('\n💡 Troubleshooting steps:');
console.log('1. Check if user is logged in with email');
console.log('2. Verify token exists in localStorage');
console.log('3. Check token format and expiration');
console.log('4. Verify server CORS headers include Authorization');
console.log('5. Check server JWT middleware');

// Function to check token in browser console
console.log('\n🔧 Run this in browser console to debug:');
console.log(`
// Check current session
const session = JSON.parse(localStorage.getItem('currentSession') || '{}');
console.log('Session:', session);

// Check token
const token = session.token || localStorage.getItem('authToken');
console.log('Token found:', !!token);

// Check if token is valid format
if (token) {
  try {
    const parts = token.split('.');
    const payload = JSON.parse(atob(parts[1]));
    console.log('Token payload:', payload);
    
    const now = Math.floor(Date.now() / 1000);
    console.log('Token expired:', payload.exp < now);
  } catch (e) {
    console.log('Invalid token format');
  }
}

// Test API call
if (token) {
  fetch('http://localhost:5000/api/profile', {
    headers: { 'Authorization': 'Bearer ' + token }
  })
  .then(r => r.json())
  .then(data => console.log('API response:', data))
  .catch(err => console.log('API error:', err));
}
`);

console.log('\n🚨 Common issues and solutions:');
console.log('Issue: "Token autentikasi tidak ditemukan"');
console.log('Solutions:');
console.log('- User not logged in → Login first');
console.log('- Token not saved during login → Check Login.jsx token storage');
console.log('- Session cleared → Re-login');
console.log('- Wrong localStorage key → Check key names');

console.log('\nIssue: "Token tidak valid"');
console.log('Solutions:');
console.log('- Token expired → Re-login');
console.log('- Wrong JWT secret → Check server .env');
console.log('- Malformed token → Clear localStorage and re-login');

console.log('\nIssue: "CORS error"');
console.log('Solutions:');
console.log('- Add Authorization to CORS headers');
console.log('- Restart server after CORS changes');
console.log('- Check browser network tab for preflight requests');