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

async function deleteClothes() {
  console.log("🧹 Deleting registered items from Supabase 'clothes' table...");
  
  // Fetch all current items
  const { data, error } = await supabase.from('clothes').select('id, name, created_at');
  if (error) {
    console.error("Error fetching items:", error);
    return;
  }

  console.log(`Found ${data.length} items.`);

  // Delete all items except initial seeds or delete all recent
  const { error: deleteErr } = await supabase
    .from('clothes')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Deletes all items in table

  if (deleteErr) {
    console.error("Error deleting items:", deleteErr);
  } else {
    console.log("✅ Successfully deleted all recent clothes data from Supabase DB!");
  }
}

deleteClothes();
