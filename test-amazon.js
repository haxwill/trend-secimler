const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeAmazon() {
    try {
        const res = await axios.get('https://www.amazon.com.tr/gp/bestsellers/computers', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const $ = cheerio.load(res.data);
        const products = [];
        
        $('.a-carousel-card, .zg-grid-general-faceout').each((i, el) => {
            const link = $(el).find('a.a-link-normal').attr('href');
            if (link) {
                products.push('https://www.amazon.com.tr' + link);
            }
        });
        console.log(products.length, 'Amazon urunu bulundu');
        console.log(products.slice(0, 2));
    } catch(e) {
        console.error(e.message);
    }
}
scrapeAmazon();
