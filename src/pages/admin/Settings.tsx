import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Key, Save, Eye, EyeOff, CheckCircle, XCircle, Loader2, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DemoApiKey {
  id: string;
  api_key: string;
  label: string;
  is_active: boolean;
  created_at: string;
}

const AdminSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  // Demo API Keys state
  const [demoKeys, setDemoKeys] = useState<DemoApiKey[]>([]);
  const [newDemoKey, setNewDemoKey] = useState('');
  const [newDemoLabel, setNewDemoLabel] = useState('');
  const [isLoadingDemoKeys, setIsLoadingDemoKeys] = useState(true);
  const [isAddingDemoKey, setIsAddingDemoKey] = useState(false);

  useEffect(() => {
    fetchDemoKeys();
  }, []);

  const fetchDemoKeys = async () => {
    setIsLoadingDemoKeys(true);
    try {
      const { data, error } = await supabase
        .from('demo_api_keys')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      setDemoKeys((data as DemoApiKey[]) || []);
    } catch (error) {
      console.error('Error fetching demo keys:', error);
    } finally {
      setIsLoadingDemoKeys(false);
    }
  };

  const handleAddDemoKey = async () => {
    if (!newDemoKey.trim()) return;
    setIsAddingDemoKey(true);
    try {
      const { error } = await supabase
        .from('demo_api_keys')
        .insert({ api_key: newDemoKey.trim(), label: newDemoLabel.trim() } as any);
      if (error) throw error;
      toast({ title: 'Berhasil', description: 'Demo API key berhasil ditambahkan' });
      setNewDemoKey('');
      setNewDemoLabel('');
      fetchDemoKeys();
    } catch (error) {
      console.error('Error adding demo key:', error);
      toast({ title: 'Error', description: 'Gagal menambahkan demo key', variant: 'destructive' });
    } finally {
      setIsAddingDemoKey(false);
    }
  };

  const handleDeleteDemoKey = async (id: string) => {
    try {
      const { error } = await supabase.from('demo_api_keys').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Berhasil', description: 'Demo API key dihapus' });
      fetchDemoKeys();
    } catch (error) {
      console.error('Error deleting demo key:', error);
      toast({ title: 'Error', description: 'Gagal menghapus demo key', variant: 'destructive' });
    }
  };

  const handleToggleDemoKey = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('demo_api_keys')
        .update({ is_active: !currentStatus } as any)
        .eq('id', id);
      if (error) throw error;
      fetchDemoKeys();
    } catch (error) {
      console.error('Error toggling demo key:', error);
      toast({ title: 'Error', description: 'Gagal mengubah status key', variant: 'destructive' });
    }
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return '••••••••';
    return '••••••••' + key.slice(-8);
  };

  const handleSaveApiKey = async () => {
    if (!geminiApiKey.trim()) {
      toast({ title: 'Error', description: 'API Key tidak boleh kosong', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ gemini_api_key: geminiApiKey })
        .eq('user_id', user?.id);
      if (error) throw error;
      toast({ title: 'Berhasil', description: 'API Key berhasil disimpan' });
      setGeminiApiKey('');
    } catch (error) {
      console.error('Error saving API key:', error);
      toast({ title: 'Error', description: 'Gagal menyimpan API Key', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestApiKey = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: { type: 'test', data: {} },
      });
      if (error) throw error;
      setTestResult('success');
      toast({ title: 'Berhasil', description: 'API Key valid dan berfungsi' });
    } catch (error) {
      console.error('Error testing API key:', error);
      setTestResult('error');
      toast({ title: 'Error', description: 'API Key tidak valid atau terjadi kesalahan', variant: 'destructive' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-2xl">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">Pengaturan</h1>
          <p className="text-muted-foreground mt-1">Konfigurasi API dan preferensi sistem</p>
        </div>

        {/* API Key Settings */}
        <div className="bg-card border-2 border-foreground rounded-xl p-6 shadow-brutal">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-primary/10 rounded-lg border-2 border-primary/30">
              <Key className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Gemini API Key</h2>
              <p className="text-sm text-muted-foreground">Opsional - untuk penggunaan API Gemini pribadi</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">API Key</label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="Masukkan Gemini API Key..."
                  className="w-full pr-12 py-3 px-4 border-2 border-foreground/30 rounded-lg focus:border-foreground outline-none bg-background transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">API Key akan dienkripsi dan disimpan dengan aman di database.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSaveApiKey}
                disabled={isSaving || !geminiApiKey.trim()}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground font-bold border-2 border-foreground rounded-lg shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                <span>Simpan API Key</span>
              </button>
              <button
                onClick={handleTestApiKey}
                disabled={isTesting}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-secondary border-2 border-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50"
              >
                {isTesting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : testResult === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-success" />
                ) : testResult === 'error' ? (
                  <XCircle className="w-5 h-5 text-destructive" />
                ) : (
                  <Key className="w-5 h-5" />
                )}
                <span>Test Koneksi</span>
              </button>
            </div>
          </div>
        </div>

        {/* Demo API Keys Section */}
        <div className="bg-card border-2 border-foreground rounded-xl p-6 shadow-brutal">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-accent/30 rounded-lg border-2 border-accent/50">
              <Key className="w-6 h-6 text-accent-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Demo API Keys</h2>
              <p className="text-sm text-muted-foreground">
                API key Gemini untuk user yang tidak punya key sendiri (round-robin)
              </p>
            </div>
          </div>

          {/* Add new demo key */}
          <div className="space-y-3 mb-6">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newDemoKey}
                onChange={(e) => setNewDemoKey(e.target.value)}
                placeholder="Masukkan API Key..."
                className="flex-1 py-2 px-3 border-2 border-foreground/30 rounded-lg focus:border-foreground outline-none bg-background transition-colors text-sm"
              />
              <input
                type="text"
                value={newDemoLabel}
                onChange={(e) => setNewDemoLabel(e.target.value)}
                placeholder="Label (opsional)"
                className="w-full sm:w-40 py-2 px-3 border-2 border-foreground/30 rounded-lg focus:border-foreground outline-none bg-background transition-colors text-sm"
              />
            </div>
            <button
              onClick={handleAddDemoKey}
              disabled={isAddingDemoKey || !newDemoKey.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-bold border-2 border-foreground rounded-lg shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isAddingDemoKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>Tambah Key</span>
            </button>
          </div>

          {/* List demo keys */}
          {isLoadingDemoKeys ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : demoKeys.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada demo API key.</p>
          ) : (
            <div className="space-y-2">
              {demoKeys.map((key, index) => (
                <div
                  key={key.id}
                  className={`flex items-center justify-between gap-3 p-3 rounded-lg border-2 ${
                    key.is_active ? 'border-foreground/20 bg-background' : 'border-foreground/10 bg-muted/50 opacity-60'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground">#{index + 1}</span>
                      <code className="text-sm font-mono truncate">{maskApiKey(key.api_key)}</code>
                    </div>
                    {key.label && (
                      <span className="text-xs text-muted-foreground">{key.label}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleDemoKey(key.id, key.is_active)}
                      className="p-2 rounded-md hover:bg-muted transition-colors"
                      title={key.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                      {key.is_active ? (
                        <ToggleRight className="w-5 h-5 text-primary" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteDemoKey(key.id)}
                      className="p-2 rounded-md hover:bg-destructive/10 text-destructive transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-info/10 border-2 border-info/30 rounded-xl p-4">
          <p className="text-sm text-info">
            <strong>Catatan:</strong> User yang tidak memiliki API Key pribadi akan otomatis menggunakan Demo API Keys secara round-robin.
            Jika tidak ada demo key aktif, sistem fallback ke Lovable AI Gateway.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
