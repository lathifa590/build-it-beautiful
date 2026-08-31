import React from 'react';
import { Package, Check, Eye, Clock, Receipt } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storeApi } from '@/lib/store-api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const StoreOrdersTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['storeProfile', user?.id],
    queryFn: () => storeApi.getMyStoreProfile(user!.id),
    enabled: !!user?.id,
  });

  const { data: orders, isLoading } = useQuery({
    queryKey: ['storeOrders', profile?.store_id],
    queryFn: () => storeApi.getMyStoreOrders(profile!.store_id),
    enabled: !!profile?.store_id,
  });

  const confirmMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return storeApi.updateOrderStatus(orderId, { status: 'SELESAI' });
    },
    onSuccess: () => {
      toast.success('Pembayaran berhasil dikonfirmasi');
      queryClient.invalidateQueries({ queryKey: ['storeOrders'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal mengkonfirmasi pembayaran');
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="section-heading mb-0 border-none pb-0">Pesanan Masuk</h3>
        <p className="text-sm font-semibold text-muted-foreground mt-1">Pantau dan kelola pembelian Modul Ajar Anda.</p>
      </div>
      
      {isLoading ? (
        <div>Memuat pesanan...</div>
      ) : orders && orders.length > 0 ? (
        <div className="bg-white border-2 border-[#111] rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f5f0e8] border-b-2 border-[#111]">
                <th className="p-4 font-black whitespace-nowrap">Invoice</th>
                <th className="p-4 font-black whitespace-nowrap">Produk</th>
                <th className="p-4 font-black whitespace-nowrap">Pembeli</th>
                <th className="p-4 font-black whitespace-nowrap">Total</th>
                <th className="p-4 font-black whitespace-nowrap">Status</th>
                <th className="p-4 font-black whitespace-nowrap text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.order_id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-4 font-bold text-sm">{order.invoice_number}</td>
                  <td className="p-4 text-sm font-semibold">{order.listing?.title}</td>
                  <td className="p-4">
                    <p className="font-bold text-sm">{order.buyer_name}</p>
                    <p className="text-xs text-gray-500">{order.buyer_email}</p>
                  </td>
                  <td className="p-4 font-bold text-[#c04a1a]">
                    {order.total_amount === 0 ? 'Gratis' : `Rp${order.total_amount.toLocaleString('id-ID')}`}
                  </td>
                  <td className="p-4">
                    {order.status === 'SELESAI' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded">
                        <Check className="w-3 h-3" /> Selesai
                      </span>
                    ) : order.status === 'PENDING_REVIEW' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded">
                        <Clock className="w-3 h-3" /> Review
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded">
                        <Receipt className="w-3 h-3" /> Belum Bayar
                      </span>
                    )}
                  </td>
                  <td className="p-4 flex gap-2 justify-center">
                    {order.payment_proof_url && (
                      <button 
                        onClick={() => window.open(order.payment_proof_url!, '_blank')}
                        className="p-2 bg-gray-100 hover:bg-gray-200 border border-[#111] rounded text-[#111] transition-colors"
                        title="Lihat Bukti"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    {order.status === 'PENDING_REVIEW' && (
                      <button 
                        onClick={() => {
                          if (confirm('Konfirmasi pembayaran ini? Pembeli akan langsung bisa mengunduh modul.')) {
                            confirmMutation.mutate(order.order_id);
                          }
                        }}
                        className="p-2 bg-green-50 hover:bg-green-100 border border-green-800 rounded text-green-800 transition-colors font-bold text-xs flex items-center gap-1"
                        disabled={confirmMutation.isPending}
                      >
                        <Check className="w-4 h-4" /> Konfirmasi
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card">
          <div className="card-body flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-[#f5f0e8] border-2 border-[#111] rounded-full flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-[#111]" />
            </div>
            <h4 className="text-lg font-black mb-1">Belum ada pesanan</h4>
            <p className="text-sm font-semibold text-muted-foreground max-w-sm">
              Saat ini belum ada pembeli yang memesan Modul Ajar Anda.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreOrdersTab;
