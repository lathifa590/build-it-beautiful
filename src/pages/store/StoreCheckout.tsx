import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storeApi } from '@/lib/store-api';
import { CheckCircle, CheckCircle2, Clock, ArrowLeft, Download, Receipt, Copy, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

const StoreCheckout = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data: order, isLoading } = useQuery({
    queryKey: ['storeOrder', orderId],
    queryFn: () => storeApi.getOrder(orderId as string),
    enabled: !!orderId,
    refetchInterval: (data) => (data?.status === 'PENDING_REVIEW' || data?.status === 'PENDING_PAYMENT' ? 4000 : false),
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!order) throw new Error("Pesanan tidak ditemukan");
      return storeApi.updateOrderStatus(order.order_id, {
        status: 'PENDING_REVIEW',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storeOrder', orderId] });
    },
    onError: (err: any) => {
      console.error('Error updating order status:', err);
    }
  });

  if (isLoading) return <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center font-bold text-gray-600">Memuat data pesanan...</div>;
  if (!order) return <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center font-bold text-gray-600">Pesanan tidak ditemukan.</div>;

  const sellerProfile = order.listing?.store_profile;
  const bankName = sellerProfile?.bank_name || 'Bank BRI';
  const accountNumber = sellerProfile?.bank_account_number || '364401036953533';
  const accountName = sellerProfile?.bank_account_name || 'HUSNUL KHULUQ';
  const sellerWhatsApp = sellerProfile?.whatsapp_number || '6288228511309';

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`${label} berhasil disalin!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const buildWhatsAppUrl = () => {
    const cleanWa = sellerWhatsApp.replace(/\D/g, '').replace(/^0/, '62');
    const message = `Halo kak ${sellerProfile?.store_name || ''}, saya mau konfirmasi transfer pembayaran:\n\n` +
      `📄 *No Invoice*: ${order.invoice_number}\n` +
      `📚 *Produk*: ${order.listing?.title || 'Modul Ajar'}\n` +
      `👤 *Nama Pembeli*: ${order.buyer_name}\n` +
      `📧 *Email Pembeli*: ${order.buyer_email}\n` +
      (order.buyer_whatsapp ? `📱 *WhatsApp Pembeli*: ${order.buyer_whatsapp}\n` : '') +
      `🏦 *Tujuan Transfer*: ${bankName} (${accountNumber} a.n ${accountName})\n` +
      `💰 *Total Transfer*: Rp ${(order.total_amount || 0).toLocaleString('id-ID')}\n\n` +
      `Mohon dibantu verifikasi dan aktivasi modulnya ya kak. Terima kasih! 🙏`;

    return `https://wa.me/${cleanWa}?text=${encodeURIComponent(message)}`;
  };

  const handleConfirmTransfer = () => {
    const waUrl = buildWhatsAppUrl();
    window.open(waUrl, '_blank');

    if (order.status === 'PENDING_PAYMENT') {
      confirmMutation.mutate();
      toast.success("Membuka WhatsApp untuk konfirmasi ke penjual! Status pesanan kini Menunggu Konfirmasi.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f0e8] py-8 px-4 flex flex-col justify-center">
      <div className="container mx-auto max-w-md">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 font-bold text-gray-700 hover:text-gray-900 transition-colors mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          BATAL / KEMBALI
        </button>

        {/* Ringkasan Singkat Pesanan */}
        <div className="bg-white rounded-2xl border-2 border-[#111] p-4 mb-4 shadow-[4px_4px_0_0_#111] flex items-center gap-3">
          <div className="w-16 h-16 bg-gray-100 border border-gray-300 rounded-lg overflow-hidden shrink-0">
            {order.listing?.preview_image_url ? (
              <img src={order.listing.preview_image_url} alt="Thumbnail" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">Modul</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ringkasan Pesanan</p>
            <h3 className="font-bold text-[#111] text-sm truncate">{order.listing?.title}</h3>
            <p className="text-xs text-gray-600 mt-0.5">{sellerProfile?.store_name}</p>
            <p className="text-sm font-black text-[#c04a1a] mt-1">
              Invoice: <span className="font-mono text-gray-800">{order.invoice_number}</span>
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border-2 border-[#111] shadow-[6px_6px_0_0_#111] p-6 md:p-8">
          {/* SELESAI */}
          {order.status === 'SELESAI' ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-green-800 tracking-tight">
                  Pembayaran Berhasil! 🎉
                </h1>
                <p className="text-sm font-semibold text-gray-600 mt-1">
                  Terima kasih telah membeli modul ini. Akses file modul ajar Anda sudah aktif.
                </p>
              </div>

              <div className="pt-4">
                {order.listing?.url_modul_ajar ? (
                  <button 
                    className="w-full py-4 px-6 bg-green-700 hover:bg-green-800 text-white font-black rounded-xl shadow-[4px_4px_0_0_#14532d] flex items-center justify-center gap-2 text-base transition-all active:translate-x-0.5 active:translate-y-0.5"
                    onClick={() => window.open(order.listing!.url_modul_ajar!, '_blank')}
                  >
                    <Download className="w-5 h-5" />
                    DOWNLOAD MODUL AJAR
                  </button>
                ) : (
                  <div className="text-sm text-red-600 font-bold p-4 bg-red-50 border border-red-200 rounded-xl text-center">
                    Maaf, link file modul ajar belum tersedia. Silakan hubungi penjual via WhatsApp.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              {/* Top Icon & Header */}
              <div className="text-center mb-6">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border ${
                  order.status === 'PENDING_REVIEW' 
                    ? 'bg-blue-50 border-blue-200 animate-pulse' 
                    : 'bg-amber-50 border-amber-200'
                }`}>
                  <Clock className={`w-8 h-8 ${order.status === 'PENDING_REVIEW' ? 'text-blue-500' : 'text-amber-500'}`} />
                </div>

                <h1 className="text-2xl font-black text-[#f59e0b] tracking-tight flex items-center justify-center gap-1.5">
                  {order.status === 'PENDING_REVIEW' ? 'Menunggu Konfirmasi' : 'Menunggu Pembayaran'}
                  <span className="text-xl">⌛</span>
                </h1>

                <p className="text-xs md:text-sm text-gray-600 mt-1.5 leading-relaxed">
                  {order.status === 'PENDING_REVIEW'
                    ? 'Konfirmasi transfer telah dikirim ke penjual. Halaman ini akan otomatis selesai setelah disetujui.'
                    : 'Selesaikan pembayaran Anda menggunakan detail di bawah ini.'}
                </p>
              </div>

              {/* Box Info Pembayaran */}
              <div className="bg-[#f8faff] border border-blue-100 rounded-2xl p-5 space-y-3.5">
                <p className="text-xs font-black text-gray-400 tracking-wider text-center uppercase">
                  INFO PEMBAYARAN:
                </p>

                <div className="space-y-3 text-sm">
                  {/* Bank */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-dashed border-gray-200">
                    <span className="text-gray-500 font-medium">Bank</span>
                    <span className="font-black text-gray-900 tracking-wide">{bankName}</span>
                  </div>

                  {/* No Rekening */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-dashed border-gray-200">
                    <span className="text-gray-500 font-medium">No. Rekening</span>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-blue-600 text-base md:text-lg tracking-wider font-mono">
                        {accountNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(accountNumber, 'No. Rekening')}
                        className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md transition-colors"
                        title="Salin No. Rekening"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Atas Nama */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-dashed border-gray-200">
                    <span className="text-gray-500 font-medium">Atas Nama</span>
                    <span className="font-black text-gray-900 uppercase text-right">{accountName}</span>
                  </div>

                  {/* Total Tagihan */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-gray-500 font-medium">Total Tagihan</span>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-red-600 text-xl tracking-tight">
                        Rp {(order.total_amount || 0).toLocaleString('id-ID')}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard((order.total_amount || 0).toString(), 'Total Tagihan')}
                        className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md transition-colors"
                        title="Salin Total Tagihan"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-red-500 font-semibold text-center pt-2 leading-tight">
                    * Transfer TEPAT hingga 3 digit terakhir agar mempermudah verifikasi transfer.
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleConfirmTransfer}
                disabled={confirmMutation.isPending}
                className="w-full mt-6 py-3.5 px-6 bg-[#05c46b] hover:bg-[#04b05f] active:scale-[0.99] text-white font-black rounded-xl shadow-[0_6px_20px_-4px_rgba(5,196,107,0.4)] flex items-center justify-center gap-2 text-sm md:text-base tracking-wide uppercase transition-all"
              >
                {order.status === 'PENDING_REVIEW' ? (
                  <>
                    <MessageCircle className="w-5 h-5" />
                    HUBUNGI PENJUAL DI WHATSAPP
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    KONFIRMASI TRANSFER
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreCheckout;

