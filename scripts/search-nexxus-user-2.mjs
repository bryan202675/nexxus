import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sehmquyehjboznvwztqh.supabase.co';
const supabaseKey = 'sb_secret_snB6XPfP7DO5yF-hKXVhoA_PkkFArmb';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: users, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }
  
  let found = false;
  for (const u of users.users) {
    if (u.email.includes('nexxus')) {
      console.log(`- ${u.email} (Providers: ${u.app_metadata.providers.join(', ')})`);
      found = true;
    }
  }
  
  if (!found) {
    console.log('No se encontraron correos con "nexxus" en los primeros 50 usuarios.');
  }
}

main();
