"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminDashboard() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setApiKey(savedKey);
    fetchProducts();
  }, []);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
    localStorage.setItem('gemini_api_key', e.target.value);
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const deleteProduct = async (id: number) => {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch('/api/admin/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        fetchProducts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const triggerScraper = async () => {
    setIsScraping(true);
    try {
      const res = await fetch('/api/admin/scrape', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`${data.count} yeni ürün başarıyla eklendi!`);
        fetchProducts();
      } else {
        alert(`Hata: ${data.error}`);
      }
    } catch (e) {
      console.error(e);
      alert('Beklenmedik bir hata oluştu.');
    }
    setIsScraping(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Paneli</h1>
            <p className="text-gray-500 mt-1">Sistemdeki ürünleri ve yapay zeka botunu yönetin.</p>
          </div>
          <div className="flex gap-4">
            <Link href="/" className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 font-semibold">
              Vitrine Dön
            </Link>
          </div>
        </div>

        {/* API Ayarları Paneli */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8 flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex-1 w-full">
            <label className="block text-sm font-bold text-gray-700 mb-2">Google Gemini API Anahtarı</label>
            <input 
              type="password" 
              value={apiKey}
              onChange={handleApiKeyChange}
              placeholder="AI_zaSy..." 
              className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-black focus:border-black outline-none"
            />
            <p className="text-xs text-gray-500 mt-2">Bu anahtar sadece senin tarayıcında (Local Storage) saklanır. Eğer sunucuda (Vercel) kalıcı .env anahtarı yoksa buradan girdiğin anahtar kullanılır.</p>
          </div>
          <div className="w-full md:w-auto flex-shrink-0">
            <button 
              onClick={triggerScraper}
              disabled={isScraping}
              className="w-full md:w-auto px-6 py-3 bg-black text-white rounded font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isScraping ? '🔄 Yapay Zeka Düşünüyor...' : '🚀 Gemini ile Ürün Bul'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="font-semibold text-lg">Mevcut Ürünler ({products.length})</h2>
            <button onClick={fetchProducts} className="text-sm text-blue-600 hover:underline">Yenile</button>
          </div>
          
          {isLoading ? (
            <div className="p-10 text-center text-gray-500 animate-pulse">Yükleniyor...</div>
          ) : products.length === 0 ? (
            <div className="p-10 text-center text-gray-500">Sistemde hiç ürün yok.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-3 font-medium">Görsel</th>
                    <th className="px-6 py-3 font-medium">Ürün Adı</th>
                    <th className="px-6 py-3 font-medium">Fiyat</th>
                    <th className="px-6 py-3 font-medium">Kategori</th>
                    <th className="px-6 py-3 font-medium text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <img src={p.imageUrl} alt="Ürün" className="w-12 h-12 object-cover rounded border border-gray-200" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900 line-clamp-1" title={p.tr?.title}>{p.tr?.title}</div>
                        <a href={p.tr?.affiliateLink} target="_blank" className="text-xs text-blue-500 hover:underline truncate inline-block max-w-[200px]">Linke Git ↗</a>
                      </td>
                      <td className="px-6 py-4 font-bold text-red-600">
                        {p.tr?.currentPrice}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-semibold uppercase">{p.category}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => deleteProduct(p.id)}
                          className="text-red-500 hover:text-red-700 font-semibold text-sm"
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="mt-8 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded text-sm">
          <strong>Önemli Not:</strong> Vercel'e deploy edildiğinde, "Gemini ile Ürün Bul" ve "Sil" işlemleri kalıcı olarak veritabanına (posts.json) yazılamayacaktır (Vercel sistemleri Read-Only çalışır). Bu panel tamamen Localhost veya kalıcı bir veritabanı bağlandığında kullanılmak üzere tasarlanmıştır.
        </div>
      </div>
    </div>
  );
}
