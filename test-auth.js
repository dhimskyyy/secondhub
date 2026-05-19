const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, value] = line.split('=');
  if (key && value) acc[key] = value.replace(/["']/g, '').trim();
  return acc;
}, {});

async function test() {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('Testing Supabase Auth...');
  const start = Date.now();
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'mdhimas25@gmail.com',
        password: 'Secondhub123!'
      })
    });
    console.log(`Finished in ${Date.now() - start}ms`);
    console.log('Status:', res.status);
    console.log('Data:', await res.json());
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

test();
