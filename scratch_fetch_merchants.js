const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function extractMerchants() {
  // Fetch all merchants
  const { data: merchants, error: merchantsError } = await supabase
    .from('merchants')
    .select('*');
    
  if (merchantsError) {
    console.error('Error fetching merchants:', merchantsError);
    return;
  }

  // Fetch all users to map them
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError) {
    console.error('Error fetching users:', usersError);
    return;
  }
  
  const users = usersData.users;

  const result = merchants.map(merchant => {
    const user = users.find(u => u.id === merchant.owner_id);
    return {
      merchantId: merchant.id,
      merchantName: merchant.name,
      merchantSlug: merchant.slug,
      pointsPerDinar: merchant.points_per_dinar,
      userId: user ? user.id : null,
      userEmail: user ? user.email : null,
      createdAt: merchant.created_at || (user ? user.created_at : null)
    };
  });
  
  console.log(JSON.stringify(result, null, 2));
}

extractMerchants();
