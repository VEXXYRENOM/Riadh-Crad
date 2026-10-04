const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateUserPassword() {
  // معرف المستخدم الخاص بـ hagguianouer@gmail.com
  const userId = 'bf2a6386-8ce8-409b-a311-eeda127a9ff7'; 
  
  // كلمة المرور الجديدة (قم بتغييرها إلى الكلمة التي تريدها)
  const newPassword = 'NewPassword123!'; 

  console.log(`Updating password for user ID: ${userId}...`);

  const { data, error } = await supabase.auth.admin.updateUserById(
    userId,
    { password: newPassword }
  );

  if (error) {
    console.error('Error updating password:', error);
  } else {
    console.log('✅ Password updated successfully for:', data.user.email);
    console.log('New Password is:', newPassword);
  }
}

updateUserPassword();
