import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { user_id, email } = await req.json();
    if (!user_id && !email) {
      return json({ error: 'user_id atau email wajib diisi' }, 400);
    }

    const url = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const admin = createClient(url, serviceKey);

    // Verify caller is admin
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return json({ error: 'Unauthorized' }, 401);
    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: userData } = await userClient.auth.getUser();
    const callerId = userData?.user?.id;
    if (!callerId) return json({ error: 'Unauthorized' }, 401);
    const { data: isAdminData } = await admin.rpc('has_role', { _user_id: callerId, _role: 'admin' });
    if (!isAdminData) return json({ error: 'Forbidden' }, 403);

    // Resolve target
    let targetUserId: string | null = user_id ?? null;
    let targetEmail: string | null = email ? String(email).toLowerCase().trim() : null;

    if (!targetUserId && targetEmail) {
      const { data: p } = await admin.from('profiles').select('user_id').eq('email', targetEmail).maybeSingle();
      if (p?.user_id) targetUserId = p.user_id;
    }
    if (targetUserId && !targetEmail) {
      const { data: p } = await admin.from('profiles').select('email').eq('user_id', targetUserId).maybeSingle();
      if (p?.email) targetEmail = String(p.email).toLowerCase().trim();
    }

    // 1) Deactivate agency members & return slot to owner
    if (targetUserId || targetEmail) {
      let membersQuery = admin.from('agency_members').select('id, agency_owner_id, tier, is_active');
      if (targetUserId) membersQuery = membersQuery.eq('user_id', targetUserId);
      else membersQuery = membersQuery.ilike('email', targetEmail!);
      const { data: members } = await membersQuery;

      for (const m of members ?? []) {
        if (m.is_active) {
          await admin.from('agency_members').update({ is_active: false }).eq('id', m.id);
          // decrement owner used counter
          const col = `${m.tier}_used`;
          const { data: owner } = await admin.from('agency_owners').select(`id, ${col}`).eq('id', m.agency_owner_id).maybeSingle();
          const used = (owner as any)?.[col] ?? 0;
          if (used > 0) {
            await admin.from('agency_owners').update({ [col]: used - 1 }).eq('id', m.agency_owner_id);
          }
        }
      }
    }

    // 2) Expire agency invites for this email
    if (targetEmail) {
      await admin.from('agency_invites').update({ status: 'expired' }).ilike('email', targetEmail).in('status', ['pending', 'accepted']);
    }

    // 3) Remove from allowed_customers whitelist
    if (targetEmail) {
      await admin.from('allowed_customers').delete().ilike('email', targetEmail);
    }

    // 4) Delete profile & roles (bypasses RLS via service role)
    if (targetUserId) {
      await admin.from('user_roles').delete().eq('user_id', targetUserId);
      await admin.from('profiles').delete().eq('user_id', targetUserId);
    }
    if (targetEmail) {
      await admin.from('profiles').delete().ilike('email', targetEmail);
    }

    // 5) Delete auth user (blocks re-login)
    if (targetUserId) {
      const { error: delErr } = await admin.auth.admin.deleteUser(targetUserId);
      if (delErr) console.error('deleteUser error:', delErr);
    }

    return json({ success: true, user_id: targetUserId, email: targetEmail });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }

  function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
