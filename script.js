// Mobile Menu Toggle
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const nav = document.querySelector('.nav');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        nav.classList.toggle('active');
        mobileMenuToggle.classList.toggle('active');
    });
}

// Smooth Scroll for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerHeight = document.querySelector('.header').offsetHeight;
            const targetPosition = target.offsetTop - headerHeight;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Header Scroll Effect
let lastScroll = 0;
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    } else {
        header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.05)';
    }
    
    lastScroll = currentScroll;
});

// News Tabs
const tabButtons = document.querySelectorAll('.tab-btn');
const newsContent = document.querySelector('.news-content');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons
        tabButtons.forEach(btn => btn.classList.remove('active'));
        // Add active class to clicked button
        button.classList.add('active');
        
        // Here you would typically load different content based on the tab
        // For now, we'll just show a visual feedback
        const tabName = button.getAttribute('data-tab');
        console.log(`Switched to ${tabName} tab`);
    });
});

// Intersection Observer for Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards and sections
document.querySelectorAll('.collection-card, .portfolio-item, .news-card, .resource-card, .mosaic-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Form Submission
const subscribeForm = document.querySelector('.subscribe-form');
if (subscribeForm) {
    subscribeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = subscribeForm.querySelector('input[type="email"]').value;
        alert(`Спасибо за подписку! Мы отправим новости на ${email}`);
        subscribeForm.reset();
    });
}

// Portfolio Item Click Handler
document.querySelectorAll('.portfolio-item').forEach(item => {
    item.addEventListener('click', () => {
        const title = item.querySelector('.portfolio-overlay h3').textContent;
        console.log(`Portfolio item clicked: ${title}`);
        // Here you could open a modal or navigate to a detail page
    });
});

// Collection Card Click Handler
document.querySelectorAll('.collection-card').forEach(card => {
    card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('collection-link')) {
            const collectionName = card.querySelector('.collection-name').textContent;
            console.log(`Collection clicked: ${collectionName}`);
            // Here you could navigate to a collection detail page
        }
    });
});

// Language Switch
const langSwitch = document.querySelector('.lang-switch');
if (langSwitch) {
    langSwitch.addEventListener('click', () => {
        const currentLang = langSwitch.textContent;
        langSwitch.textContent = currentLang === 'EN' ? 'RU' : 'EN';
        // Here you would implement actual language switching
        console.log(`Language switched to: ${langSwitch.textContent}`);
    });
}

// Lazy Loading Images (if you add real images later)
if ('loading' in HTMLImageElement.prototype) {
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => {
        img.src = img.dataset.src;
    });
} else {
    // Fallback for browsers that don't support lazy loading
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
    document.body.appendChild(script);
}

