import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sehmquyehjboznvwztqh.supabase.co';
const supabaseKey = 'sb_secret_snB6XPfP7DO5yF-hKXVhoA_PkkFArmb';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'nexxusadmin@nexxus.com',
    password: 'Password123!',
    email_confirm: true
  });
  
  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('User created:', data.user.id);
  }
}

main();
