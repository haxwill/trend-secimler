require('dotenv').config();
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const axios = require('axios');

console.log("🤖 Gerçek Auto-Blogger Botu Başlatıldı...");
console.log(`⏰ Zamanlayıcı Ayarı: ${process.env.CRON_SCHEDULE || "0 8 * * *"}`);

// API Key Kontrolü
if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "BURAYA_API_KEY_GELECEK") {
    console.warn("⚠️ DİKKAT: Gerçek AI kullanımı için .env dosyasına GEMINI_API_KEY eklemelisin!");
    console.warn("Bot şimdilik güvenli (simülasyon) modunda çalışacak.");
}

// Gemini AI Başlat
const genAI = process.env.GEMINI_API_KEY !== "BURAYA_API_KEY_GELECEK" 
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) 
    : null;

// 1. ÜRÜN BULMA AŞAMASI (Gerçek Zamanlı İnternet Taraması - Web Scraping & AI Search)
const fetchTrendingProducts = async () => {
    console.log("🔍 İnternetteki fırsatlar Google Search ve Yapay Zeka ile kazınıyor (Real-time AI Scraping)...");
    
    // Eğer Gemini API Key varsa, internete bağlanıp gerçek arama yapsın
    if (genAI) {
        try {
            console.log("🌐 Gemini-1.5-Pro internete bağlanıyor...");
            const model = genAI.getGenerativeModel({ 
                model: "gemini-1.5-pro",
                tools: [{ googleSearch: {} }] // Google Arama motorunu aktifleştir
            });

            const prompt = `Şu an Türkiye'deki (Trendyol, Amazon, Hepsiburada, epey, akakce vb.) en güncel, gerçek 2 farklı teknoloji veya giyim fırsatını internette ara. 
            Ürünlerin GERÇEK ve TAM isimlerini, piyasa fiyatlarını, şu anki indirimli fiyatlarını ve satıldığı orijinal site linkini (URL) bul.
            Sonucu SADECE aşağıdaki JSON Array formatında döndür, markdown veya başka hiçbir metin ekleme:
            [
              {
                "title": "Gerçek Ürün Adı (Örn: Apple iPhone 13 128GB)",
                "price": 35000,
                "originalPrice": 40000,
                "category": "Elektronik",
                "image": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600",
                "link": "https://www.trendyol.com/ornek-urun-linki"
              }
            ]
            Not: image için bulamazsan veya hata almamak için mutlaka örnekteki gibi unsplash üzerinden kategoriye uygun (örn: /?smartphone) bir resim URL'si koy. Ancak link için MUTLAKA ürünün satıldığı asıl orijinal adresi ver.`;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            const aiProducts = JSON.parse(responseText);

            return aiProducts.map(p => ({
                id: Date.now() + Math.floor(Math.random() * 1000),
                rawName: p.title,
                rawPrice: p.price,
                originalPrice: p.originalPrice,
                category: p.category,
                imageUrl: p.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600",
                baseLink: p.link || `https://www.google.com/search?q=${encodeURIComponent(p.title)}`
            }));
        } catch (error) {
        } catch (error) {
            console.error("⚠️ AI Web Scraping Başarısız oldu. Yedek API'ye geçiliyor.", error.message);
        }
    } else {
        console.warn("⚠️ DİKKAT: GEMINI_API_KEY bulunamadı! Yapay zeka araması pas geçiliyor.");
    }

    // AI başarısız olursa veya API key yoksa (Simülasyon Modu) yedek API çalışır
    console.log("🔄 Yedek sistem (DummyJSON API) kullanılıyor...");
    try {
        const response = await axios.get('https://dummyjson.com/products');
        const allProducts = response.data.products;
        const shuffled = allProducts.sort(() => 0.5 - Math.random());
        const products = shuffled.slice(0, 2);
        
        return products.map(p => ({
            id: p.id + Date.now(),
            rawName: p.title,
            rawPrice: Math.floor(p.price * 35),
            originalPrice: Math.floor(p.price * 35 * 1.3),
            category: p.category,
            imageUrl: p.images[0],
            baseLink: `https://www.google.com/search?q=${encodeURIComponent(p.title)}`
        }));
    } catch (error) {
        console.error("İnternetten veri çekilirken hata oluştu:", error);
        return [];
    }
};

