import { createClient } from '@supabase/supabase-js';

// Get these from Supabase dashboard
const SUPABASE_URL = 'https://mydftxtzwjwhrcvxrykv.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15ZGZ0eHR6d2p3aHJjdnhyeWt2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk0MzU2MSwiZXhwIjoyMDgzNTE5NTYxfQ.-x3ax4Lr4YZXkhTsakeJKNAOtd0c_WUi7jj4WeQLSf4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
