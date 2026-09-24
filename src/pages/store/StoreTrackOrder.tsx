import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Package, Clock, ArrowLeft, History, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TopBar } from '@/components/landing/TopBar';
import { Footer } from '@/components/landing/Footer';

export default function StoreTrackOrder() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [invoice, setInvoice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localHistory, setLocalHistory] = useState<any[]>([]);

  useEffect(() => {
    try {
      const historyStr = localStorage.getItem('my_store_orders');
      if (historyStr) {
        setLocalHistory(JSON.parse(historyStr));
      }
    } catch (e) {
      console.error("Gagal load history", e);
    }
  }, []);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !invoice.trim()) {
      toast.error('Email dan No. Invoice wajib diisi');
      return;
    }

    setIsLoading(true);
    try {
      let queryInvoice = invoice.trim();
      // Remove INV- prefix if user typed it
      if (queryInvoice.toUpperCase().startsWith('INV-')) {
        queryInvoice = queryInvoice.substring(4);
      }

      const { data, error } = await supabase
        .from('store_orders')
        .select('order_id, invoice_number')
        .ilike('buyer_email', email.trim())
        .ilike('invoice_number', `%${queryInvoice}%`)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error('Pesanan tidak ditemukan. Pastikan Email dan No Invoice benar.');
      } else {
        toast.success('Pesanan ditemukan!');
        navigate(`/checkout/${data.order_id}`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Gagal melacak pesanan');
    } finally {
      setIsLoading(false);
    }
  };

  const removeHistory = (orderId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newHistory = localHistory.filter(h => h.order_id !== orderId);
    setLocalHistory(newHistory);
    localStorage.setItem('my_store_orders', JSON.stringify(newHistory));
  };

  return (
    <div className="min-h-screen bg-[#f5f0e8] font-sans flex flex-col">
      <TopBar />
      
      <main className="flex-1 flex flex-col pt-24 pb-12 px-4 md:px-8">
        <div className="max-w-4xl mx-auto w-full grid md:grid-cols-[1fr_350px] gap-8">
          
          <div className="space-y-6">
            <Link to="/store" className="inline-flex items-center gap-2 text-gray-600 hover:text-[#111] font-bold text-sm transition-colors w-fit">
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Toko
            </Link>

            <div className="bg-white p-8 rounded-2xl border-2 border-[#111] shadow-[6px_6px_0_0_#111]">
              <div className="mb-6">
                <div className="w-12 h-12 bg-amber-50 border-2 border-amber-400 rounded-xl flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-amber-600" />
                </div>
                <h1 className="text-2xl font-black text-[#111] font-heading mb-2">Lacak Pesanan Anda</h1>
                <p className="text-gray-600 text-sm">Masukkan detail pembelian Anda untuk melihat status pembayaran dan mengunduh modul ajar.</p>
              </div>

              <form onSubmit={handleTrack} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[#111] mb-1.5">Email Pembelian</label>
                  <input 
                    type="email" 
                    required
                    placeholder="Misal: budi@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 border-2 border-[#111] rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#111] mb-1.5">Nomor Invoice</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Misal: INV-123456789"
                    value={invoice}
                    onChange={(e) => setInvoice(e.target.value)}
                    className="w-full p-3 border-2 border-[#111] rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-500/20 transition-all font-mono text-sm"
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full mt-2 py-3 px-6 bg-[#111] text-white font-bold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  {isLoading ? 'Mencari...' : 'Lacak Sekarang'}
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border-2 border-[#111] shadow-[4px_4px_0_0_#111]">
              <h2 className="text-lg font-black text-[#111] font-heading mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                Riwayat di Perangkat Ini
              </h2>
              
              {localHistory.length > 0 ? (
                <div className="space-y-3">
                  {localHistory.map((hist, i) => (
                    <Link 
                      key={i} 
                      to={`/checkout/${hist.order_id}`}
                      className="block p-3 border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl transition-all group relative"
                    >
                      <button 
                        onClick={(e) => removeHistory(hist.order_id, e)}
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Hapus dari riwayat"
                      >
                        <ArrowLeft className="w-3 h-3 rotate-45" /> 
                      </button>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{hist.invoice_number}</p>
                      <p className="text-sm font-bold text-[#111] line-clamp-2 pr-4">{hist.title || 'Modul Ajar'}</p>
                      <div className="mt-2 flex items-center gap-1 text-xs text-blue-600 font-bold">
                        Lihat Status <ArrowRight className="w-3 h-3" />
                      </div>
                    </Link>
                  ))}
                  <p className="text-[11px] text-gray-500 text-center pt-2">Data ini disimpan secara lokal di browser Anda.</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Package className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">Belum ada riwayat pesanan di perangkat ini.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
