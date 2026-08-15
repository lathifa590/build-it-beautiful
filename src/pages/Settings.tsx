import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeft, Key, Eye, EyeOff, CheckCircle, XCircle, Loader2,
  ExternalLink, AlertTriangle, Info, Plus, Trash2, Power, PowerOff, Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UsageStats } from '@/components/settings/UsageStats';

type Provider = 'gemini' | 'grok' | 'openai';

interface UserApiKey {
  id: string;
  api_key: string;
  label: string;
  is_active: boolean;
  created_at: string;
  provider: Provider;
}

const PROVIDER_INFO: Record<Provider, { label: string; placeholder: string; url: string; color: string; emoji: string }> = {
  gemini: { label: 'Gemini (Google)', placeholder: 'AIzaSy...', url: 'https://aistudio.google.com/apikey', color: 'bg-blue-100 text-blue-700 border-blue-300', emoji: '✨' },
  grok:   { label: 'GROK (xAI)',      placeholder: 'xai-...',   url: 'https://console.x.ai/team/default/api-keys', color: 'bg-purple-100 text-purple-700 border-purple-300', emoji: '🤖' },
  openai: { label: 'OpenAI',           placeholder: 'sk-...',    url: 'https://platform.openai.com/api-keys', color: 'bg-green-100 text-green-700 border-green-300', emoji: '🧠' },
};

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [apiKeys, setApiKeys] = useState<UserApiKey[]>([]);
  const [preferredProvider, setPreferredProvider] = useState<Provider | ''>('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [newKeyProvider, setNewKeyProvider] = useState<Provider>('gemini');
  const [showNewKey, setShowNewKey] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setIsLoading(true);
      const [{ data: keys }, { data: profile }] = await Promise.all([
        supabase.from('user_api_keys').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
        supabase.from('profiles').select('preferred_provider').eq('user_id', user.id).maybeSingle(),
      ]);
      if (keys) setApiKeys(keys as UserApiKey[]);
      if (profile?.preferred_provider) setPreferredProvider(profile.preferred_provider as Provider);
      setIsLoading(false);
    };
    load();
  }, [user]);

  const maskKey = (key: string) => key.length <= 8 ? '••••••••' : key.slice(0, 6) + '••••••••' + key.slice(-4);
  
  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handlePreferredChange = async (value: Provider | '') => {
    setPreferredProvider(value);
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ preferred_provider: value || null })
      .eq('user_id', user.id);
    if (error) {
      toast({ title: 'Error', description: 'Gagal menyimpan preferensi', variant: 'destructive' });
    } else {
      toast({ title: 'Tersimpan', description: value ? `Provider utama: ${PROVIDER_INFO[value as Provider].label}` : 'Pakai sistem default' });
    }
  };

  const handleAddKey = async () => {
    if (!newKeyValue.trim()) {
      toast({ title: 'Error', description: 'API Key tidak boleh kosong', variant: 'destructive' });
      return;
    }
    setIsAdding(true);
    try {
      const { data, error } = await supabase
        .from('user_api_keys')
        .insert({ user_id: user!.id, api_key: newKeyValue.trim(), label: newKeyLabel.trim() || '', provider: newKeyProvider })
        .select()
        .single();
      if (error) throw error;
      setApiKeys(prev => [...prev, data as UserApiKey]);
      setNewKeyValue('');
      setNewKeyLabel('');
      toast({ title: 'Berhasil', description: 'API Key ditambahkan' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Gagal menambahkan API Key', variant: 'destructive' });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    const { error } = await supabase.from('user_api_keys').delete().eq('id', id);
    if (error) return toast({ title: 'Error', description: 'Gagal hapus', variant: 'destructive' });
    setApiKeys(prev => prev.filter(k => k.id !== id));
    toast({ title: 'Berhasil', description: 'API Key dihapus' });
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase.from('user_api_keys').update({ is_active: !currentActive }).eq('id', id);
    if (error) return toast({ title: 'Error', description: 'Gagal mengubah status', variant: 'destructive' });
    setApiKeys(prev => prev.map(k => k.id === id ? { ...k, is_active: !currentActive } : k));
  };

  const handleTestApiKey = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: { type: 'test', data: {} },
      });
      if (error) throw error;
      if (data?.error || data?.success === false) {
        setTestResult('error');
        toast({ title: 'Test Gagal', description: data.error || 'Terjadi kesalahan', variant: 'destructive' });
      } else {
        setTestResult('success');
        toast({ title: 'Berhasil', description: data.model ? `✅ Valid! Model: ${data.model}` : '✅ Valid!' });
      }
    } catch (e) {
      console.error(e);
      setTestResult('error');
      toast({ title: 'Error', description: 'Gagal menghubungi server', variant: 'destructive' });
    } finally {
      setIsTesting(false);
    }
  };

  // Group keys by provider
  const keysByProvider: Record<Provider, UserApiKey[]> = {
    gemini: apiKeys.filter(k => k.provider === 'gemini'),
    grok: apiKeys.filter(k => k.provider === 'grok'),
    openai: apiKeys.filter(k => k.provider === 'openai'),
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b-2 border-foreground px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/app')} className="p-2 hover:bg-secondary rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold">⚙️ Pengaturan</h1>
            <p className="text-sm text-muted-foreground">Konfigurasi AI provider untuk generate konten</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Provider Picker */}
        <div className="bg-card border-2 border-foreground rounded-xl p-6 shadow-brutal">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-accent/10 rounded-lg border-2 border-accent/30">
              <Sparkles className="w-6 h-6 text-accent-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-bold">🎯 Provider AI Utama</h2>
              <p className="text-sm text-muted-foreground">Pilih AI yang dipakai pertama kali untuk generate konten</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['', 'gemini', 'grok', 'openai'] as const).map(p => (
              <button
                key={p || 'default'}
                onClick={() => handlePreferredChange(p)}
                className={`p-3 rounded-lg border-2 text-sm font-bold transition-all ${
                  preferredProvider === p
                    ? 'bg-primary text-primary-foreground border-foreground shadow-brutal-sm'
                    : 'bg-card border-foreground/20 hover:border-foreground/50'
                }`}
              >
                {p === '' ? '🔧 Default' : `${PROVIDER_INFO[p].emoji} ${PROVIDER_INFO[p].label.split(' ')[0]}`}
              </button>
            ))}
          </div>
          
          <div className="mt-3 p-3 bg-muted/40 rounded-md text-xs text-muted-foreground flex gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Sistem akan coba key provider terpilih dulu. Jika gagal/habis kuota, otomatis fallback ke sistem default.</span>
          </div>
        </div>

        {/* API Keys per Provider */}
        <div className="bg-card border-2 border-foreground rounded-xl p-6 shadow-brutal">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-primary/10 rounded-lg border-2 border-primary/30">
              <Key className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">🔑 API Keys</h2>
              <p className="text-sm text-muted-foreground">Tambahkan key dari Gemini, GROK, atau OpenAI</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="mb-6 p-4 bg-muted/30 border-2 border-dashed border-muted-foreground/30 rounded-lg text-center text-sm text-muted-foreground">
              Belum ada API Key. Tambahkan di bawah.
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              {(['gemini', 'grok', 'openai'] as Provider[]).map(p => (
                keysByProvider[p].length > 0 && (
                  <div key={p}>
                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 mb-2 rounded-md border text-xs font-bold ${PROVIDER_INFO[p].color}`}>
                      <span>{PROVIDER_INFO[p].emoji}</span>
                      <span>{PROVIDER_INFO[p].label}</span>
                    </div>
                    <div className="space-y-2">
                      {keysByProvider[p].map((key, idx) => (
                        <div key={key.id} className={`flex items-center gap-3 p-3 border-2 rounded-lg ${key.is_active ? 'border-foreground/30 bg-background' : 'border-muted-foreground/20 bg-muted/30 opacity-60'}`}>
                          <div className="shrink-0 w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-xs">{idx + 1}</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-mono text-sm truncate">
                              {visibleKeys.has(key.id) ? key.api_key : maskKey(key.api_key)}
                            </div>
                            {key.label && <div className="text-xs text-muted-foreground truncate">{key.label}</div>}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => toggleKeyVisibility(key.id)} className="p-1.5 hover:bg-secondary rounded-md">
                              {visibleKeys.has(key.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button onClick={() => handleToggleActive(key.id, key.is_active)} className={`p-1.5 rounded-md hover:bg-secondary ${key.is_active ? 'text-success' : 'text-muted-foreground'}`}>
                              {key.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                            </button>
                            <button onClick={() => handleDeleteKey(key.id)} className="p-1.5 hover:bg-destructive/10 text-destructive rounded-md">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}

          {/* Add new key */}
          <div className="space-y-3 p-4 bg-secondary/30 border-2 border-foreground/20 rounded-lg">
            <div className="text-xs font-bold uppercase text-muted-foreground">Tambah API Key Baru</div>
            
            {/* Provider selector */}
            <div className="grid grid-cols-3 gap-2">
              {(['gemini', 'grok', 'openai'] as Provider[]).map(p => (
                <button
                  key={p}
                  onClick={() => setNewKeyProvider(p)}
                  className={`p-2 rounded-md border-2 text-xs font-bold transition-all ${
                    newKeyProvider === p
                      ? 'bg-primary text-primary-foreground border-foreground'
                      : 'bg-card border-foreground/20 hover:border-foreground/50'
                  }`}
                >
                  {PROVIDER_INFO[p].emoji} {PROVIDER_INFO[p].label.split(' ')[0]}
                </button>
              ))}
            </div>
            
            <div className="relative">
              <input
                type={showNewKey ? 'text' : 'password'}
                value={newKeyValue}
                onChange={(e) => setNewKeyValue(e.target.value)}
                placeholder={PROVIDER_INFO[newKeyProvider].placeholder}
                className="w-full pr-12 py-3 px-4 border-2 border-foreground/30 rounded-lg focus:border-foreground outline-none bg-background"
              />
              <button type="button" onClick={() => setShowNewKey(!showNewKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showNewKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <input
              type="text"
              value={newKeyLabel}
              onChange={(e) => setNewKeyLabel(e.target.value)}
              placeholder="Label (opsional)"
              className="w-full py-2 px-4 border-2 border-foreground/20 rounded-lg focus:border-foreground outline-none bg-background text-sm"
            />
            <a href={PROVIDER_INFO[newKeyProvider].url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              Dapatkan {PROVIDER_INFO[newKeyProvider].label} API Key <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={handleAddKey}
              disabled={isAdding || !newKeyValue.trim()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground font-bold border-2 border-foreground rounded-lg shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
            >
              {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              <span>Tambah Key</span>
            </button>
          </div>

          {/* Test connection */}
          <div className="mt-4">
            <button
              onClick={handleTestApiKey}
              disabled={isTesting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-secondary border-2 border-foreground rounded-lg hover:bg-secondary/80 disabled:opacity-50"
            >
              {isTesting ? <Loader2 className="w-5 h-5 animate-spin" /> :
                testResult === 'success' ? <CheckCircle className="w-5 h-5 text-success" /> :
                testResult === 'error' ? <XCircle className="w-5 h-5 text-destructive" /> :
                <Key className="w-5 h-5" />}
              <span>🔌 Test Koneksi</span>
            </button>
          </div>
        </div>

        {user && <UsageStats userId={user.id} />}

        <div className="bg-warning/10 border-2 border-warning/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold text-warning mb-1">⚠️ Penting:</p>
              <ul className="space-y-1 text-warning/80">
                <li>• Provider utama dipakai pertama, sistem default jadi cadangan</li>
                <li>• GROK juga bisa generate gambar (model grok-2-image)</li>
                <li>• Jangan bagikan API Key ke orang lain</li>
                <li>• Key disimpan aman di database (RLS aktif)</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 bg-secondary border-2 border-foreground/30 rounded-lg hover:bg-secondary/80">
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Generator
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Settings;
