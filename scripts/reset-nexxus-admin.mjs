import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sehmquyehjboznvwztqh.supabase.co';
const supabaseKey = 'sb_secret_snB6XPfP7DO5yF-hKXVhoA_PkkFArmb';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email: 'nexxusadmin@nexxus.com'
  });
  
  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('User ID:', data.user.id);
    console.log('Recovery link (not sending email, just generating):', data.properties.action_link);
    
    // Now that we have the ID, we can reset the password directly to something standard so the user can log in!
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      data.user.id,
      { password: 'NexxusAdmin2026!' }
    );
    
    if (updateError) {
      console.log('Error updating password:', updateError.message);
    } else {
      console.log('Password successfully reset to: NexxusAdmin2026!');
    }
  }
}

main();
