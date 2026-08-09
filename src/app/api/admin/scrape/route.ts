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

    // 1. Gerçek ürün verilerini AMAZON TÜRKİYE'den çek (Yapay zekanın uydurmasını engellemek için)
    const amazonRes = await axios.get('https://www.amazon.com.tr/gp/bestsellers/computers', {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });
    const $ = cheerio.load(amazonRes.data);
    let allLinks: string[] = [];
    
    $('.a-carousel-card, .zg-grid-general-faceout').each((i, el) => {
        const link = $(el).find('a.a-link-normal').attr('href');
        if (link && !link.includes('product-reviews')) {
            allLinks.push('https://www.amazon.com.tr' + link);
        }
    });

    // Sadece benzersiz linkleri al ve rastgele 5 tanesini seç
    allLinks = Array.from(new Set(allLinks));
    const randomLinks = allLinks.sort(() => 0.5 - Math.random()).slice(0, 5);

    const scrapedAmazonProducts = [];
    
    for (const link of randomLinks) {
        try {
            const prodRes = await axios.get(link, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
            });
            const $p = cheerio.load(prodRes.data);
            const title = $p('#productTitle').text().trim();
            const priceText = $p('.a-price-whole').first().text().trim().replace(/,/g, '');
            let image = $p('#landingImage').attr('src');
            if (!image) image = $p('img').first().attr('src');

            if (title && image && priceText) {
                scrapedAmazonProducts.push({
                    title,
                    price: parseInt(priceText) || 1000,
                    image,
                    link
                });
            }
        } catch(e) {
            console.error("Amazon urun detayi cekilemedi:", link);
        }
    }

    const prompt = `Sen profesyonel bir e-ticaret ve pazarlama uzmanısın.
Aşağıda Amazon Türkiye'den az önce anlık olarak çektiğim GERÇEK en çok satan fırsat ürünleri var.
Senden bu ürünlerin isimlerini daha "ilgi çekici ve tıklanabilir" (clickbait) hale getirmeni ve SEO'ya uygun kısa bir pazarlama metni yazmanı istiyorum.

Gelen Ürünler:
${JSON.stringify(scrapedAmazonProducts, null, 2)}

Çıktın KESİNLİKLE aşağıdaki JSON formatında, geçerli bir array ([]) içinde olmalıdır. Ekstra hiçbir metin ekleme.
Resim (image) ve Link (link) değerlerini SAKIN değiştirme, orijinal veriden aynen al!

Format:
[
  {
    "category": "elektronik",
    "imageUrl": "orijinal_image_birebir_ayni_olacak",
    "rawName": "İlgi Çekici Yeni Ürün Adı (Örn: İndirim Şampiyonu X Oyuncu Mouse)",
    "rawPrice": orjinal_price_olacak,
    "originalPrice": orjinal_price_degerinden_yuzde20_daha_fazla_olacak,
    "baseLink": "orijinal_link_olacak"
  }
]
`;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    let scrapedProducts = JSON.parse(text);

    // 2. Resimler zaten Amazon'dan gerçek zamanlı geldiği için kırık link sorunu bitti.
    // Güvenlik amacıyla gelen verileri doğrula
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
