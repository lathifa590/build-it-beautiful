import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://jjgfpcedibgkkodydrci.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZ2ZwY2VkaWJna2tvZHlkcmNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1OTE2NDYsImV4cCI6MjEwMjE2NzY0Nn0.5oOBZXsyVQbW0JCmrxMYR8WOZi7QYq4JcyT6zLl5r4A";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
  const { data: history, error: historyError } = await supabase
    .from('content_history')
    .select('user_id');

  if (historyError) {
    console.log("Error:", historyError);
    return;
  }
  
  const uniqueUsers = new Set(history.map(h => h.user_id));
  console.log(`Found ${history.length} records across ${uniqueUsers.size} unique user_ids.`);
  console.log("Unique user_ids:", Array.from(uniqueUsers));
}

check();
