const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, value] = line.split('=');
  if (key && value) acc[key] = value.replace(/["']/g, '').trim();
  return acc;
}, {});

async function test() {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/profiles?select=*&limit=1`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Profile columns:', Object.keys(data[0] || {}));
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
