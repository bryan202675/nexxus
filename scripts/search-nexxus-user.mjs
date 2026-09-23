import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sehmquyehjboznvwztqh.supabase.co';
const supabaseKey = 'sb_secret_snB6XPfP7DO5yF-hKXVhoA_PkkFArmb';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  let page = 1;
  let found = false;
  
  while (true) {
    const { data: users, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) {
      console.error('Error fetching users:', error);
      break;
    }
    
    if (users.users.length === 0) break;
    
    for (const u of users.users) {
      if (u.email.includes('nexxus')) {
        console.log(`- ${u.email} (Providers: ${u.app_metadata.providers.join(', ')})`);
        found = true;
      }
    }
    page++;
  }
  
  if (!found) {
    console.log('No se encontraron correos con "nexxus"');
  }
}

main();
