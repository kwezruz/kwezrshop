const tg = window.Telegram.WebApp;
tg.expand();

let currentUser = null;
let selectedService = null;
let selectedDonateAmount = 0;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // Get user data from Telegram
    const user = tg.initDataUnsafe.user;
    if (user) {
        currentUser = user;
        loadUserData();
    }
    
    navigate('home');
}

function loadUserData() {
    // Load user data from backend
    fetch('api/user.php')
        .then(res => res.json())
        .then(data => {
            currentUser.balance = data.balance;
            currentUser.stars = data.stars;
            updateUI();
        })
        .catch(err => console.error('Error:', err));
}

function updateUI() {
    // Update balance displays
    const balanceElements = document.querySelectorAll('.balance-amount');
    balanceElements.forEach(el => {
        if (currentUser) {
            el.textContent = formatPrice(currentUser.balance || 0);
        }
    });
}

function formatPrice(price) {
    return new Intl.NumberFormat('uz-UZ').format(price) + " so'm";
}

function navigate(page) {
    // Update active nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.nav-item')?.classList.add('active');
    
    // Load page content
    const mainContent = document.getElementById('mainContent');
    
    switch(page) {
        case 'home':
            loadHomePage();
            break;
        case 'services':
            loadServicesPage();
            break;
        case 'orders':
            loadOrdersPage();
            break;
        case 'profile':
            loadProfilePage();
            break;
    }
}

function loadHomePage() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="card balance-card">
            <div class="balance-label">Sizning balansingiz</div>
            <div class="balance-amount">${formatPrice(currentUser?.balance || 0)}</div>
            <div class="balance-actions">
                <button class="btn btn-primary" onclick="showTopup()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
                    </svg>
                    Hisobni to'ldirish
                </button>
                <button class="btn btn-secondary" onclick="showDonate()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/>
                    </svg>
                    Qo'llab-quvvatlash
                </button>
            </div>
        </div>
        
        <div class="menu-list">
            <div class="menu-item" onclick="navigate('services')">
                <div class="menu-icon" style="background:rgba(52,152,219,0.2);color:#3498db;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L3.16 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" fill="currentColor"/>
                    </svg>
                </div>
                <div class="menu-content">
                    <div class="menu-title">Xizmatlar</div>
                    <div class="menu-subtitle">Barcha xizmatlarni ko'rish</div>
                </div>
            </div>
            
            <div class="menu-item" onclick="navigate('orders')">
                <div class="menu-icon" style="background:rgba(39,174,96,0.2);color:#27ae60;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14h-2v-4H6v-2h4V7h2v4h4v2h-4v4z" fill="currentColor"/>
                    </svg>
                </div>
                <div class="menu-content">
                    <div class="menu-title">Buyurtmalarim</div>
                    <div class="menu-subtitle">Buyurtmalar tarixi</div>
                </div>
            </div>
        </div>
    `;
}

function loadServicesPage() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <h2 style="margin-bottom:20px;">Xizmatlar</h2>
        <div class="services-grid" id="servicesGrid">
            <!-- Services will be loaded here -->
        </div>
    `;
    
    loadServices();
}

function loadServices() {
    fetch('api/services.php')
        .then(res => res.json())
        .then(data => {
            const grid = document.getElementById('servicesGrid');
            grid.innerHTML = data.map(service => `
                <div class="service-card" onclick="selectService(${service.id})">
                    <div class="service-icon" style="background:rgba(52,152,219,0.2);"></div>
                    <div class="service-name">${service.name}</div>
                    <div class="service-price">${formatPrice(service.price)}</div>
                </div>
            `).join('');
        });
}

function selectService(serviceId) {
    selectedService = serviceId;
    showOrderForm(serviceId);
}

