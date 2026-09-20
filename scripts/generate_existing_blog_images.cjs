const { createClient } = require('@supabase/supabase-js');

async function main() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY; 
  const ninerouterUrl = process.env.NINEROUTER_URL;
  const ninerouterKey = process.env.NINEROUTER_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials in environment");
    process.exit(1);
  }

  if (!ninerouterUrl) {
    console.error("Missing NINEROUTER_URL in environment. e.g. set NINEROUTER_URL=http://localhost:20128");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log("Fetching blog articles missing featured images...");
  const { data: articles, error } = await supabase
    .from('blog_articles')
    .select('*')
    .is('featured_image_url', null);

  if (error) {
    console.error("Error fetching articles:", error.message);
    process.exit(1);
  }

  if (!articles || articles.length === 0) {
    console.log("All articles already have featured images. Exiting.");
    return;
  }

  console.log(`Found ${articles.length} articles missing images.`);

  for (const article of articles) {
    console.log(`\nProcessing: "${article.title}"`);
    const prompt = `A highly relevant, high quality cover image for an education blog post titled "${article.title}". ${article.excerpt || ''}`.slice(0, 500);
    
    try {
      console.log(`Calling 9Router with prompt...`);
      const imgRes = await fetch(`${ninerouterUrl}/v1/images/generations?response_format=binary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(ninerouterKey ? { 'Authorization': `Bearer ${ninerouterKey}` } : {})
        },
        body: JSON.stringify({
          model: "gemini/gemini-2.5-flash-image", 
          prompt: prompt,
          size: "1024x1024"
        })
      });

      if (!imgRes.ok) {
        throw new Error(`9Router error: ${imgRes.status} ${await imgRes.text()}`);
      }

      console.log("Image received! Uploading to Supabase Storage 'blog-images'...");
      
      const buffer = await imgRes.arrayBuffer();
      const fileName = `${article.slug}-${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(fileName, buffer, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) {
        // Create bucket if it doesn't exist? (Assuming user might not have it)
        if (uploadError.message.includes('bucket') || uploadError.statusCode === 400 || uploadError.statusCode === 404) {
           console.log("Bucket might not exist. Attempting to create 'blog-images' bucket...");
           await supabase.storage.createBucket('blog-images', { public: true });
           // Retry upload
           const { error: retryError } = await supabase.storage
            .from('blog-images')
            .upload(fileName, buffer, {
              contentType: 'image/png',
              upsert: true
            });
           if (retryError) throw new Error(`Storage retry upload error: ${retryError.message}`);
        } else {
           throw new Error(`Storage upload error: ${uploadError.message}`);
        }
      }

      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(fileName);

      console.log(`Updating database record to point to: ${publicUrl}`);
      const { error: updateError } = await supabase
        .from('blog_articles')
        .update({ featured_image_url: publicUrl })
        .eq('id', article.id);

      if (updateError) {
        throw new Error(`DB Update error: ${updateError.message}`);
      }
      
      console.log("Success for this article!");

    } catch (err) {
      console.error(`Failed to process article "${article.title}":`, err.message);
    }
  }

  console.log("\nFinished processing all articles.");
}

main();
