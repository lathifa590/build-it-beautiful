import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGeminiKeys, UserApiKey } from '../hooks/useGeminiKeys';
import { Key, Eye, EyeOff, Trash2, Plus, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface ApiKeyManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiKeyManagerModal: React.FC<ApiKeyManagerModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { keyObjects, loading, reloadKeys } = useGeminiKeys();

  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [visibleKeyIds, setVisibleKeyIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const maskKey = (key: string) => {
    if (key.length <= 8) return '••••••••';
    return `${key.slice(0, 6)}••••••••${key.slice(-4)}`;
  };

  const toggleVisibility = (id: string) => {
    setVisibleKeyIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !user) return;

    setIsSubmitting(true);
    setTestResult(null);

    try {
      const { error } = await supabase.from('user_api_keys').insert({
        user_id: user.id,
        provider: 'gemini',
        api_key: newKey.trim(),
        label: newLabel.trim() || 'API Key',
        is_active: true,
      });

      if (error) throw error;

      setNewKey('');
      setNewLabel('');
      await reloadKeys();
    } catch (err: any) {
      alert(err.message || 'Gagal menambahkan API Key.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (keyItem: UserApiKey) => {
    try {
      const { error } = await supabase
        .from('user_api_keys')
        .update({ is_active: !keyItem.is_active })
        .eq('id', keyItem.id);

      if (error) throw error;
      await reloadKeys();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status key.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus API Key ini dari akun Anda?')) return;
    try {
      const { error } = await supabase.from('user_api_keys').delete().eq('id', id);
      if (error) throw error;
      await reloadKeys();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus key.');
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-content-core', {
        body: { type: 'test' },
      });

      if (error) throw error;
      if (data?.success) {
        setTestResult({
          success: true,
          message: data.message || `Terhubung via model ${data.model}!`,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Uji coba gagal. Periksa kembali API Key Anda.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Gagal menghubungi Edge Function.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Pengaturan API Key Gemini (BYOK)
              </h2>
              <p className="text-xs text-slate-500">
                Gunakan beberapa key sekaligus untuk rotasi otomatis saat limit 429.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-semibold"
          >
            ✕
          </button>
        </div>

        {/* Key List */}
        <div className="my-4 max-h-56 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <p className="text-sm text-slate-500 py-4 text-center">Memuat daftar key...</p>
          ) : keyObjects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center">
              <p className="text-sm text-slate-500 mb-1">Belum ada API Key Gemini yang disimpan.</p>
              <p className="text-xs text-slate-400">
                Dapatkan gratis di Google AI Studio (aistudio.google.com).
              </p>
            </div>
          ) : (
            keyObjects.map((k) => {
              const isVisible = visibleKeyIds.has(k.id);
              return (
                <div
                  key={k.id}
                  className={`flex items-center justify-between p-3 rounded-xl border text-sm transition-all ${
                    k.is_active
                      ? 'border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40'
                      : 'border-slate-100 bg-slate-100/50 opacity-60 dark:border-slate-800/40 dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={k.is_active}
                      onChange={() => handleToggleActive(k)}
                      title={k.is_active ? 'Nonaktifkan key' : 'Aktifkan key'}
                      className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                    />
                    <div>
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {k.label || 'Gemini Key'}
                      </div>
                      <code className="text-xs font-mono text-slate-500">
                        {isVisible ? k.api_key : maskKey(k.api_key)}
                      </code>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleVisibility(k.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Lihat / Sembunyikan"
                    >
                      {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(k.id)}
                      className="p-1.5 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Hapus Key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add Key Form */}
        <form onSubmit={handleAddKey} className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Label (mis: Key 1)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="col-span-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="password"
              placeholder="Tempel API Key AI Studio (AIza...)"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="col-span-2 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={isTesting || keyObjects.length === 0}
              onClick={handleTestConnection}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Menguji...
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  Uji Koneksi
                </>
              )}
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !newKey.trim()}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {isSubmitting ? 'Menyimpan...' : 'Tambah Key'}
            </button>
          </div>

          {/* Test Status Banner */}
          {testResult && (
            <div
              className={`flex items-center gap-2 p-2.5 rounded-lg text-xs mt-2 ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {testResult.success ? (
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
