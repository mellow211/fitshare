const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const envConfig = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    envConfig[match[1]] = value;
  }
});

const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('clothes').select('id, name, category, style, color');
  if (error) {
    console.error('Error fetching:', error);
  } else {
    console.log(`📊 Total Clean Items: ${data.length}`);
    data.forEach(item => {
      console.log(`- [${item.category}/${item.style}] ${item.name} (${item.color})`);
    });
  }
}
check();
