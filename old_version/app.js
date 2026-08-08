document.addEventListener('DOMContentLoaded', () => {
    const postsContainer = document.getElementById('posts-container');
    const langBtn = document.getElementById('lang-btn');
    const searchInput = document.getElementById('search-input');
    const categoryFiltersContainer = document.getElementById('category-filters');
    const scrollLoader = document.getElementById('scroll-loader');
    
    // UI Elements for language swap
    const ui = {
        logoText: document.getElementById('logo-text'),
        navHome: document.getElementById('nav-home'),
        navCategories: document.getElementById('nav-categories'),
        navAbout: document.getElementById('nav-about'),
        heroBadge: document.getElementById('hero-badge'),
        heroTitle: document.getElementById('hero-title'),
        heroDesc: document.getElementById('hero-desc'),
        heroBtn: document.getElementById('hero-btn'),
        sectionTitle: document.getElementById('section-title'),
        sectionDesc: document.getElementById('section-desc'),
        newsTitle: document.getElementById('news-title'),
        newsDesc: document.getElementById('news-desc'),
        newsInput: document.getElementById('news-input'),
        newsBtn: document.getElementById('news-btn')
    };

    const translations = {
        tr: {
            logo: 'Trend<span class="highlight">Seçimler</span>',
            navHome: 'Ana Sayfa',
            navCategories: 'Kategoriler',
            navAbout: 'Nasıl Çalışır?',
            heroBadge: '🔥 Günde 24 Saat Otomatik Güncellenir',
            heroTitle: 'Geleceğin Alışveriş<br>Deneyimine <span class="gradient-text">Hoş Geldin</span>',
            heroDesc: 'En popüler ürünler, en derin incelemeler ve kaçırılmayacak fırsatlar. Hepsi senin için özel olarak seçildi.',
            heroBtn: 'Fırsatları Keşfet',
            sectionTitle: 'Son Eklenen <span class="highlight">Fırsatlar</span>',
            sectionDesc: 'Yapay zeka tarafından son 24 saat içinde seçilen en popüler ürünler.',
            buyBtn: 'Fırsatı Gör',
            newsTitle: 'Fırsatları İlk Sen <span class="highlight">Öğren</span>',
            newsDesc: 'Yapay zekanın yakaladığı anlık fiyat düşüşlerini e-posta adresine gönderelim.',
            newsInput: 'E-posta adresin...',
            newsBtn: 'Abone Ol',
            filterAll: 'Tümü',
            fomoTags: ['🔥 Son Fırsat', '⏰ Hızlı Tükeniyor', '⚡ Çok Popüler', '👀 15 Kişi İnceliyor']
        },
        en: {
            logo: 'Trend<span class="highlight">Picks</span>',
            navHome: 'Home',
            navCategories: 'Categories',
            navAbout: 'How it works',
            heroBadge: '🔥 Auto-updated 24/7',
            heroTitle: 'Welcome to the<br>Future of <span class="gradient-text">Shopping</span>',
            heroDesc: 'The most popular products, deepest reviews, and unmissable deals. All handpicked just for you.',
            heroBtn: 'Explore Deals',
            sectionTitle: 'Recently Added <span class="highlight">Deals</span>',
            sectionDesc: 'The most popular products selected by AI in the last 24 hours.',
            buyBtn: 'Get Deal',
            newsTitle: 'Be The First To <span class="highlight">Know</span>',
            newsDesc: 'Let us send you instant price drops caught by our AI.',
            newsInput: 'Your email address...',
            newsBtn: 'Subscribe',
            filterAll: 'All',
            fomoTags: ['🔥 Last Chance', '⏰ Selling Fast', '⚡ Trending', '👀 15 People Viewing']
        }
    };

    let currentLang = 'tr'; window.currentLang = currentLang;
    let allPosts = []; window.allPosts = allPosts;
    let currentCategory = 'all';
    let searchTerm = '';
    
    // Infinite Scroll Variables
    let currentFilteredPosts = [];
    let postsPerPage = 9;
    let currentPage = 1;
    let isLoading = false;

    // Fonksiyon: Arayüz Metinlerini Güncelle
    function updateUI() {
        const t = translations[currentLang];
        ui.logoText.innerHTML = t.logo;
        ui.navHome.textContent = t.navHome;
        ui.navCategories.textContent = t.navCategories;
        ui.navAbout.textContent = t.navAbout;
        ui.heroBadge.textContent = t.heroBadge;
        ui.heroTitle.innerHTML = t.heroTitle;
        ui.heroDesc.textContent = t.heroDesc;
        ui.heroBtn.textContent = t.heroBtn;
        ui.sectionTitle.innerHTML = t.sectionTitle;
        ui.sectionDesc.textContent = t.sectionDesc;
        
        if (ui.newsTitle) ui.newsTitle.innerHTML = t.newsTitle;
        if (ui.newsDesc) ui.newsDesc.textContent = t.newsDesc;
        if (ui.newsInput) ui.newsInput.placeholder = t.newsInput;
        if (ui.newsBtn) ui.newsBtn.textContent = t.newsBtn;
        
        langBtn.textContent = currentLang === 'tr' ? '🇺🇸 EN' : '🇹🇷 TR';
        if(document.getElementById('filter-all')) {
            document.getElementById('filter-all').textContent = t.filterAll;
        }
    }

    // Fonksiyon: Kategorileri Dinamik Oluştur
    function renderCategories() {
        const categories = [...new Set(allPosts.map(p => {
            const content = p[currentLang] || p;
            return content.category || p.category;
        }))].filter(Boolean);

        const filterAllBtn = document.getElementById('filter-all');
        categoryFiltersContainer.innerHTML = '';
        categoryFiltersContainer.appendChild(filterAllBtn);

        categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn';
            btn.dataset.category = cat;
            btn.textContent = cat;
            categoryFiltersContainer.appendChild(btn);
        });

        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                currentCategory = e.target.dataset.category;
                resetAndFilterPosts();
            });
        });
    }

    function getRandomFomoTag() {
        if (Math.random() > 0.6) return null;
        const tags = translations[currentLang].fomoTags;
        return tags[Math.floor(Math.random() * tags.length)];
    }

    function trackClick(category) {
        let prefs = JSON.parse(localStorage.getItem('trendPrefs') || '{}');
        prefs[category] = (prefs[category] || 0) + 1;
        localStorage.setItem('trendPrefs', JSON.stringify(prefs));
    }

    function getFavoriteCategory() {
        let prefs = JSON.parse(localStorage.getItem('trendPrefs') || '{}');
        if (Object.keys(prefs).length === 0) return null;
        return Object.keys(prefs).reduce((a, b) => prefs[a] > prefs[b] ? a : b);
    }

    function renderRecommendedPosts() {
        const favCategory = getFavoriteCategory();
        const recSection = document.getElementById('recommended-section');
        const recContainer = document.getElementById('recommended-container');
        
        if (!favCategory || !allPosts || allPosts.length === 0) {
            recSection.style.display = 'none';
            return;
        }

        const recommendedPosts = allPosts.filter(post => {
            const cat = post.category || (post[currentLang] && post[currentLang].category);
            return cat === favCategory;
        }).slice(0, 3);

        if (recommendedPosts.length > 0) {
            recSection.style.display = 'block';
            recContainer.innerHTML = '';
            
            recommendedPosts.forEach(post => {
                const content = post[currentLang] || post; 
                const article = document.createElement('article');
                article.className = 'post-card';
                article.style.border = '2px solid var(--primary-color)';
                article.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                
                article.innerHTML = `
                    <div class="fomo-badge" style="background: var(--primary-color);">✨ VIP</div>
                    <div class="post-image-container">
                        <img src="${post.imageUrl || content.imageUrl}" alt="${content.title}" class="post-image">
                    </div>
                    <div class="post-content">
                        <span class="post-category">${post.category || content.category}</span>
                        <h4 class="post-title">${content.title}</h4>
                        <p class="post-excerpt">${content.excerpt}</p>
                        <div class="post-footer">
                            <div class="pricing">
                                <span class="original-price">${content.originalPrice}</span>
                                <span class="post-price">${content.currentPrice}</span>
                            </div>
                            <a href="${content.affiliateLink}" target="_blank" class="buy-button track-btn" data-category="${post.category || content.category}">${translations[currentLang].buyBtn}</a>
                        </div>
                    </div>
                `;
                recContainer.appendChild(article);
            });
        } else {
            recSection.style.display = 'none';
        }
    }

    // Fonksiyon: Arama/Filtre değiştiğinde listeyi sıfırla
    function resetAndFilterPosts() {
        currentPage = 1;
        postsContainer.innerHTML = '';
        
        currentFilteredPosts = allPosts;
        if (searchTerm) {
            currentFilteredPosts = currentFilteredPosts.filter(post => {
                const content = post[currentLang] || post;
                return content.title.toLowerCase().includes(searchTerm) || content.excerpt.toLowerCase().includes(searchTerm);
            });
        }
        if (currentCategory !== 'all') {
            currentFilteredPosts = currentFilteredPosts.filter(post => {
                const cat = post.category || (post[currentLang] && post[currentLang].category);
                return cat === currentCategory;
            });
        }

        if (currentFilteredPosts.length === 0) {
            postsContainer.innerHTML = '<p style="text-align:center; color:var(--text-secondary); width: 100%;">Sonuç bulunamadı.</p>';
            return;
        }

        loadMorePosts();
    }

    // Fonksiyon: Sonraki sayfayı yükle (Infinite Scroll Logic)
    function loadMorePosts() {
        if (isLoading) return;
        
        const startIndex = (currentPage - 1) * postsPerPage;
        const endIndex = startIndex + postsPerPage;
        const postsToRender = currentFilteredPosts.slice(startIndex, endIndex);
        
        if (postsToRender.length === 0) return; // Yüklenecek başka post kalmadı
        
        isLoading = true;
        if(scrollLoader) scrollLoader.style.display = 'block';

        // Fake network delay for smooth UI feeling
        setTimeout(() => {
            postsToRender.forEach(post => {
                const content = post[currentLang] || post; 
                const fomoTag = getRandomFomoTag();
                
                const article = document.createElement('article');
                article.className = 'post-card';
                article.style.position = 'relative';
                
                const fomoHtml = fomoTag ? '<div class="fomo-badge">' + fomoTag + '</div>' : '';
                
                // Viral Share Text
                const shareText = encodeURIComponent(`Şu muazzam indirime bak: ${content.title} - ${content.currentPrice} `);
                const shareUrl = encodeURIComponent(content.affiliateLink);
                
                article.innerHTML = fomoHtml + '\n' +
                    '                <div class="post-image-container">\n' +
                    '                    <img src="' + (post.imageUrl || content.imageUrl) + '" alt="' + content.title + '" class="post-image">\n' +
                    '                </div>\n' +
                    '                <div class="post-content">\n' +
                    '                    <span class="post-category">' + (post.category || content.category) + '</span>\n' +
                    '                    <h4 class="post-title">' + content.title + '</h4>\n' +
                    '                    <p class="post-excerpt">' + content.excerpt + '</p>\n' +
                    '                    <div class="post-footer">\n' +
                    '                        <div class="pricing">\n' +
                    '                            <span class="original-price">' + content.originalPrice + '</span>\n' +
                    '                            <span class="post-price gradient-text">' + content.currentPrice + '</span>\n' +
                    '                        </div>\n' +
                    '                        <a href="' + content.affiliateLink + '" target="_blank" class="buy-button track-btn" data-category="' + (post.category || content.category) + '">' + translations[currentLang].buyBtn + '</a>\n' +
                    '                    </div>\n' +
                    '                    <div class="share-controls">\n' +
                    '                        <a href="https://api.whatsapp.com/send?text=' + shareText + shareUrl + '" target="_blank" class="share-btn share-wa"><i class="fab fa-whatsapp"></i></a>\n' +
                    '                        <a href="https://t.me/share/url?url=' + shareUrl + '&text=' + shareText + '" target="_blank" class="share-btn share-tg"><i class="fab fa-telegram-plane"></i></a>\n' +
                    '                        <a href="https://twitter.com/intent/tweet?text=' + shareText + '&url=' + shareUrl + '" target="_blank" class="share-btn share-tw"><i class="fab fa-twitter"></i></a>\n' +
                    '                    </div>\n' +
                    '                </div>\n';
                
                postsContainer.appendChild(article);
            });

            // Tracking listeners
            document.querySelectorAll('.track-btn').forEach(btn => {
                btn.removeEventListener('click', trackClickHandler); // Prevent duplicates
                btn.addEventListener('click', trackClickHandler);
            });

            isLoading = false;
            currentPage++;
            if(scrollLoader) scrollLoader.style.display = 'none';
        }, 500);
    }

    function trackClickHandler(e) {
        trackClick(e.target.dataset.category);
    }

    // Scroll Olayı Dinleyicisi
    window.addEventListener('scroll', () => {
        // Navbar Scroll - Removed inline styles, CSS will handle it via sticky position.
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.05)';
        } else {
            navbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
        }

        // Infinite Scroll
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
            loadMorePosts();
        }
    });

    searchInput.addEventListener('input', (e) => {
        searchTerm = e.target.value.toLowerCase();
        resetAndFilterPosts();
    });

    langBtn.addEventListener('click', () => {
        currentLang = currentLang === 'tr' ? 'en' : 'tr'; window.currentLang = currentLang;
        updateUI();
        if (allPosts.length > 0) {
            renderCategories();
            resetAndFilterPosts();
            renderRecommendedPosts();
        }
    });

    fetch('posts.json')
        .then(response => {
            if (!response.ok) return [];
            return response.json();
        })
        .then(data => {
            allPosts = data; window.allPosts = allPosts;
            setTimeout(() => {
                if (!data || data.length === 0) {
                    postsContainer.innerHTML = '<p style="text-align:center; color:var(--text-secondary);">Henüz hiç fırsat yakalanamadı. Botun çalışmasını bekleyin.</p>';
                } else {
                    renderCategories();
                    resetAndFilterPosts();
                    renderRecommendedPosts();
                }
            }, 1000);
        })
        .catch(error => {
            console.error('İçerikler yüklenirken hata oluştu:', error);
            postsContainer.innerHTML = '<p style="text-align:center; color:red;">İçerikler yüklenemedi. Lütfen botun çalışmasını bekleyin.</p>';
        });
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .catch(err => console.log('PWA SW Error:', err));
  });
}
document.addEventListener('DOMContentLoaded', () => {
    const mysteryBtn = document.getElementById('mystery-box-btn');
    const mysteryModal = document.getElementById('mystery-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const dealContainer = document.getElementById('mystery-deal-container');
    const timerDisplay = document.getElementById('countdown-timer');
    let timerInterval = null;

    if (!localStorage.getItem('mysteryBoxOpened')) {
        setTimeout(() => {
            mysteryBtn.style.display = 'flex';
        }, 5000);
    }

    mysteryBtn.addEventListener('click', () => {
        mysteryBtn.style.display = 'none';
        localStorage.setItem('mysteryBoxOpened', 'true');
        
        fetch('posts.json').then(res => res.json()).then(data => {
            if(!data || data.length === 0) return;
            const randomPost = data[Math.floor(Math.random() * data.length)];
            const currentLang = window.currentLang || 'tr';
            const content = randomPost[currentLang] || randomPost;
            
            dealContainer.innerHTML = `
                <article class='post-card' style='border: 2px solid var(--primary-color); margin: 0 auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);'>
                    <div class='post-image-container'>
                        <img src='${randomPost.imageUrl || content.imageUrl}' class='post-image'>
                    </div>
                    <div class='post-content'>
                        <h4 class='post-title'>${content.title}</h4>
                        <div class='pricing'>
                            <span class='original-price'>${content.originalPrice}</span>
                            <span class='post-price' style='color:var(--price-color)'>${content.currentPrice}</span>
                        </div>
                        <a href='${content.affiliateLink}' target='_blank' class='buy-button' style='background:var(--primary-color)'>HEMEN AL (Sona Eriyor)</a>
                    </div>
                </article>`;
            
            mysteryModal.classList.add('active');
            startTimer(5 * 60, timerDisplay);
            fireConfetti();
        });
    });

    closeModalBtn.addEventListener('click', () => {
        mysteryModal.classList.remove('active');
        if(timerInterval) clearInterval(timerInterval);
    });

    function startTimer(duration, display) {
        let timer = duration, minutes, seconds;
        if(timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            minutes = parseInt(timer / 60, 10);
            seconds = parseInt(timer % 60, 10);
            minutes = minutes < 10 ? '0' + minutes : minutes;
            seconds = seconds < 10 ? '0' + seconds : seconds;
            display.textContent = minutes + ':' + seconds;
            if (--timer < 0) {
                clearInterval(timerInterval);
                display.textContent = '00:00';
                dealContainer.innerHTML = '<p style="color:#ef4444; font-weight:bold;">Bu gizli fırsatın süresi doldu!</p>';
            }
        }, 1000);
    }

    function fireConfetti() {
        for(let i=0; i<30; i++) {
            const conf = document.createElement('div');
            conf.innerHTML = ['🎉','🎁','✨','💸'][Math.floor(Math.random()*4)];
            conf.style.position = 'fixed';
            conf.style.left = Math.random() * 100 + 'vw';
            conf.style.top = '-50px';
            conf.style.fontSize = (Math.random() * 20 + 10) + 'px';
            conf.style.zIndex = '9999';
            conf.style.transition = 'top ' + (Math.random()*2 + 1) + 's cubic-bezier(0.1, 0.8, 0.3, 1)';
            document.body.appendChild(conf);
            setTimeout(() => { conf.style.top = '120vh'; }, 50);
            setTimeout(() => { conf.remove(); }, 3000);
        }
    }
});
document.addEventListener('DOMContentLoaded', () => {
    // Social Proof (Simulated Live Buyers) Engine
    const proofContainer = document.getElementById('social-proof-container');
    let proofInterval = null;

    const names = {
        tr: ['Ahmet', 'Ayşe', 'Mehmet', 'Fatma', 'Can', 'Zeynep', 'Burak', 'Elif', 'Emre', 'Merve'],
        en: ['John', 'Sarah', 'Michael', 'Emma', 'David', 'Olivia', 'James', 'Sophia', 'Robert', 'Isabella']
    };

    const cities = {
        tr: ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya'],
        en: ['New York', 'London', 'Sydney', 'Toronto', 'Los Angeles', 'Chicago', 'Berlin']
    };

    const actions = {
        tr: ['az önce satın aldı!', 'şu an inceliyor', 'sepetine ekledi'],
        en: ['just purchased!', 'is viewing this', 'added to cart']
    };

    function showSocialProof() {
        if (!window.allPosts || window.allPosts.length === 0) return;
        
        // Sadece %70 ihtimalle bildirim göster (spam olmasın diye)
        if (Math.random() > 0.7) return;

        const lang = window.currentLang || 'tr';
        const randomName = names[lang][Math.floor(Math.random() * names[lang].length)];
        const randomCity = cities[lang][Math.floor(Math.random() * cities[lang].length)];
        const randomAction = actions[lang][Math.floor(Math.random() * actions[lang].length)];
        
        const randomPost = window.allPosts[Math.floor(Math.random() * window.allPosts.length)];
        const content = randomPost[lang] || randomPost;
        const productTitle = content.title.substring(0, 25) + '...';

        const toast = document.createElement('div');
        toast.className = 'social-toast';
        
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas fa-shopping-bag"></i>
            </div>
            <div class="toast-content">
                <span class="toast-user">${randomName} (${randomCity})</span>
                <span class="toast-action">${randomAction}</span>
                <span class="toast-product">${productTitle}</span>
            </div>
        `;
        
        proofContainer.appendChild(toast);

        // Toast'u CSS animasyonu bitince DOM'dan sil (5.5 saniye)
        setTimeout(() => {
            if (proofContainer.contains(toast)) {
                toast.remove();
            }
        }, 5500);
    }

    // Her 12 saniyede bir tetikle (İçeride %70 gösterme ihtimali var)
    setTimeout(() => {
        proofInterval = setInterval(showSocialProof, 12000);
    }, 10000); // Kullanıcı siteye girdikten 10 saniye sonra başlasın
});
