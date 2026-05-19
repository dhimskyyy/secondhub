const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, value] = line.split('=');
  if (key && value) acc[key] = value.replace(/["']/g, '').trim();
  return acc;
}, {});

async function test() {
  console.log('Testing Supabase query...');
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    return;
  }

  const start = Date.now();
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/products?select=*&limit=1`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    console.log(`Finished in ${Date.now() - start}ms`);
    console.log('Status:', res.status);
    console.log('Data:', await res.json());
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

test();
