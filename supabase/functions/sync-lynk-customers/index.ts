import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTRhsuFqwJ33o13hlBnmvc0wptRmWLWrkFcC5q4sP1ShL7iMgpnRI6LFhrHLOMf6rFf5g5CjCl8R8hz/pub?gid=411379202&single=true&output=csv";

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // If NOT called by cron (anon key), validate admin role
    if (token !== anonKey) {
      console.log("[sync-lynk] Manual trigger detected, validating admin...");
      const { data: { user }, error: userError } =
        await supabase.auth.getUser();
      if (userError || !user) {
        console.log("[sync-lynk] Auth failed:", userError?.message);
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userId = user.id;
      console.log("[sync-lynk] User authenticated:", userId);

      const { data: roleData } = await adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        console.log("[sync-lynk] User is not admin");
        return new Response(JSON.stringify({ error: "Admin access required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.log("[sync-lynk] Admin validated");
    } else {
      console.log("[sync-lynk] Cron bypass detected");
    }

    // Fetch CSV
    console.log("[sync-lynk] Fetching CSV...");
    const csvResponse = await fetch(SHEET_CSV_URL);
    if (!csvResponse.ok) {
      throw new Error(`Failed to fetch CSV: ${csvResponse.status}`);
    }

    const csvText = await csvResponse.text();
    const lines = csvText.split("\n").filter((l) => l.trim());
    console.log("[sync-lynk] CSV rows:", lines.length);

    // Parse rows - skip header
    const customers: { email: string; name: string; phone: string }[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      const status = cols[15]?.trim();
      const email = cols[16]?.trim();
      const name = cols[17]?.trim();
      const phone = cols[18]?.trim();

      if (
        status === "SUCCESS" &&
        email &&
        name &&
        email.includes("@")
      ) {
        customers.push({ email: email.toLowerCase(), name, phone: phone || "" });
      }
    }

    console.log("[sync-lynk] Parsed SUCCESS customers:", customers.length);

    if (customers.length === 0) {
      return new Response(
        JSON.stringify({ synced: 0, total: 0, message: "Tidak ada transaksi SUCCESS ditemukan" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default expiry = now + 1 year for newly synced annual customers
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    // Insert as 'annual' with expiry. ignoreDuplicates = true so existing
    // 'lifetime' customers are NOT overwritten.
    const { data, error: upsertError } = await adminClient
      .from("allowed_customers")
      .upsert(
        customers.map((c) => ({
          email: c.email,
          name: c.name,
          phone: c.phone || null,
          account_type: "annual",
          subscription_expires_at: oneYearFromNow.toISOString(),
          lynk_purchased_at: new Date().toISOString(),
        })),
        { onConflict: "email", ignoreDuplicates: true }
      )
      .select();

    if (upsertError) {
      console.log("[sync-lynk] Upsert error:", upsertError.message);
      throw new Error(`Upsert error: ${upsertError.message}`);
    }

    const newCount = data?.length || 0;
    console.log("[sync-lynk] Upserted:", newCount, "of", customers.length);

    return new Response(
      JSON.stringify({
        synced: newCount,
        total: customers.length,
        message: newCount > 0
          ? `${newCount} pelanggan baru ditambahkan dari ${customers.length} transaksi SUCCESS`
          : `Semua ${customers.length} pelanggan sudah ada di database`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
