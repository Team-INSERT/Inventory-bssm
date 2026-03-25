import { createClient } from "@supabase/supabase-js";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase.storage.createBucket('item-images', {
    public: true,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
    fileSizeLimit: 10485760 // 10MB
  });
  console.log('Create Bucket Error:', error);
  console.log('Create Bucket Data:', data);
  
  if (!error) {
     console.log('Bucket created!');
  }
}

check();
