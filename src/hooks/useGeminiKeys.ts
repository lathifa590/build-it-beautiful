import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useGeminiKeys() {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) {
        setApiKeys([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data } = await supabase
        .from('user_api_keys')
        .select('api_key')
        .eq('user_id', user.id)
        .eq('provider', 'gemini')
        .eq('is_active', true);
      if (!cancelled) {
        setApiKeys((data ?? []).map((r: { api_key: string }) => r.api_key).filter(Boolean));
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  return { apiKeys, loading };
}