// 2. YAPAY ZEKA İLE ÇİFT DİLLİ (TR/EN) İÇERİK YAZIMI
const generateAIPost = async (product) => {
    console.log(`✍️ Yapay Zeka "${product.rawName}" için GLOBAL içerik üretiyor...`);
    
    let excerptTr = "";
    let excerptEn = "";

    if (genAI) {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const prompt = `Write a short, engaging 2-sentence promotional review for the product: "${product.rawName}". 
            Return the output EXACTLY in this JSON format:
            {
              "tr": "Turkish translation of the review",
              "en": "English version of the review"
            }`;
            
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            try {
                // Remove markdown code blocks if any
                const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
                const aiResult = JSON.parse(cleanJson);
                excerptTr = aiResult.tr;
                excerptEn = aiResult.en;
            } catch (e) {
                excerptTr = text; // fallback
                excerptEn = "Amazing deal for this product. Don't miss out!";
            }
        } catch (error) {
            console.error("AI Hatası:", error);
            excerptTr = "Muazzam özellikleri ve fırsat fiyatıyla şu an alınabilecek en mantıklı seçimlerden biri.";
            excerptEn = "One of the best choices you can make right now with its amazing features and deal price.";
        }
    } else {
        excerptTr = "Yapay zeka analizlerimize göre bu ürün kendi kategorisinde en iyi fiyat/performans oranına sahip.";
        excerptEn = "According to our AI analysis, this product has the best price/performance ratio in its category.";
    }

    return {
        id: product.id,
        category: product.category,
        imageUrl: product.imageUrl,
        tr: {
            title: `${product.rawName} - Fırsatı Kaçırma!`,
            excerpt: excerptTr,
            originalPrice: `${product.originalPrice.toLocaleString('tr-TR')} TL`,
            currentPrice: `${product.rawPrice.toLocaleString('tr-TR')} TL`,
            affiliateLink: `${product.baseLink}`
        },
        en: {
            title: `${product.rawName} - Don't Miss Out!`,
            excerpt: excerptEn,
            originalPrice: `$${Math.floor(product.originalPrice / 30)}`,
            currentPrice: `$${Math.floor(product.rawPrice / 30)}`,
            affiliateLink: `${product.baseLink}`
        }
    };
};

// 3. YENİ YAZILARI SİSTEME EKLEME (Append Mantığı)
const publishPosts = (newPosts) => {
    const postsFilePath = path.join(__dirname, 'posts.json');
    let existingPosts = [];

    const dbPath = path.join(__dirname, 'posts.json');
    const sitemapPath = path.join(__dirname, 'sitemap.xml');

    if (fs.existsSync(dbPath)) {
        const rawData = fs.readFileSync(dbPath);
        existingPosts = JSON.parse(rawData);
    }

    // Yeni içerikleri en başa ekle, toplam sayıyı 20 ile sınırla
    const allPosts = [...newPosts, ...existingPosts];
    const limitedPosts = allPosts.slice(0, 20);

    fs.writeFileSync(dbPath, JSON.stringify(limitedPosts, null, 4));
    console.log(`✅ İşlem Başarılı: ${newPosts.length} yeni yazı web sitesinde yayında! Toplam yazı: ${limitedPosts.length}`);

    // SEO: Otomatik Sitemap Üretimi
    try {
        const siteUrl = "https://KULLANICI_ADIN.github.io/indirim-botum"; // README'deki alan adı
        const today = new Date().toISOString().split('T')[0];
        const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${siteUrl}/</loc>
        <lastmod>${today}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
</urlset>`;
        
        fs.writeFileSync(sitemapPath, sitemapContent);
        console.log(`🌍 SEO: sitemap.xml başarıyla oluşturuldu/güncellendi.`);
    } catch (e) {
        console.warn("⚠️ Sitemap oluşturulamadı.");
    }
};



// Ana Bot Fonksiyonu
const runBot = async () => {
    console.log("========== YENİ GÖREV BAŞLADI ==========");
    const rawProducts = await fetchTrendingProducts();
    const readyPosts = [];

    for (const product of rawProducts) {
        const post = await generateAIPost(product);
        readyPosts.push(post);
    }

    publishPosts(readyPosts);
    console.log("========== GÖREV TAMAMLANDI ==========\n");
};

// Eğer GitHub Actions gibi bulut ortamındaysak, sistemin zamanlamasını zaten Actions yapıyor.
// Bu yüzden script sadece bir kez çalışıp kapanmalıdır.
runBot().catch(console.error);
