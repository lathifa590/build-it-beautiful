import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jjgfpcedibgkkodydrci.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZ2ZwY2VkaWJna2tvZHlkcmNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1OTE2NDYsImV4cCI6MjEwMjE2NzY0Nn0.5oOBZXsyVQbW0JCmrxMYR8WOZi7QYq4JcyT6zLl5r4A'
);

async function test() {
  console.log("Fetching documents...");
  const { data, error } = await supabase
    .from('documents')
    .select(`
      id, document_type, title, current_version_id,
      document_versions!fk_documents_current_version (
        content_json
      )
    `)
    .limit(1);

  if (error) {
    console.error("Error:", JSON.stringify(error, null, 2));
  } else {
    console.log("Success! Data length:", data.length);
  }
}

test();
