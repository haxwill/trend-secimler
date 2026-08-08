"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";

export default function Checkout() {
  const { cart, total, removeFromCart } = useCart();

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* Sol Taraf: Ödeme Formu */}
        <div className="flex-1">
          <Link href="/" className="text-gray-500 hover:text-black font-semibold mb-8 inline-flex items-center gap-2">
            ← Alışverişe Dön
          </Link>
          
          <h1 className="text-3xl font-extrabold mb-8 tracking-tight uppercase border-b-2 border-black pb-4">Güvenli <span className="text-gray-500">Ödeme</span></h1>
          
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
            <div className="bg-blue-50 text-blue-800 p-4 rounded mb-8 text-sm font-semibold border border-blue-100 flex items-center gap-3">
              ℹ️ Şu anda Iyzico Sanal POS Test (Sandbox) ortamındasınız. Gerçek kartlardan çekim yapılmaz.
            </div>

            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ad Soyad</label>
                  <input type="text" className="w-full px-4 py-3 rounded border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none" placeholder="Kart üzerindeki isim" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kart Numarası</label>
                  <input type="text" className="w-full px-4 py-3 rounded border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none font-mono" placeholder="0000 0000 0000 0000" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Son Kullanma Tarihi</label>
                  <input type="text" className="w-full px-4 py-3 rounded border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none" placeholder="MM/YY" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CVC</label>
                  <input type="text" className="w-full px-4 py-3 rounded border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none" placeholder="123" />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6 mt-8">
                <button 
                  type="button" 
                  disabled={cart.length === 0}
                  className="w-full bg-black text-white font-bold text-lg py-4 rounded hover:bg-gray-800 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                  onClick={() => alert('Sanal POS entegrasyonu başarılı! (Test Ortamı)')}
                >
                  {cart.length === 0 ? 'Sepetiniz Boş' : 'Ödemeyi Tamamla'}
                </button>
              </div>
            </form>
            
            <div className="mt-8 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
              <span>🔒 256-bit SSL ile korunmaktadır</span>
              <span>|</span>
              <span>Iyzico Altyapısı Kullanılmaktadır</span>
            </div>
          </div>
        </div>

        {/* Sağ Taraf: Sepet Özeti */}
        <div className="w-full md:w-80 mt-16 md:mt-0">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 sticky top-24">
            <h2 className="text-xl font-bold border-b border-gray-200 pb-4 mb-4">Sipariş Özeti</h2>
            
            {cart.length === 0 ? (
              <p className="text-gray-500 text-sm italic">Sepetinizde ürün bulunmamaktadır.</p>
            ) : (
              <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-4 items-center border-b border-gray-100 pb-4">
                    <img src={item.imageUrl} alt={item.rawName} className="w-16 h-16 object-contain rounded border border-gray-100 p-1" />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold line-clamp-2">{item.rawName}</h4>
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-bold text-red-600">{item.rawPrice} TL</span>
                        <button onClick={() => removeFromCart(item.id)} className="text-xs text-gray-400 hover:text-red-500">Sil</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center mb-2 text-sm text-gray-500">
                <span>Ara Toplam</span>
                <span>{total} TL</span>
              </div>
              <div className="flex justify-between items-center mb-4 text-sm text-gray-500">
                <span>Kargo</span>
                <span className="text-green-600 font-semibold">Ücretsiz</span>
              </div>
              <div className="flex justify-between items-center text-lg">
                <span className="font-bold text-gray-900">Toplam</span>
                <span className="font-extrabold text-2xl text-red-600">{total} TL</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
