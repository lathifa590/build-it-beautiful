import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserApiKey {
  id: string;
  user_id: string;
  provider: 'gemini' | 'openai' | 'anthropic' | 'openrouter';
  api_key: string;
  label?: string;
  is_active: boolean;
  created_at: string;
}

/**
 * Hook to retrieve and refresh the active API keys for the authenticated user.
 */
export function useGeminiKeys() {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<string[]>([]);
  const [keyObjects, setKeyObjects] = useState<UserApiKey[]>([]);
  const [loading, setLoading] = useState(true);

  const reloadKeys = useCallback(async () => {
    if (!user) {
      setApiKeys([]);
      setKeyObjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('user_api_keys')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'gemini')
      .order('created_at', { ascending: true });

    if (!error && data) {
      const activeRows = (data as UserApiKey[]).filter((r) => r.is_active);
      setKeyObjects(data as UserApiKey[]);
      setApiKeys(activeRows.map((r) => r.api_key).filter(Boolean));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    reloadKeys();
  }, [reloadKeys]);

  return {
    apiKeys,
    keyObjects,
    loading,
    hasKeys: apiKeys.length > 0,
    reloadKeys,
  };
}
