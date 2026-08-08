# 🚀 Otomatik Affiliate (Satış Ortaklığı) Botu

Bu proje, internetten fırsatları bulup yapay zeka ile yeniden yazan ve kendi web sitesinde yayımlayan tam otonom (kendi kendine çalışan) bir sistemdir.

## 🌟 Sistem Nasıl Çalışır?
1. **GitHub Actions:** Her gün saat 08:00'de uyanır ve botu (`auto-blogger.js`) çalıştırır. (Bilgisayarının açık olmasına gerek yoktur, Microsoft'un bulut sunucularında ücretsiz çalışır).
2. **Yapay Zeka (Gemini):** Bot internetten bulduğu ürünleri Gemini'ye yollar ve satış odaklı metinler yazdırır. Üretilen içerik `posts.json` dosyasına eklenir.
3. **GitHub Pages:** O gün üretilen yeni içerikleri içeren web siten tamamen ücretsiz olarak tüm dünyaya yayınlanır. 

---

## 🛠️ İnternete Yayına Alma Rehberi (Deployment)

Sistemi internete açmak ve uyurken para kazanmaya başlamak için bu 3 adımı yapman yeterlidir:

### Adım 1: Kodları GitHub'a Yükle
1. [GitHub.com](https://github.com/)'da ücretsiz bir hesap aç ve yeni bir "Repository (Depo)" oluştur (örn: `indirim-botum`).
2. Bilgisayarındaki bu klasörde (`para`) terminali açıp şu komutları sırayla yaz:
   ```bash
   git init
   git add .
   git commit -m "İlk kurulum"
   git branch -M main
   git remote add origin https://github.com/KULLANICI_ADIN/indirim-botum.git
   git push -u origin main
   ```

### Adım 2: Web Siteni Yayına Aç (GitHub Pages)
1. GitHub'da deponun (repo) **Settings (Ayarlar)** sayfasına gir.
2. Sol menüden **Pages** kısmına tıkla.
3. *Build and deployment* altındaki *Source* kısmını **Deploy from a branch** yap.
4. *Branch* kısmında **main** dalını seçip **Save** butonuna tıkla.
5. Birkaç dakika sonra siten `https://KULLANICI_ADIN.github.io/indirim-botum/` adresinde canlı yayına girecektir!

### Adım 3: Yapay Zekayı ve Sosyal Medyayı Aktifleştir (Secrets)
1. Tekrar GitHub'daki **Settings** sayfasına git.
2. Sol menüden **Secrets and variables** > **Actions** kısmına tıkla.
3. **New repository secret** butonuna bas.
4. Sırasıyla şu 4 şifreyi ekle:
   - `GEMINI_API_KEY`: Google AI Studio'dan aldığın API şifren.
   - `AFFILIATE_TAG`: Amazon veya diğer satış ortaklığı ID'n (örn: `?tag=benim-id`).
   - `TELEGRAM_BOT_TOKEN`: BotFather üzerinden oluşturduğun Telegram Bot şifresi.
   - `TELEGRAM_CHAT_ID`: Mesajların gideceği Telegram kanalının ID'si (Kanalın yöneticisi bot olmalıdır).

**🎉 İŞLEM TAMAM!**
Artık arkanı yaslanabilirsin. Bot her sabah uyanıp önce ürünleri bulacak, sonra yapay zekaya yazdırıp web siteni güncelleyecek ve eşzamanlı olarak Telegram kanalına fırlatacak! İstediğin zaman GitHub'da **Actions** sekmesine girip botu "Run workflow" diyerek manuel de çalıştırabilirsin.
