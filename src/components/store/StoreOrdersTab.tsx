import React, { useState } from 'react';
import { Package, Check, Eye, Clock, Receipt, MessageCircle, Search } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storeApi } from '@/lib/store-api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const StoreOrdersTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

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

  const filteredOrders = orders?.filter(order => {
    if (filterStatus !== 'ALL' && order.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!order.invoice_number?.toLowerCase().includes(q) &&
          !order.buyer_name?.toLowerCase().includes(q) &&
          !order.listing?.title?.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#111]">Pesanan Masuk</h2>
          <p className="text-sm font-semibold text-muted-foreground mt-1">Pantau dan kelola pembelian Modul Ajar Anda.</p>
        </div>
      </div>

      <div className="catalog-filter-bar">
        <input 
          type="text" 
          placeholder="Cari invoice atau nama..." 
          className="catalog-search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select 
          className="catalog-filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="ALL">Semua Status</option>
          <option value="SELESAI">Selesai</option>
          <option value="PENDING_REVIEW">Review</option>
          <option value="PENDING_PAYMENT">Belum Bayar</option>
        </select>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#111]"></div>
        </div>
      ) : filteredOrders && filteredOrders.length > 0 ? (
        <>
          {/* Desktop Table */}
          <div className="orders-table-wrap">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Produk</th>
                  <th>Pembeli</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th className="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.order_id}>
                    <td className="order-invoice">{order.invoice_number}</td>
                    <td className="font-bold">{order.listing?.title}</td>
                    <td>
                      <p className="font-bold text-sm">{order.buyer_name}</p>
                      {order.buyer_whatsapp && (
                        <a
                          href={`https://wa.me/${order.buyer_whatsapp.replace(/\D/g, '').replace(/^0/, '62')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-green-700 font-bold hover:underline mt-1 bg-green-50 px-1.5 py-0.5 rounded border border-green-200"
                          title="Chat Pembeli di WhatsApp"
                        >
                          <MessageCircle className="w-3 h-3" /> WA
                        </a>
                      )}
                    </td>
                    <td className="order-total">
                      {order.total_amount === 0 ? 'Gratis' : `Rp${order.total_amount.toLocaleString('id-ID')}`}
                    </td>
                    <td>
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
                    <td className="flex justify-center gap-2">
                      {order.payment_proof_url && (
                        <button 
                          onClick={() => window.open(order.payment_proof_url!, '_blank')}
                          className="p-1.5 bg-gray-100 hover:bg-gray-200 border-2 border-[#111] rounded shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] text-[#111] transition-all hover:translate-y-px hover:shadow-none"
                          title="Lihat Bukti"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      {order.status !== 'SELESAI' && (
                        <button 
                          onClick={() => {
                            if (confirm(`Konfirmasi pembayaran untuk invoice ${order.invoice_number}? Pembeli akan langsung bisa mengunduh modul.`)) {
                              confirmMutation.mutate(order.order_id);
                            }
                          }}
                          className="p-1.5 bg-green-100 hover:bg-green-200 border-2 border-green-800 rounded shadow-[2px_2px_0px_0px_rgba(22,101,52,1)] text-green-800 transition-all font-bold text-xs flex items-center gap-1 hover:translate-y-px hover:shadow-none"
                          disabled={confirmMutation.isPending}
                          title="Setujui Pembayaran"
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

          {/* Mobile Card List */}
          <div className="orders-card-list">
            {filteredOrders.map((order) => (
              <div key={order.order_id} className="order-card-mobile">
                <div className="order-card-mobile__header">
                  <span className="order-card-mobile__invoice">{order.invoice_number}</span>
                  {order.status === 'SELESAI' ? (
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[10px] font-black rounded border border-green-800">SELESAI</span>
                  ) : order.status === 'PENDING_REVIEW' ? (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-black rounded border border-blue-800">REVIEW</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded border border-amber-800">BELUM BAYAR</span>
                  )}
                </div>
                <h4 className="order-card-mobile__product">{order.listing?.title}</h4>
                <div className="order-card-mobile__buyer flex items-center justify-between">
                  <span>{order.buyer_name}</span>
                  {order.buyer_whatsapp && (
                    <a
                      href={`https://wa.me/${order.buyer_whatsapp.replace(/\D/g, '').replace(/^0/, '62')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-green-700 font-bold bg-green-50 px-1.5 py-0.5 rounded border border-green-200"
                    >
                      <MessageCircle className="w-3 h-3" /> Hubungi
                    </a>
                  )}
                </div>
                <div className="order-card-mobile__footer">
                  <span className="order-card-mobile__total">
                    {order.total_amount === 0 ? 'Gratis' : `Rp${order.total_amount.toLocaleString('id-ID')}`}
                  </span>
                  <div className="flex gap-2">
                    {order.payment_proof_url && (
                      <button 
                        onClick={() => window.open(order.payment_proof_url!, '_blank')}
                        className="p-1.5 bg-gray-100 border-2 border-[#111] rounded shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] text-[#111]"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    {order.status !== 'SELESAI' && (
                      <button 
                        onClick={() => {
                          if (confirm(`Konfirmasi pembayaran untuk invoice ${order.invoice_number}?`)) {
                            confirmMutation.mutate(order.order_id);
                          }
                        }}
                        className="px-2 py-1 bg-green-100 border-2 border-green-800 rounded shadow-[2px_2px_0px_0px_rgba(22,101,52,1)] text-green-800 font-bold text-[11px] flex items-center gap-1"
                        disabled={confirmMutation.isPending}
                      >
                        <Check className="w-3 h-3" /> Konfirmasi
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="catalog-empty">
          <div className="catalog-empty__icon">
            <Package className="w-8 h-8" />
          </div>
          <h4 className="catalog-empty__title">
            {searchQuery || filterStatus !== 'ALL' ? 'Pesanan Tidak Ditemukan' : 'Belum ada pesanan'}
          </h4>
          <p className="catalog-empty__desc">
            {searchQuery || filterStatus !== 'ALL' 
              ? 'Tidak ada pesanan yang cocok dengan filter pencarian Anda.' 
              : 'Saat ini belum ada pembeli yang memesan Modul Ajar Anda.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default StoreOrdersTab;
