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
  
  console.log('Users:');
  users.users.forEach(user => {
    console.log(`- Email: ${user.email} | ID: ${user.id} | Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'} | Providers: ${user.app_metadata.providers.join(', ')}`);
  });
}

main();
