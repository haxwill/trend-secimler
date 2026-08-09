const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeAmazonProduct() {
    try {
        const res = await axios.get('https://www.amazon.com.tr/Baseus-Crystal-Shine-Type-C-Kablosu/dp/B0B46N4SK5/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const $ = cheerio.load(res.data);
        const title = $('#productTitle').text().trim();
        const price = $('.a-price-whole').first().text().trim();
        let image = $('#landingImage').attr('src');
        if (!image) image = $('img').first().attr('src');
        
        console.log({ title, price, image });
    } catch(e) {
        console.error(e.message);
    }
}
scrapeAmazonProduct();