function showOrderForm(serviceId) {
    fetch(`api/service.php?id=${serviceId}`)
        .then(res => res.json())
        .then(service => {
            const mainContent = document.getElementById('mainContent');
            mainContent.innerHTML = `
                <h2 style="margin-bottom:20px;">${service.name}</h2>
                <form onsubmit="createOrder(event)">
                    <div class="form-group">
                        <label class="form-label">Havola</label>
                        <input type="url" class="form-input" name="link" required placeholder="https://...">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Miqdor</label>
                        <input type="number" class="form-input" name="quantity" min="${service.min_quantity}" max="${service.max_quantity}" required>
                        <small style="color:var(--text-secondary);margin-top:8px;display:block;">Min: ${service.min_quantity}, Max: ${service.max_quantity}</small>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Narx</label>
                        <div class="balance-amount" style="font-size:24px;">${formatPrice(service.price)}</div>
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">Buyurtma berish</button>
                    <button type="button" class="btn btn-secondary btn-block" onclick="navigate('services')" style="margin-top:12px;">Orqaga</button>
                </form>
            `;
        });
}

function createOrder(event) {
    event.preventDefault();
    const form = event.target;
    const data = new FormData(form);
    data.append('service_id', selectedService);
    
    fetch('api/create-order.php', {
        method: 'POST',
        body: data
    })
    .then(res => res.json())
    .then(result => {
        if (result.success) {
            tg.showAlert('Buyurtma muvaffaqiyatli yaratildi!');
            navigate('orders');
        } else {
            tg.showAlert('Xatolik: ' + result.message);
        }
    });
}

function loadOrdersPage() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <h2 style="margin-bottom:20px;">Buyurtmalarim</h2>
        <div id="ordersList">
            <!-- Orders will be loaded here -->
        </div>
    `;
    
    loadOrders();
}

function loadOrders() {
    fetch('api/orders.php')
        .then(res => res.json())
        .then(orders => {
            const list = document.getElementById('ordersList');
            if (orders.length === 0) {
                list.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:40px;">Hali buyurtmalar yo\'q</p>';
                return;
            }
            
            list.innerHTML = orders.map(order => `
                <div class="card">
                    <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
                        <strong>Buyurtma #${order.id}</strong>
                        <span class="status-badge status-${order.status}">${getStatusText(order.status)}</span>
                    </div>
                    <div style="color:var(--text-secondary);font-size:14px;margin-bottom:8px;">${order.service_name}</div>
                    <div style="display:flex;justify-content:space-between;font-size:14px;">
                        <span>Miqdor: ${order.quantity}</span>
                        <span style="color:var(--primary);font-weight:bold;">${formatPrice(order.price)}</span>
                    </div>
                    <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);font-size:12px;color:var(--text-secondary);">
                        ${new Date(order.created_at).toLocaleString('uz-UZ')}
                    </div>
                </div>
            `).join('');
        });
}

function getStatusText(status) {
    const statuses = {
        'pending': '⏳ Kutmoqda',
        'processing': '🔄 Jarayonda',
        'completed': '✅ Bajarildi',
        'cancelled': '❌ Bekor qilindi'
    };
    return statuses[status] || status;
}

function loadProfilePage() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="profile-header">
            <div class="profile-avatar"></div>
            <div class="profile-name">${currentUser?.first_name || 'Foydalanuvchi'}</div>
            <div class="profile-username">@${currentUser?.username || 'username'}</div>
            <div class="profile-stats">
                <div class="stat-item">
                    <div class="stat-value">${formatPrice(currentUser?.balance || 0)}</div>
                    <div class="stat-label">Balans</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${currentUser?.stars || 0}</div>
                    <div class="stat-label">Stars</div>
                </div>
            </div>
        </div>
        
        <div class="menu-list">
            <div class="menu-item" onclick="showDonate()">
                <div class="menu-icon" style="background:rgba(243,156,18,0.2);color:#f39c12;">⭐</div>
                <div class="menu-content">
                    <div class="menu-title">Qo'llab-quvvatlash</div>
                    <div class="menu-subtitle">Stars yuborish</div>
                </div>
            </div>
            
            <div class="menu-item" onclick="showTopup()">
                <div class="menu-icon" style="background:rgba(52,152,219,0.2);color:#3498db;">💳</div>
                <div class="menu-content">
                    <div class="menu-title">Hisobni to'ldirish</div>
                    <div class="menu-subtitle">VISA orqali</div>
                </div>
            </div>
        </div>
    `;
}

