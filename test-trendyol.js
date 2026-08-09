const axios = require('axios');
const cheerio = require('cheerio');

async function scrape() {
    try {
        const res = await axios.get('https://www.trendyol.com/sr?q=bilgisayar', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });
        const $ = cheerio.load(res.data);
        console.log($('.p-card-wrppr').length, 'urun bulundu');
    } catch(e) {
        console.error(e.message);
    }
}
scrape();
