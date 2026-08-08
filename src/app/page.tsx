"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { useEffect, useState } from "react";

export default function Home() {
  const { cart, addToCart } = useCart();
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data)) {
           setProducts(data);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-gray-100 py-4">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div className="font-extrabold tracking-[0.2em] text-black">
            <h1>TRENDSEÇİMLER</h1>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-gray-500 uppercase tracking-wider">
            <Link href="/" className="text-black hover:text-black transition">Ana Sayfa</Link>
            <Link href="#categories" className="hover:text-black transition">Kategoriler</Link>
            <Link href="#about" className="hover:text-black transition">Nasıl Çalışır?</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/checkout" className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md font-semibold text-sm hover:bg-gray-800 transition">
              <span>🛒 Sepet</span>
              {cart.length > 0 && (
                <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">{cart.length}</span>
              )}
            </Link>
          </div>
        </div>
      </nav>

      <header className="bg-white py-16 px-4 text-center border-b border-gray-200 mb-8">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block bg-red-50 text-red-600 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            🔥 Gerçek Zamanlı Stok Takibi
          </span>
          <h2 className="text-5xl font-extrabold leading-tight mb-4 tracking-tight">
            Geleceğin Dropshipping<br />
            <span className="text-black">Alışverişine Hoş Geldin</span>
          </h2>
          <p className="text-xl text-gray-500 mb-8">
            Yapay zeka ile seçilmiş en iyi fırsatlar, doğrudan güvenli ödeme altyapısıyla senin için burada.
          </p>
          <a href="#products" className="inline-block bg-black text-white px-10 py-4 rounded-md text-lg font-semibold hover:bg-gray-800 transition">
            Ürünleri Keşfet
          </a>
        </div>
      </header>

      <section id="products" className="max-w-7xl mx-auto px-4 pb-20">
        <div className="mb-6 border-b-2 border-black pb-2">
          <h3 className="text-2xl font-bold uppercase">Güncel <span className="text-black">Fırsatlar</span></h3>
          <p className="text-gray-500 text-sm mt-1">Yapay zeka tabanlı dropshipping ağı.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.length === 0 ? (
            <div className="col-span-full py-20 text-center text-gray-500">
               Henüz ürün bulunamadı. Lütfen GitHub Actions botunun ürün eklemesini bekleyin.
            </div>
          ) : (
            products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:-translate-y-1 hover:shadow-lg transition duration-200 flex flex-col group">
                <div className="relative h-48 bg-white p-4 border-b border-gray-100 flex items-center justify-center">
                  <span className="absolute top-2 right-2 bg-green-100 text-green-800 border border-green-200 px-2 py-1 text-xs font-bold rounded">STOKTA</span>
                  <img src={product.imageUrl} alt={product.rawName} className="max-h-full object-contain" />
                </div>
                <div className="p-5 flex flex-col flex-grow">
                  <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-2">{product.category || 'Genel'}</span>
                  <h4 className="font-bold text-gray-900 mb-2 line-clamp-2">{product.rawName}</h4>
                  
                  <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between mb-4">
                    <div className="flex flex-col">
                      <span className="text-gray-400 line-through text-sm">{product.originalPrice} TL</span>
                      <span className="text-red-600 font-extrabold text-xl">{product.rawPrice} TL</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => addToCart(product)}
                    className="w-full bg-black text-white font-bold py-3 rounded hover:bg-gray-800 transition shadow-sm"
                  >
                    Sepete Ekle
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
