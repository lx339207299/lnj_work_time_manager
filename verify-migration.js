
const BASE_URL = 'http://localhost:3000';

async function run() {
  try {
    // 1. Register
    console.log('Registering user...');
    const registerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '13800138000', password: 'password123', name: 'Test User' })
    });
    const registerData = await registerRes.json();
    console.log('Register Response:', JSON.stringify(registerData));

    // 2. Login
    console.log('Logging in...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '13800138000', password: 'password123' })
    });
    const loginData = await loginRes.json();
    console.log('Login Response:', JSON.stringify(loginData));
    
    const token = loginData.data?.access_token || loginData.access_token;
    if (!token) throw new Error('No token received');

    // 3. Create Org
    console.log('Creating Org...');
    const orgRes = await fetch(`${BASE_URL}/organizations/create`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name: 'Test Org' })
    });
    const orgData = await orgRes.json();
    console.log('Create Org Response:', JSON.stringify(orgData));
    
    const orgId = orgData.data?.id || orgData.id;
    if (typeof orgId !== 'number') throw new Error(`Org ID is not a number: ${orgId}`);

    // 4. Create Project
    console.log('Creating Project...');
    const projRes = await fetch(`${BASE_URL}/projects/create`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: 'Test Project' })
      });
      const projData = await projRes.json();
      console.log('Create Project Response:', JSON.stringify(projData));
      
      const projId = projData.data?.id || projData.id;
      if (typeof projId !== 'number') throw new Error(`Project ID is not a number: ${projId}`);

    console.log('SUCCESS: All IDs are numbers!');
  } catch (error) {
    console.error('FAILED:', error);
    process.exit(1);
  }
}

run();
