import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "BURAYA_API_KEY_GELECEK") {
      return NextResponse.json({ error: 'GEMINI_API_KEY bulunamadı veya geçersiz.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
    
    // JSON bloğunu ayıkla
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const scrapedProducts = JSON.parse(text);

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

    // Mevcut dosyanın üstüne ekle
    const postsFile = path.join(process.cwd(), 'data', 'posts.json');
    let existingPosts = [];
    if (fs.existsSync(postsFile)) {
        const data = fs.readFileSync(postsFile, 'utf8');
        existingPosts = JSON.parse(data);
    }

    const allPosts = [...formattedPosts, ...existingPosts].slice(0, 50); // Son 50 ürün

    fs.writeFileSync(postsFile, JSON.stringify(allPosts, null, 4));

    return NextResponse.json({ success: true, count: formattedPosts.length, products: formattedPosts });

  } catch (error: any) {
    console.error("Yapay Zeka Scrape Hatası:", error);
    return NextResponse.json({ error: error.message || 'Scraping failed' }, { status: 500 });
  }
}