function showDonate() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <h2 style="margin-bottom:20px;">⭐ Qo'llab-quvvatlash</h2>
        <div class="card">
            <p style="margin-bottom:20px;color:var(--text-secondary);">Qancha stars donat qilmoqchisiz?</p>
            <div class="donate-amounts">
                <div class="amount-btn" onclick="selectDonateAmount(10)">
                    <div class="amount-value">10</div>
                    <div class="amount-label">stars</div>
                </div>
                <div class="amount-btn" onclick="selectDonateAmount(50)">
                    <div class="amount-value">50</div>
                    <div class="amount-label">stars</div>
                </div>
                <div class="amount-btn" onclick="selectDonateAmount(100)">
                    <div class="amount-value">100</div>
                    <div class="amount-label">stars</div>
                </div>
                <div class="amount-btn" onclick="selectDonateAmount(500)">
                    <div class="amount-value">500</div>
                    <div class="amount-label">stars</div>
                </div>
                <div class="amount-btn" onclick="selectDonateAmount(1000)">
                    <div class="amount-value">1000</div>
                    <div class="amount-label">stars</div>
                </div>
                <div class="amount-btn" onclick="showCustomDonate()">
                    <div class="amount-value"></div>
                    <div class="amount-label">Boshqa</div>
                </div>
            </div>
            <button class="btn btn-primary btn-block" onclick="confirmDonate()" ${!selectedDonateAmount ? 'disabled' : ''}>
                Donat qilish
            </button>
            <button class="btn btn-secondary btn-block" onclick="navigate('profile')" style="margin-top:12px;">
                Orqaga
            </button>
        </div>
    `;
}

function selectDonateAmount(amount) {
    selectedDonateAmount = amount;
    document.querySelectorAll('.amount-btn').forEach(btn => btn.classList.remove('selected'));
    event.target.closest('.amount-btn').classList.add('selected');
}

function showCustomDonate() {
    const amount = prompt("Stars miqdorini kiriting:");
    if (amount && amount > 0) {
        selectedDonateAmount = parseInt(amount);
    }
}

function confirmDonate() {
    if (!selectedDonateAmount) return;
    
    fetch('api/donate.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({stars: selectedDonateAmount})
    })
    .then(res => res.json())
    .then(result => {
        if (result.success) {
            tg.showAlert(`✅ Donatsiyangiz qabul qilindi!\n\nRahmat, siz ${selectedDonateAmount} stars yubordingiz. `);
            loadUserData();
            navigate('profile');
        } else {
            tg.showAlert('❌ ' + result.message);
        }
    });
}

function showTopup() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <h2 style="margin-bottom:20px;">💳 Hisobni to'ldirish</h2>
        <div class="topup-methods">
            <div class="topup-method" onclick="openVisaTopup()">
                <div class="payment-logo">VISA</div>
                <div style="flex:1;">
                    <div style="font-weight:500;margin-bottom:4px;">VISA karta</div>
                    <div style="font-size:13px;color:var(--text-secondary);">Karta orqali to'lov</div>
                </div>
            </div>
            
            <div class="topup-method" onclick="openTelegram('Zalsee')">
                <div class="payment-logo" style="background:#0088cc;">TG</div>
                <div style="flex:1;">
                    <div style="font-weight:500;margin-bottom:4px;">Admin orqali</div>
                    <div style="font-size:13px;color:var(--text-secondary);">@Zalsee</div>
                </div>
            </div>
        </div>
        <button class="btn btn-secondary btn-block" onclick="navigate('home')" style="margin-top:20px;">
            Orqaga
        </button>
    `;
}

function openVisaTopup() {
    tg.showAlert("💳 VISA orqali to'lov\n\nHozircha to'lovlar admin orqali amalga oshiriladi.\n\nIltimos, @Zalsee bilan bog'laning.");
    openTelegram('Zalsee');
}

function openTelegram(username) {
    tg.openTelegramLink(`https://t.me/${username}`);
}

function toggleMenu() {
    tg.showPopup({
        title: 'Menyu',
        message: 'Qo\'shimcha imkoniyatlar tez orada qo\'shiladi!',
        buttons: [{type: 'ok'}]
    });
}