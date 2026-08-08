import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Kullanıcıyı taklit eden sahte tarayıcı başlıkları (Anti-Bot sistemlerini aşmak için)
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Geçersiz sepet verisi' }, { status: 400 });
    }

    const syncedItems = await Promise.all(items.map(async (item: any) => {
      // Eğer ürün yapay zeka bulgusu değilse veya linki yoksa olduğu gibi bırak
      const link = item.tr?.affiliateLink || item.baseLink;
      if (!link || link.includes('google.com/search')) {
        return { ...item, inStock: true, priceChanged: false, originalRawPrice: item.tr?.currentPrice };
      }

      try {
        const response = await axios.get(link, { headers: HEADERS, timeout: 8000 });
        const html = response.data;
        const $ = cheerio.load(html);
        const textContent = $('body').text().toLowerCase();

        // 1. Stok Durumu Kontrolü (Genel e-ticaret tükendi kelimeleri)
        const outOfStockKeywords = ['tükendi', 'stokta yok', 'şu an mevcut değil', 'out of stock', 'currently unavailable', 'ürün bulunamadı'];
        let inStock = true;
        
        for (const keyword of outOfStockKeywords) {
          if (textContent.includes(keyword)) {
            inStock = false;
            break;
          }
        }

        // 2. Fiyat Kontrolü (Meta tag'lerden veya bilinen classlardan fiyat okuma)
        let scrapedPrice = null;
        
        // Önce standart e-ticaret meta etiketlerine bakalım (SEO standartları)
        const metaPrice = $('meta[property="product:price:amount"]').attr('content');
        if (metaPrice) {
          scrapedPrice = parseFloat(metaPrice);
        } else {
          // İkinci şans: Sayfadaki genel fiyat classlarına bak (Trendyol, Hepsiburada, Amazon vb.)
          const priceText = $('.prc-dsc, .a-price-whole, [data-test-id="price"], .price, .product-price').first().text();
          if (priceText) {
            // "1.250,50 TL" gibi bir metni sayıya çevir
            const cleanPrice = priceText.replace(/[^0-9,]/g, '').replace(',', '.');
            if (cleanPrice) {
               scrapedPrice = parseFloat(cleanPrice);
            }
          }
        }

        // Fiyat değişimi kontrolü
        let newPriceStr = item.tr?.currentPrice;
        let priceChanged = false;

        if (scrapedPrice && !isNaN(scrapedPrice)) {
           const dropshippingPrice = Math.floor(scrapedPrice * 1.3);
           
           // Mevcut fiyatı sayıya çevir
           const currentPriceNum = parseFloat((item.tr?.currentPrice || "0").replace(/[^0-9,.]/g, '').replace(',', '.'));
           
           if (Math.abs(dropshippingPrice - currentPriceNum) > (currentPriceNum * 0.05)) {
              newPriceStr = dropshippingPrice.toLocaleString('tr-TR') + ' TL';
              priceChanged = true;
           }
        }

        return {
          ...item,
          inStock,
          tr: {
            ...item.tr,
            currentPrice: newPriceStr
          },
          priceChanged,
          scrapedSuccess: true
        };

      } catch (error) {
        console.error(`${item.baseLink} adresinden veri çekilemedi:`, error);
        // Anti-Bot sistemine takılırsak veya site çökerse, varsayılan olarak satışı engellememek için stok var sayıyoruz.
        return { ...item, inStock: true, priceChanged: false, scrapedSuccess: false, warning: 'Tedarikçi sitesi yanıt vermedi (Cloudflare engeli olabilir)' };
      }
    }));

    return NextResponse.json({ syncedItems });
  } catch (error) {
    console.error("Senkronizasyon hatası:", error);
    return NextResponse.json({ error: 'Senkronizasyon başarısız' }, { status: 500 });
  }
}