// Add scroll to top button functionality (optional)
const createScrollToTop = () => {
    const button = document.createElement('button');
    button.innerHTML = '↑';
    button.className = 'scroll-to-top';
    button.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: var(--primary-color);
        color: white;
        border: none;
        font-size: 24px;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 999;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    `;
    
    document.body.appendChild(button);
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            button.style.opacity = '1';
            button.style.visibility = 'visible';
        } else {
            button.style.opacity = '0';
            button.style.visibility = 'hidden';
        }
    });
    
    button.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
};

createScrollToTop();

// Add CSS for scroll to top button hover
const style = document.createElement('style');
style.textContent = `
    .scroll-to-top:hover {
        background: var(--primary-dark) !important;
        transform: translateY(-3px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3) !important;
    }
`;
document.head.appendChild(style);

// Shop and Cart Functionality
// Безопасность: URL и ключ можно задать через data-атрибуты на теге <script> или через window (не коммить секреты в git).
// Пример в HTML: <script src="script.js" data-products-api-url="https://..." data-products-api-key="твой-секрет"></script>
(function() {
    var s = document.currentScript;
    window.__PRODUCTS_API_URL = (s && s.getAttribute('data-products-api-url')) || window.__PRODUCTS_API_URL || '';
    window.__PRODUCTS_API_KEY = (s && s.getAttribute('data-products-api-key')) || window.__PRODUCTS_API_KEY || '';
    window.__PRODUCTS_JSON_URL = (s && s.getAttribute('data-products-json-url')) || window.__PRODUCTS_JSON_URL || '';
})();
const PRODUCTS_API_URL = window.__PRODUCTS_API_URL || '';
const PRODUCTS_API_KEY = window.__PRODUCTS_API_KEY || '';
// Статичный JSON из Git (n8n пушит сюда) — приоритет над API, n8n в интернет не нужен
const PRODUCTS_JSON_URL = window.__PRODUCTS_JSON_URL || 'products.json';

let products = [
    {
        id: 1,
        name: 'Паркетная доска Дуб Натуральный',
        category: 'natural',
        price: 2450,
        unit: 'м²',
        specs: 'Толщина: 14мм | Класс: 32 | Порода: Дуб',
        image: 'img/products/natural-touch.jpg',
        badge: 'Хит продаж'
    },
    {
        id: 2,
        name: 'Паркетная доска Ясень Темный',
        category: 'dark',
        price: 2850,
        unit: 'м²',
        specs: 'Толщина: 15мм | Класс: 33 | Порода: Ясень',
        image: 'img/products/dark-wood.jpg',
        badge: 'Новинка'
    },
    {
        id: 3,
        name: 'Паркетная доска Орех Серый',
        category: 'grey',
        price: 3200,
        unit: 'м²',
        specs: 'Толщина: 16мм | Класс: 33 | Порода: Орех',
        image: 'img/products/grey-shadow.jpg',
        badge: null
    },
    {
        id: 4,
        name: 'Паркетная доска Бук Светлый',
        category: 'white',
        price: 2200,
        unit: 'м²',
        specs: 'Толщина: 14мм | Класс: 32 | Порода: Бук',
        image: 'img/products/white-brithe.jpg',
        badge: 'Акция'
    },
    {
        id: 5,
        name: 'Паркетная доска Дуб Золотой',
        category: 'natural',
        price: 2950,
        unit: 'м²',
        specs: 'Толщина: 15мм | Класс: 33 | Порода: Дуб',
        image: 'img/products/designer-solution.jpg',
        badge: null
    },
    {
        id: 6,
        name: 'Паркетная доска Орех Американский',
        category: 'dark',
        price: 3500,
        unit: 'м²',
        specs: 'Толщина: 16мм | Класс: 34 | Порода: Орех',
        image: 'img/products/american.jpg',
        badge: 'Премиум'
    },
    {
        id: 7,
        name: 'Паркетная доска Ясень Светлый',
        category: 'white',
        price: 2600,
        unit: 'м²',
        specs: 'Толщина: 14мм | Класс: 32 | Порода: Ясень',
        image: 'img/products/white-brithe.jpg',
        badge: null
    },
    {
        id: 8,
        name: 'Паркетная доска Дуб Серый',
        category: 'grey',
        price: 2750,
        unit: 'м²',
        specs: 'Толщина: 15мм | Класс: 33 | Порода: Дуб',
        image: 'img/products/grey-shadow.jpg',
        badge: null
    }
];

let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentFilter = 'all';

// Путь из БД (/data/files/images/...) → путь на сайте (img/products/...). Картинки без файла не скрывают товар.
var IMAGE_PATH_PREFIX = 'img/products'; // куда мапятся пути из базы
var IMAGE_FALLBACK = 'img/products/natural-touch.jpg';

function normalizeImagePath(raw) {
    if (!raw) return IMAGE_FALLBACK;
    var path = String(raw).replace(/\\/g, '/').trim();
    if (!path) return IMAGE_FALLBACK;
    // /data/files/images/COSWICK/1171-4805-30.jpg → img/products/COSWICK/1171-4805-30.jpg
    if (path.indexOf('/data/files/images') === 0)
        path = IMAGE_PATH_PREFIX + path.slice('/data/files/images'.length);
    return path;
}

// Привести товар из API к формату сайта. Товар всегда показываем (название, поля, цена); без картинки — заглушка.
function mapProductFromApi(item) {
    var meta = item.metadata || {};
    return {
        id: Number(item.id) || item.id || (item.sku || '').replace(/\s/g, '_'),
        name: item.name || item.title || item.nazvanie || meta.decor || item.format_type || item.sku || item.collection || '',
        category: (item.category || item.category_id || meta.palette || 'natural').toString().toLowerCase().replace(/\s+/g, '_'),
        price: Number(item.rrp_rub_m2) || Number(item.price) || 0,
        unit: item.unit || 'м²',
        specs: item.specs || item.description || item.specifications || [item.size, item.model, meta.finish, meta.wood_species].filter(Boolean).join(' · ') || '',
        image: normalizeImagePath(item.image_path || item.image_local || item.image || item.image_url || item.photo || meta.image_url_800 || meta.image_url_350),
        badge: item.badge || item.label || null
    };
}

// Загрузить товары: 1) из API (если задан PRODUCTS_API_URL), 2) иначе из products.json (n8n пушит в Git)
function loadProductsFromAPI() {
    var url = (PRODUCTS_API_URL && PRODUCTS_API_URL.trim()) ? PRODUCTS_API_URL : PRODUCTS_JSON_URL;
    var useApi = !!(PRODUCTS_API_URL && PRODUCTS_API_URL.trim());
    const shopGrid = document.getElementById('shopGrid');
    if (shopGrid) shopGrid.innerHTML = '<p class="shop-loading">Загрузка товаров...</p>';

    var headers = {};
    if (useApi && PRODUCTS_API_KEY) headers['X-API-Key'] = PRODUCTS_API_KEY;
    fetch(url, { method: 'GET', headers: headers })
        .then(function(res) { return res.ok ? res.json() : Promise.reject(res.status); })
        .then(function(data) {
            var list = Array.isArray(data) ? data : (data.products || data.items || data.data || []);
            if (list.length) products = list.map(mapProductFromApi);
            renderProducts();
            updateCartCount();
            renderCart();
        })
        .catch(function() {
            if (shopGrid) shopGrid.innerHTML = '';
            renderProducts();
            updateCartCount();
            renderCart();
        });
}

// Initialize Shop
function initShop() {
    loadProductsFromAPI();
}

// Render Products
function renderProducts(filter = 'all') {
    const shopGrid = document.getElementById('shopGrid');
    if (!shopGrid) return;

    const filteredProducts = filter === 'all' 
        ? products 
        : products.filter(p => p.category === filter);

    shopGrid.innerHTML = filteredProducts.map(product => `
        <div class="product-card" data-product-id="${product.id}">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" loading="lazy" data-fallback="${IMAGE_FALLBACK}" onerror="this.onerror=null;this.src=this.dataset.fallback||'${IMAGE_FALLBACK}'">
                ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
            </div>
            <div class="product-info">
                <div class="product-category">${getCategoryName(product.category)}</div>
                <h3 class="product-name">${product.name}</h3>
                ${product.specs ? `<p class="product-specs">${product.specs}</p>` : ''}
                <div class="product-price">
                    <span class="product-price-value">${product.price.toLocaleString()} ₽</span>
                    <span class="product-price-unit">/ ${product.unit}</span>
                </div>
                <div class="product-actions">
                    <button class="btn-add-cart" onclick="addToCart(${JSON.stringify(product.id)})">В корзину</button>
                    <button class="btn-view" onclick="viewProduct(${JSON.stringify(product.id)})">Подробнее</button>
                </div>
            </div>
        </div>
    `).join('');

    // Animate products
    const productCards = shopGrid.querySelectorAll('.product-card');
    productCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        setTimeout(() => {
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

function getCategoryName(category) {
    const names = {
        'natural': 'Натуральная палитра',
        'dark': 'Таинственный лес',
        'grey': 'Оттенки серого',
        'white': 'Белые ночи'
    };
    return names[category] || category;
}

// Add to Cart
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }

    saveCart();
    updateCartCount();
    renderCart();
    
    // Show notification
    showNotification('Товар добавлен в корзину');
}

// Remove from Cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartCount();
    renderCart();
}

// Update Quantity
function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;

    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        saveCart();
        updateCartCount();
        renderCart();
    }
}

// Save Cart to LocalStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Update Cart Count
function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const total = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = total;
        cartCount.style.display = total > 0 ? 'flex' : 'none';
    }
}

// Render Cart
function renderCart() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    if (!cartItems) return;

    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="cart-empty">Корзина пуста</p>';
        if (cartTotal) cartTotal.textContent = '0 ₽';
        return;
    }

    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-specs">${item.specs}</div>
                <div class="cart-item-price">${item.price.toLocaleString()} ₽ / ${item.unit}</div>
                <div class="cart-item-actions">
                    <div class="quantity-control">
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">−</button>
                        <span class="quantity-value">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                    </div>
                    <button class="remove-item" onclick="removeFromCart(${item.id})">Удалить</button>
                </div>
            </div>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (cartTotal) {
        cartTotal.textContent = `${total.toLocaleString()} ₽`;
    }
}

// Cart Modal
const cartBtn = document.getElementById('cartBtn');
const cartModal = document.getElementById('cartModal');
const cartClose = document.getElementById('cartClose');

if (cartBtn) {
    cartBtn.addEventListener('click', () => {
        if (cartModal) {
            cartModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    });
}

if (cartClose) {
    cartClose.addEventListener('click', () => {
        if (cartModal) {
            cartModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

if (cartModal) {
    cartModal.addEventListener('click', (e) => {
        if (e.target === cartModal) {
            cartModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// Shop Filters
const filterButtons = document.querySelectorAll('.filter-btn');
filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.getAttribute('data-filter');
        renderProducts(currentFilter);
    });
});

// View Product
function viewProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        alert(`Подробная информация о товаре:\n\n${product.name}\n${product.specs}\n\nЦена: ${product.price.toLocaleString()} ₽/${product.unit}`);
    }
}

// Checkout
const checkoutBtn = document.querySelector('.cart-checkout');
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Корзина пуста');
            return;
        }
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        alert(`Заказ оформлен!\n\nТоваров: ${cart.reduce((sum, item) => sum + item.quantity, 0)}\nСумма: ${total.toLocaleString()} ₽\n\nСпасибо за покупку!`);
        cart = [];
        saveCart();
        updateCartCount();
        renderCart();
        if (cartModal) {
            cartModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// Notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--primary-color);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        z-index: 3000;
        animation: slideInRight 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add notification animations
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(notificationStyle);

// Initialize shop when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initShop);
} else {
    initShop();
}

console.log('Website initialized successfully!');

