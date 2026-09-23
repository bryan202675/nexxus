import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sehmquyehjboznvwztqh.supabase.co';
const supabaseKey = 'sb_secret_snB6XPfP7DO5yF-hKXVhoA_PkkFArmb';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const emailToFind = 'bryan.hernandez4bm@gmail.com';
  console.log(`Buscando usuario: ${emailToFind}`);
  
  // Usamos el listUsers con un filtro (buscando en memoria si son pocos, o usamos la API de buscar)
  // Pero lo más rápido es obtener la lista y filtrar
  let page = 1;
  let allUsers = [];
  
  while (true) {
    const { data: users, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) {
      console.error('Error fetching users:', error);
      return;
    }
    
    if (users.users.length === 0) break;
    
    allUsers = allUsers.concat(users.users);
    page++;
  }
  
  const user = allUsers.find(u => u.email === emailToFind);
  
  if (user) {
    console.log('--- USUARIO ENCONTRADO ---');
    console.log(`Email: ${user.email}`);
    console.log(`ID: ${user.id}`);
    console.log(`Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
    console.log(`Providers: ${user.app_metadata.providers.join(', ')}`);
    console.log(`Created At: ${user.created_at}`);
  } else {
    console.log('--- USUARIO NO ENCONTRADO ---');
    
    // Check if there are similar ones (e.g. bryan.hernandez6bm@gmail.com was in the previous list!)
    const similar = allUsers.filter(u => u.email.includes('bryan.hernandez'));
    if (similar.length > 0) {
      console.log('\nUsuarios similares encontrados:');
      similar.forEach(u => console.log(`- ${u.email} (Providers: ${u.app_metadata.providers.join(', ')})`));
    }
  }
}

main();
