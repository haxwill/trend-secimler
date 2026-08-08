import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { addProducts } from '@/lib/db';

export async function POST(request: Request) {
  try {
    let customApiKey = null;
    try {
      const body = await request.json();
      customApiKey = body.apiKey;
    } catch (e) {
      // Body empty or invalid JSON, ignore
    }

    const apiKey = customApiKey || process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === "BURAYA_API_KEY_GELECEK") {
      return NextResponse.json({ error: 'Lütfen Admin panelinden geçerli bir Gemini API Anahtarı girin.' }, { status: 400 });
    }

    // 1. Kullanılabilir modelleri dinamik olarak çek (Versiyon karmaşasını önlemek için)
    const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const modelsData = await modelsRes.json();
    
    if (!modelsData.models || modelsData.models.length === 0) {
        return NextResponse.json({ error: 'Geçerli bir yapay zeka modeli bulunamadı. API anahtarınızı kontrol edin.' }, { status: 400 });
    }

    // "generateContent" destekleyen ve "gemini" içeren, ancak "2.5-flash" OLMAYAN ve "preview/exp" OLMAYAN modelleri filtrele
    const validModels = modelsData.models.filter((m: any) => 
        m.name.includes('gemini') && 
        m.supportedGenerationMethods && 
        m.supportedGenerationMethods.includes('generateContent') &&
        !m.name.includes('2.5-flash') &&
        !m.name.includes('preview') &&
        !m.name.includes('exp')
    );

    if (validModels.length === 0) {
        return NextResponse.json({ error: 'generateContent destekleyen aktif Gemini modeli bulunamadı.' }, { status: 400 });
    }

    // Listeyi isme göre ters sırala ki en yüksek sürüm numarası başa gelsin (Örn: 3.0 > 2.0)
    validModels.sort((a: any, b: any) => b.name.localeCompare(a.name));

    // İlk olarak 'flash' içeren en yeni modeli, yoksa 'pro' içeren en yeni modeli seç
    let selectedModelName = validModels.find((m: any) => m.name.includes('flash'))?.name 
                         || validModels.find((m: any) => m.name.includes('pro'))?.name
                         || validModels[0].name;

    // "models/" ön ekini temizle
    selectedModelName = selectedModelName.replace('models/', '');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: selectedModelName });

    const prompt = `Sen bir dropshipping ve arbitraj ürün bulma botusun. 
İnternette (Trendyol, Hepsiburada, Amazon vb.) şu anda indirimde olan, kâr marjı yüksek ve satılma potansiyeli yüksek **5 adet GERÇEK ürün** bulmanı istiyorum.

Çok önemli:
- Sadece gerçekten var olan ürünleri ve onların gerçek bağlantılarını (affiliateLink) kullan.
- Fiyatlar olabildiğince gerçekçi olsun.
- Çıktın KESİNLİKLE aşağıdaki JSON formatında, geçerli bir array ([]) içinde olmalıdır. Ekstra hiçbir metin ekleme.

Format:
[
  {
    "category": "elektronik",
    "imageUrl": "gercek_urun_resim_urlsi",
    "rawName": "Ürünün Gerçek Adı",
    "rawPrice": 1250,
    "originalPrice": 1800,
    "baseLink": "https://www.trendyol.com/..."
  }
]
`;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    let scrapedProducts = JSON.parse(text);

    // 1. Gerçek Resim Kazıma Aşaması (Cheerio ile)
    const HEADERS = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
    };

    scrapedProducts = await Promise.all(scrapedProducts.map(async (product: any) => {
        try {
            if (product.baseLink && !product.baseLink.includes('google.com/search')) {
                const res = await axios.get(product.baseLink, { headers: HEADERS, timeout: 8000 });
                const $ = cheerio.load(res.data);
                
                // Gerçek ürün görselini bulmayı dene (og:image en güveniliri)
                let realImage = $('meta[property="og:image"]').attr('content');
                if (!realImage) realImage = $('img').first().attr('src');
                
                if (realImage && realImage.startsWith('http')) {
                    product.imageUrl = realImage;
                }
            }
        } catch (e) {
            console.error(`Resim çekilemedi: ${product.baseLink}`);
            // Resim çekilemezse yapay zekanın tahmini resmi ile devam et
        }
        return product;
    }));

    const formattedPosts = scrapedProducts.map((product: any) => ({
        id: Date.now() + Math.floor(Math.random() * 1000),
        category: product.category,
        imageUrl: product.imageUrl,
        tr: {
            title: `${product.rawName} - Fırsatı Kaçırma!`,
            excerpt: "Yapay zeka analizlerimize göre bu ürün kendi kategorisinde en iyi fiyat/performans oranına sahip.",
            originalPrice: `${product.originalPrice.toLocaleString('tr-TR')} TL`,
            currentPrice: `${product.rawPrice.toLocaleString('tr-TR')} TL`,
            affiliateLink: `${product.baseLink}`
        }
    }));

    // Mevcut dosyanın/veritabanının üstüne ekle
    await addProducts(formattedPosts);

    return NextResponse.json({ success: true, count: formattedPosts.length, products: formattedPosts });

  } catch (error: any) {
    console.error("Yapay Zeka Scrape Hatası:", error);
    return NextResponse.json({ error: error.message || 'Scraping failed' }, { status: 500 });
  }
}
