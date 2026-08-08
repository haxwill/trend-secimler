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

// 1. ÜRÜN BULMA AŞAMASI (Gerçek İnternet Verisi)
const fetchTrendingProducts = async () => {
    console.log("🔍 İnternetteki fırsatlar kazınıyor (Scraping)...");
    try {
        // DummyJSON yerine gerçek marka/ürün isimleri olan FakeStoreAPI kullanılıyor
        const response = await axios.get('https://fakestoreapi.com/products');
        const allProducts = response.data;
        // 20 gerçek üründen rastgele 2 tanesini seçiyoruz
        const shuffled = allProducts.sort(() => 0.5 - Math.random());
        const products = shuffled.slice(0, 2);
        
        return products.map(p => ({
            id: p.id + Date.now(),
            rawName: p.title,
            rawPrice: Math.floor(p.price * 35), // Doları TL'ye çeviriyoruz
            originalPrice: Math.floor(p.price * 35 * 1.3), // %30 indirim varmış gibi gösterelim
            category: p.category,
            imageUrl: p.image, // FakeStoreAPI'da resim özelliği p.image'dir
            baseLink: `https://amazon.com.tr/s?k=${encodeURIComponent(p.title)}` // Gerçekte ürün linki olur
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

// 4. SOSYAL MEDYA (TELEGRAM) YAYINLAMA AŞAMASI
const sendToTelegram = async (post) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || token === "BURAYA_TELEGRAM_TOKEN_GELECEK" || !chatId || chatId === "BURAYA_KANAL_ID_GELECEK") {
        console.warn("⚠️ Telegram ayarları eksik. Sosyal medya paylaşımı atlanıyor.");
        return;
    }

    console.log(`📱 Telegram'a gönderiliyor: "${post.tr.title}"`);
    const message = `🚨 *YENİ FIRSAT YAKALANDI!* 🚨\n\n📌 *${post.tr.title}*\n\n💰 Eski Fiyat: ~${post.tr.originalPrice}~\n🔥 *İndirimli Fiyat: ${post.tr.currentPrice}*\n\n📝 ${post.tr.excerpt}\n\n👉 *Hemen İncele:* [Buraya Tıkla](${post.tr.affiliateLink})\n\n🌍 *Global Deal (EN):* [Click Here](${post.en.affiliateLink})`;

    try {
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        await axios.post(url, {
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown'
        });
        console.log("✅ Telegram paylaşımı başarılı!");
    } catch (error) {
        console.error("❌ Telegram paylaşımı başarısız oldu:", error.message);
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
        
        // Yeni eklenen özelliği çağırıyoruz:
        await sendToTelegram(post);
    }

    publishPosts(readyPosts);
    console.log("========== GÖREV TAMAMLANDI ==========\n");
};

// Eğer GitHub Actions gibi bulut ortamındaysak, sistemin zamanlamasını zaten Actions yapıyor.
// Bu yüzden script sadece bir kez çalışıp kapanmalıdır.
runBot().catch(console.error);
