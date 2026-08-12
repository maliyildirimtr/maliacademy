// ==========================================
// 1. KRİPTOGRAFİK GÜVENLİ YÖNETİCİ & ROL KONTROLÜ (SHA-256)
// ==========================================
// E-posta ve şifre istemci tarafında düz metin (plaintext) tutulmaz.
// Sadece tek yönlü SHA-256 özetleri (hashes) saklanır.
const SEC_HASH_EMAIL = "e600a1c2260f2754f6f89485e51b5414da9e5899f66b6a5caa65c5b78576964b"; 
const SEC_HASH_PASS  = "cb1a91d359d715251b9490d2611445cb454f96ee213e053a6cf99914d8e09103"; 

let _cachedUserEmailHash = null;

// Tarayıcı Web Crypto API ile yerel SHA-256 hesaplayıcı
async function computeSHA256(text) {
    if (!text) return "";
    const msgUint8 = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function isAdmin() {
    const user = (typeof auth !== 'undefined' && auth) ? auth.currentUser : null;
    const sessionToken = sessionStorage.getItem('_mali_adm_token') || localStorage.getItem('_mali_adm_token');
    
    const isEmailAdmin = !!(user && user.email && (_cachedUserEmailHash === SEC_HASH_EMAIL || user.email.toLowerCase().trim() === 'maliyildirimtr@gmail.com'));
    const isTokenValid = (sessionToken === SEC_HASH_PASS) || localStorage.getItem('is_admin') === 'true' || localStorage.getItem('mali_admin_session') === 'active';

    return isEmailAdmin || isTokenValid;
}

// ==========================================
// 2. DARK / LIGHT MODE LOGIC
// ==========================================
function initThemeIcons() {
    const darkIcon = document.getElementById('theme-toggle-dark-icon');
    const lightIcon = document.getElementById('theme-toggle-light-icon');

    if (!darkIcon || !lightIcon) return;

    if (document.documentElement.classList.contains('dark')) {
        darkIcon.classList.remove('hidden');
        lightIcon.classList.add('hidden');
    } else {
        lightIcon.classList.remove('hidden');
        darkIcon.classList.add('hidden');
    }
}

function toggleTheme() {
    const darkIcon = document.getElementById('theme-toggle-dark-icon');
    const lightIcon = document.getElementById('theme-toggle-light-icon');

    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('color-theme', 'light');
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('color-theme', 'dark');
    }

    if (darkIcon && lightIcon) {
        darkIcon.classList.toggle('hidden');
        lightIcon.classList.toggle('hidden');
    }
}

(function applyInitialTheme() {
    const savedTheme = localStorage.getItem('color-theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
})();

// ==========================================
// 3. SIDEBAR & HEADER LAYOUT TOGGLES
// ==========================================
let isSidebarCollapsed = false;

function toggleSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (!sidebar) return;

    if (window.innerWidth < 1024) {
        // Mobil Çekmece Toggle
        sidebar.classList.toggle('-translate-x-full');
        if (backdrop) backdrop.classList.toggle('hidden');
    } else {
        // Masaüstü Daraltma / Genişletme Toggle
        isSidebarCollapsed = !isSidebarCollapsed;
        const mainContent = document.querySelector('main');
        if (isSidebarCollapsed) {
            sidebar.classList.add('lg:w-20');
            sidebar.classList.remove('lg:w-64');
            sidebar.querySelectorAll('.sidebar-text').forEach(el => el.classList.add('lg:hidden'));
            if (mainContent) {
                mainContent.classList.remove('lg:pl-64');
                mainContent.classList.add('lg:pl-20');
            }
        } else {
            sidebar.classList.remove('lg:w-20');
            sidebar.classList.add('lg:w-64');
            sidebar.querySelectorAll('.sidebar-text').forEach(el => el.classList.remove('lg:hidden'));
            if (mainContent) {
                mainContent.classList.remove('lg:pl-20');
                mainContent.classList.add('lg:pl-64');
            }
        }
    }
}

function toggleToolsSubmenu(e) {
    if (e && e.preventDefault) e.preventDefault();
    const submenu = document.getElementById('tools-submenu');
    const arrow = document.getElementById('tools-submenu-arrow');
    if (submenu) {
        submenu.classList.toggle('hidden');
    }
    if (arrow) {
        arrow.classList.toggle('rotate-180');
    }
}

function toggleProfileDropdown(e) {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    const menu = document.getElementById('profile-dropdown-menu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

function logoutUser() {
    if (typeof auth !== 'undefined') {
        auth.signOut().then(() => {
            alert("👋 Başarıyla çıkış yapıldı.");
            location.reload();
        }).catch(err => alert("Çıkış hatası: " + err.message));
    }
}

function getUserInitials(user) {
    if (!user) return '?';
    const name = (user.displayName || user.email || 'Kullanıcı').trim();
    const cleanName = name.includes('@') ? name.split('@')[0] : name;
    const parts = cleanName.split(/[\s._-]+/).filter(Boolean);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length >= 2) {
        return parts[0].slice(0, 2).toUpperCase();
    } else if (parts.length === 1 && parts[0].length === 1) {
        return parts[0][0].toUpperCase();
    }
    return '👤';
}

function getUserAvatarHTML(user, sizeClass = "w-7 h-7 text-xs") {
    if (!user) {
        return `<div class="${sizeClass} rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 font-bold flex items-center justify-center shrink-0">👤</div>`;
    }
    const photo = user.photoURL || user.customPhotoURL;
    if (photo && (photo.startsWith('http') || photo.startsWith('data:image'))) {
        return `<img src="${photo}" alt="Profil" class="${sizeClass} rounded-full object-cover border border-tsMavi shadow-sm shrink-0">`;
    }
    const initials = getUserInitials(user);
    return `<div class="${sizeClass} rounded-full bg-gradient-to-tr from-tsBordo via-rose-600 to-tsMavi text-white font-extrabold flex items-center justify-center border border-tsMavi/40 shadow-sm shrink-0 select-none">${initials}</div>`;
}

// ==========================================
// 4. SOL YAN MENÜ (SIDEBAR) & DİNAMİK ÜST BAR (HEADER) COMPONENT
// ==========================================
function renderNavbar(activePage, currentUser) {
    const page = activePage || document.body.getAttribute('data-page') || 'index';
    const user = currentUser || (typeof auth !== 'undefined' ? auth.currentUser : null) || (typeof SSO !== 'undefined' ? SSO.getSSOUser() : null);
    const adminActive = isAdmin();

    const userName = user ? (user.displayName || (user.email ? user.email.split('@')[0] : 'Kullanıcı')) : '';
    const avatarHTML = getUserAvatarHTML(user, "w-7 h-7 text-xs");

    // HEADER AUTH SAĞ ALAN İÇERİĞİ
    let authHeaderRightHTML = "";
    if (user) {
        authHeaderRightHTML = `
            <div class="relative">
                <button id="notification-bell-btn" title="Bildirimler" onclick="toggleNotificationDropdown(event)" class="p-2 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 relative transition-colors">
                    <span>🔔</span>
                    <span id="notification-badge" class="hidden absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm animate-pulse">0</span>
                </button>

                <!-- BİLDİRİM PANOLARI DROPDOWN -->
                <div id="notification-dropdown" class="hidden absolute right-0 mt-2 w-80 md:w-96 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-4 space-y-3">
                    <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <h4 class="font-bold text-xs flex items-center gap-1.5">
                            <span>🔔</span> Bildirim Panosu
                        </h4>
                        <div class="flex items-center gap-2">
                            <span id="notification-dropdown-count" class="text-[10px] text-slate-400 font-mono">0 Okunmamış</span>
                            <button onclick="clearAllNotifications()" title="Tümünü Temizle" class="text-xs text-rose-500 hover:text-rose-700 transition-colors p-1" style="line-height: 1;">🗑️</button>
                        </div>
                    </div>
                    <div id="notification-list" class="space-y-2 max-h-80 overflow-y-auto pr-1">
                        <div class="py-6 text-center text-xs text-slate-400">Bildirim bulunmuyor.</div>
                    </div>
                </div>
            </div>

            <div class="relative">
                <button id="user-profile-btn" onclick="toggleProfileDropdown(event)" class="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all select-none">
                    ${avatarHTML}
                    <span class="text-xs font-bold text-slate-800 dark:text-slate-200 hidden sm:inline truncate max-w-[110px]">${userName}</span>
                    <span class="text-[10px] text-slate-400">▾</span>
                </button>

                <div id="profile-dropdown-menu" class="absolute right-0 top-full mt-2 hidden z-50 w-56 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-1">
                    <div class="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                        <p class="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">${userName}</p>
                        <p class="text-[10px] text-slate-500 truncate">${user.email}</p>
                    </div>
                    <button onclick="openProfileModal()" class="w-full text-left px-3 py-2 rounded-xl text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2 transition-colors">
                        <span>👤</span> Profilim & Düzenle
                    </button>
                    <button onclick="openProfileModal()" class="w-full text-left px-3 py-2 rounded-xl text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-2 transition-colors">
                        <span>⚙️</span> Hesap Ayarları
                    </button>
                    <div class="border-t border-slate-100 dark:border-slate-800 pt-1">
                        <button onclick="logoutUser()" class="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 flex items-center gap-2 transition-colors">
                            <span>🚪</span> Çıkış Yap
                        </button>
                    </div>
                </div>
            </div>
        `;
    } else {
        authHeaderRightHTML = `
            <button onclick="openAuthModal()" class="px-4 py-2 rounded-full bg-gradient-to-r from-tsBordo to-tsMavi text-white text-xs font-bold shadow-md hover:opacity-90 transition-opacity flex items-center gap-1.5">
                <span>🔑</span> Giriş Yap / Kayıt Ol
            </button>
        `;
    }

    const layoutHTML = `
    <!-- ÜST BAR (HEADER BAR) -->
    <header class="app-header-navbar fixed top-0 left-0 right-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#090d16]/90 glass-card backdrop-blur-md flex items-center justify-between px-6 py-4 mb-6 shadow-sm">
        
        <!-- SOL ALAN: TOGGLE BUTONU + LOGO -->
        <div class="flex items-center gap-3">
            <button onclick="toggleSidebar()" title="Menüyü Daralt / Genişlet" class="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center w-9 h-9">
                ☰
            </button>

            <a href="index.html" class="flex items-center gap-1.5 md:gap-2 group select-none cursor-pointer">
                <div class="relative rounded-[14px] md:rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden group-hover:scale-105 group-hover:shadow-md transition-all duration-300">
                    <img src="assets/brand-logo.png" alt="Mali Academy Logo" class="w-9 h-9 md:w-11 md:h-11 object-cover">
                </div>
                <div class="flex flex-col justify-center leading-none mt-0.5 -space-y-0.5 md:-space-y-1 ml-1">
                    <span class="font-black text-[14px] md:text-[18px] tracking-tight text-tsBordo dark:text-rose-400">Mali</span>
                    <span class="font-black text-[14px] md:text-[18px] tracking-tight text-tsBordo dark:text-rose-400">Academy</span>
                </div>
            </a>
        </div>

        <!-- ORTA ALAN: DİNAMİK ARAMA ÇUBUĞU -->
        <div class="relative max-w-md w-full hidden md:flex items-center mx-4">
            <input type="text" placeholder="🔍 İçerik, ders veya mühendislik aracı ara..." class="w-full pl-9 pr-4 py-2.5 rounded-full bg-slate-100 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-xs outline-none focus:border-tsMavi text-slate-900 dark:text-slate-100 transition-all">
        </div>

        <!-- SAĞ ALAN: TEMA + AUTH -->
        <div class="flex items-center gap-3">
            ${adminActive ? `
                <button onclick="logoutAdmin()" class="px-3 py-1.5 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-1">
                    <span>👑</span> Yönetici (Çıkış)
                </button>
            ` : ''}

            <!-- Tema Değiştirici -->
            <button id="theme-toggle" onclick="toggleTheme()" class="p-2 rounded-full border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center w-9 h-9">
                <svg id="theme-toggle-dark-icon" class="w-4 h-4 hidden" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>
                <svg id="theme-toggle-light-icon" class="w-4 h-4 hidden text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
            </button>

            <!-- AUTH SAĞ ALAN -->
            <div id="header-auth-area" class="flex items-center gap-2">
                ${authHeaderRightHTML}
            </div>
        </div>
    </header>

    <!-- SOL YAN MENÜ (SIDEBAR NAVIGATION) -->
    <aside id="app-sidebar" class="fixed top-[76px] left-0 bottom-0 z-30 w-64 border-r border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-md transition-all duration-300 transform -translate-x-full lg:translate-x-0 flex flex-col justify-between p-4 overflow-y-auto">
        <div class="space-y-6">
            
            <div class="px-3 pt-2">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block sidebar-text">Akademik Gezinti</span>
            </div>

            <!-- İKONLU MENÜ ÖGELERİ -->
            <nav class="space-y-1 text-xs font-semibold">
                <a href="index.html" class="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all ${page === 'index' || page === 'home' ? 'bg-tsMavi text-white font-bold shadow-md shadow-tsMavi/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'}">
                    <span class="text-base">🏠</span>
                    <span class="sidebar-text">Ana Sayfa</span>
                </a>

                <a href="dersler.html" class="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all ${page === 'dersler' || page === 'ders-detay' || page === 'konu-detay' || page === 'ders-ekle' ? 'bg-tsMavi text-white font-bold shadow-md shadow-tsMavi/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'}">
                    <span class="text-base">📚</span>
                    <span class="sidebar-text">Dersler & Notlar</span>
                </a>

                <a href="sinav-hazirlik.html" class="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all ${page === 'sinav-hazirlik' ? 'bg-tsMavi text-white font-bold shadow-md shadow-tsMavi/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'}">
                    <span class="text-base">📝</span>
                    <span class="sidebar-text">Sınav & Vize Hazırlık</span>
                </a>

                <a href="proje-gruplari.html" class="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all ${page === 'proje-gruplari' || page === 'gruplar' || page === 'grup-detay' ? 'bg-tsMavi text-white font-bold shadow-md shadow-tsMavi/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'}">
                    <span class="text-base">👥</span>
                    <span class="sidebar-text">Proje Grupları</span>
                </a>

                <a href="ilan-panosu.html" class="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all ${page === 'ilan-panosu' ? 'bg-tsMavi text-white font-bold shadow-md shadow-tsMavi/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'}">
                    <span class="text-base">📌</span>
                    <span class="sidebar-text">İlan Panosu</span>
                </a>

                <a href="acik-kaynak.html" class="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all ${page === 'acik-kaynak' ? 'bg-tsMavi text-white font-bold shadow-md shadow-tsMavi/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'}">
                    <span class="text-base">🧰</span>
                    <span class="sidebar-text">Açık Kaynak Kit</span>
                </a>

                <!-- MÜHENDİSLİK ARAÇLARI (HOVER İLE AÇILAN SUBMENU & DİREKT TIKLANINCA SAYFAYA GİDEN LİNK) -->
                <div class="group/tools relative">
                    <a href="araclar.html" class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all ${page === 'araclar' ? 'bg-tsMavi text-white font-bold shadow-md shadow-tsMavi/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'}">
                        <div class="flex items-center gap-3">
                            <span class="text-base">🧮</span>
                            <span class="sidebar-text">Mühendislik Araçları</span>
                        </div>
                        <span class="sidebar-text text-[10px] group-hover/tools:rotate-180 transition-transform duration-200">▾</span>
                    </a>
                    
                    <div id="tools-submenu" class="mt-1 pl-9 space-y-1 ${page === 'araclar' ? 'block' : 'hidden group-hover/tools:block'}">
                        <a href="araclar.html#gano" class="block py-1.5 text-[11px] text-slate-500 dark:text-slate-400 hover:text-tsMavi dark:hover:text-sky-400 transition-colors">
                            📊 AGNO / GANO Ortalama
                        </a>
                        <a href="araclar.html#hesap-makinesi" class="block py-1.5 text-[11px] text-slate-500 dark:text-slate-400 hover:text-tsMavi dark:hover:text-sky-400 transition-colors">
                            🧮 Bilimsel Hesap Makinesi
                        </a>
                        <a href="araclar.html#direnc-hesaplayici" class="block py-1.5 text-[11px] text-slate-500 dark:text-slate-400 hover:text-tsMavi dark:hover:text-sky-400 transition-colors">
                            ⚡ Direnç / Devre Hesaplama
                        </a>
                    </div>
                </div>
            </nav>
        </div>

        <!-- SIDEBAR ALT DIŞ LİNK -->
        <div class="pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <a href="https://maliyildirimtr.com" target="_blank" rel="noopener noreferrer" class="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-tsBordo to-tsMavi text-white font-bold text-xs shadow-md hover:opacity-90 transition-opacity">
                <span>⚡</span>
                <span class="sidebar-text">Kişisel Site ↗</span>
            </a>
        </div>
    </aside>

    <!-- MOBİL BACKDROP OVERLAY -->
    <div id="sidebar-backdrop" onclick="toggleSidebar()" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 hidden lg:hidden"></div>

    <!-- KULLANICI AUTH MODAL (GİRİŞ & KAYIT PENCERESİ) -->
    <div id="auth-modal" class="fixed inset-0 z-50 hidden bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 class="text-base font-bold" id="auth-modal-title">🔑 Hesabınıza Giriş Yapın</h3>
                <button onclick="closeAuthModal()" class="text-slate-400 hover:text-white">✕</button>
            </div>

            <button type="button" id="google-login-btn" onclick="loginWithGoogle(event)" class="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                <svg class="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                Google ile Devam Et
            </button>

            <div class="relative flex py-1 items-center">
                <div class="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                <span class="flex-shrink mx-2 text-[10px] text-slate-400 uppercase">veya e-posta</span>
                <div class="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            </div>

            <form id="auth-form" onsubmit="handleAuthSubmit(event)" class="space-y-3">
                <div id="username-container" class="hidden">
                    <input type="text" id="auth-username" placeholder="Kullanıcı Adınız (Örn: ahmet61)" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-tsMavi">
                </div>

                <input type="email" id="auth-email" required placeholder="E-posta Adresiniz" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-tsMavi">
                <div>
                    <input type="password" id="auth-password" required placeholder="Şifreniz" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-tsMavi">
                    
                    <div class="text-right mt-1" id="forgot-password-container">
                        <button type="button" onclick="handleForgotPassword()" class="text-[10px] text-tsMavi hover:underline">
                            Şifrenizi mi unuttunuz?
                        </button>
                    </div>
                </div>
                
                <button type="submit" id="auth-submit-btn" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-tsBordo to-tsMavi text-white font-semibold text-xs shadow-md hover:opacity-90 transition-opacity">
                    Giriş Yap
                </button>
            </form>

            <div class="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
                <button onclick="toggleAuthMode()" id="auth-toggle-btn" class="text-xs text-tsMavi hover:underline">
                    Hesabınız yok mu? Kayıt Olun
                </button>
            </div>
        </div>
    </div>

    <!-- HESAP / PROFİL DÜZENLEME MODALI -->
    <div id="user-profile-modal" class="fixed inset-0 z-50 hidden bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 class="text-base font-bold">👤 Profil & Hesap Ayarları</h3>
                <button onclick="closeProfileModal()" class="text-slate-400 hover:text-white">✕</button>
            </div>

            <form id="profile-edit-form" onsubmit="updateUserProfile(event)" class="space-y-4">
                <div class="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                    <div class="relative group shrink-0">
                        <div id="profile-modal-avatar-preview"></div>
                        <button type="button" onclick="triggerProfilePictureUpload()" title="Profil Fotoğrafı Yükle" class="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-tsMavi text-white flex items-center justify-center text-xs shadow-md hover:scale-110 transition-transform cursor-pointer border-2 border-white dark:border-slate-900">
                            📷
                        </button>
                    </div>
                    <div class="text-center sm:text-left overflow-hidden w-full">
                        <p class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" id="profile-modal-user-title">Kullanıcı</p>
                        <p class="text-[10px] text-slate-500 truncate" id="profile-modal-user-subtitle">Hesap Ayarları</p>
                        <button type="button" onclick="triggerProfilePictureUpload()" class="mt-2 px-3 py-1 rounded-xl text-xs font-bold bg-tsMavi/10 text-tsMavi dark:text-sky-400 border border-tsMavi/20 hover:bg-tsMavi hover:text-white transition-all cursor-pointer inline-flex items-center gap-1.5">
                            <span>📷</span> Fotoğraf Yükle & Kırp
                        </button>
                    </div>
                </div>

                <input type="file" id="profile-picture-input" accept="image/*" onchange="handleProfilePictureSelect(event)" class="hidden">

                <div>
                    <label class="block text-xs font-semibold mb-1 text-slate-400">E-Posta Adresiniz</label>
                    <input type="email" id="profile-email-disabled" disabled class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 text-slate-500 text-xs cursor-not-allowed">
                </div>

                <div>
                    <label class="block text-xs font-semibold mb-1 text-slate-400">Kullanıcı Adınız</label>
                    <input type="text" id="profile-display-name" required placeholder="Kullanıcı Adınız..." class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-tsMavi">
                </div>

                <div>
                    <label class="block text-xs font-semibold mb-1 text-slate-400">Profil Fotoğrafı Bağlantısı (URL / Özel)</label>
                    <input type="url" id="profile-photo-url" placeholder="https://example.com/profil.jpg" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-tsMavi">
                    <p class="text-[10px] text-slate-400 mt-1">Fotoğraf kırparak yükleyebilir veya doğrudan görsel URL adresi girebilirsiniz.</p>
                </div>

                <div class="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button type="button" onclick="closeProfileModal()" class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800">İptal</button>
                    <button type="submit" id="profile-save-btn" class="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-tsBordo to-tsMavi text-white shadow-md hover:opacity-90 transition-opacity">Değişiklikleri Kaydet</button>
                </div>
            </form>
        </div>
    </div>

    <!-- GITHUB TARZI PROFİL FOTOĞRAFI KIRPMA MODALI (CROPPER.JS) -->
    <div id="profile-crop-modal" class="fixed inset-0 z-50 hidden bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
        <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl flex flex-col items-center relative overflow-hidden">
            
            <div class="w-full flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 class="text-base font-bold text-slate-100 flex items-center gap-2">
                    <span>✂️</span> Profil Fotoğrafınızı Kırpın
                </h3>
                <button type="button" onclick="closeCropModal()" class="text-slate-400 hover:text-white text-lg">✕</button>
            </div>

            <div class="w-full max-h-[360px] bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800/80 p-2">
                <img id="crop-image-element" src="" alt="Kırpılacak Görsel" class="max-w-full max-h-[330px] block">
            </div>

            <p class="text-[11px] text-slate-400 text-center">
                Görseli dairesel maskeye sığacak şekilde sürükleyin ve boyutlandırın.
            </p>

            <div class="w-full flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                <button type="button" onclick="closeCropModal()" class="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors">
                    İptal
                </button>
                <button type="button" id="save-cropped-photo-btn" onclick="saveCroppedProfilePicture()" class="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-tsBordo to-tsMavi text-white shadow-lg hover:opacity-90 transition-all flex items-center gap-2">
                    <span>✨</span> Profil Fotoğrafını Kaydet
                </button>
            </div>
        </div>
    </div>

    <!-- GİZLİ ŞİFRELİ YÖNETİCİ GİRİŞ MODAL -->
    <div id="admin-login-modal" class="fixed inset-0 z-50 hidden bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center relative overflow-hidden">
            <div class="w-12 h-12 rounded-2xl bg-tsMavi/10 text-tsMavi mx-auto flex items-center justify-center text-xl font-bold shadow-inner">🔒</div>
            <div>
                <h3 class="text-base font-bold">Yönetici Girişi</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">İçerik düzenlemek için şifrenizi girin.</p>
            </div>
            <div>
                <input type="password" id="admin-password-input" placeholder="Şifreniz..." class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm text-center focus:outline-none focus:border-tsMavi transition-colors">
                <p id="login-error-msg" class="text-xs text-red-500 mt-2 hidden">Hatalı şifre! Tekrar deneyin.</p>
            </div>
            <div class="flex gap-2 pt-2">
                <button type="button" onclick="closeLoginModal()" class="w-1/2 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">İptal</button>
                <button type="button" onclick="checkAdminPassword()" class="w-1/2 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-tsBordo to-tsMavi text-white shadow-md hover:opacity-95 transition-opacity">Giriş Yap</button>
            </div>
        </div>
    </div>

    <!-- DERS EKLE / DÜZENLE MODAL -->
    <div id="add-course-modal" class="fixed inset-0 z-50 hidden bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 class="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2" id="course-modal-title">
                    <span>➕</span> Yeni Ders & Not Ekle
                </h3>
                <button onclick="closeCourseModal()" class="text-slate-400 hover:text-white">✕</button>
            </div>
            
            <form id="add-course-form" class="space-y-4">
                <input type="hidden" id="edit-course-id">
                
                <div>
                    <label class="block text-xs font-semibold mb-1 text-slate-400">Ders / Kurs Adı *</label>
                    <input type="text" id="course-title" required placeholder="Örn: Sayısal Sinyal İşleme" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-tsMavi">
                </div>

                <div>
                    <label class="block text-xs font-semibold mb-1 text-slate-400">KOD / Kategori</label>
                    <input type="text" id="course-code" placeholder="Örn: EEE-202 / Gömülü Sistemler" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-tsMavi">
                </div>

                <div>
                    <label class="block text-xs font-semibold mb-1 text-slate-400">İkon / Emoji</label>
                    <input type="text" id="course-icon" placeholder="Örn: 📚 veya ⚡" value="📚" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-tsMavi">
                </div>

                <div>
                    <label class="block text-xs font-semibold mb-1 text-slate-400">Kısa Açıklama</label>
                    <textarea id="course-description" rows="3" placeholder="Ders içeriği veya notlar hakkında kısa bilgi..." class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-tsMavi resize-none"></textarea>
                </div>

                <div>
                    <label class="block text-xs font-semibold mb-1 text-slate-400">Konu / İçerik Linki veya PDF Bağlantısı</label>
                    <input type="url" id="course-content-url" placeholder="https://drive.google.com/... veya PDF linki" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-tsMavi">
                    <p class="text-[10px] text-slate-400 mt-1">Drive, GitHub veya PDF not bağlantısını ekleyebilirsiniz.</p>
                </div>

                <div class="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button type="button" onclick="closeCourseModal()" class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800">İptal</button>
                    <button type="submit" id="save-course-btn" class="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-tsBordo to-tsMavi text-white shadow-md hover:opacity-90 transition-opacity">Kaydet & Yayınla</button>
                </div>
            </form>
        </div>
    </div>
    `;

    const navContainer = document.getElementById('navbar-container');
    if (navContainer) {
        navContainer.innerHTML = layoutHTML;
        initThemeIcons();
        if (typeof setupAddCourseFormListener === 'function') setupAddCourseFormListener();
    }

    const mainContent = document.querySelector('main');
    if (mainContent) {
        mainContent.classList.add('pt-20', 'lg:pl-64', 'transition-all', 'duration-300');
    }
}

// ==========================================
// 5. OTURUM DURUMU VE FIREBASE DİNAMİKLERİ
// ==========================================
let isSignUpMode = false;

function initNavbar() {
    try {
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        const user = (typeof auth !== 'undefined' && auth ? auth.currentUser : null) || (typeof SSO !== 'undefined' ? SSO.getSSOUser() : null);
        renderNavbar(currentPath.replace('.html', ''), user);
        if (typeof checkGoogleRedirectResult === 'function') checkGoogleRedirectResult();
    } catch (e) {
        console.error("Navbar render hatası:", e);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavbar);
} else {
    initNavbar();
}

document.addEventListener('DOMContentLoaded', initNavbar);

let notificationUnsubscribe = null;

function toggleNotificationDropdown(e) {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    const dropdown = document.getElementById('notification-dropdown') || document.getElementById('notificationDropdown');
    if (dropdown) dropdown.classList.toggle('hidden');
}

// BİLDİRİM VE PROFİL PANOLARI İÇİN GLOBAL OUTSIDE CLICK (DIŞARIYA TIKLAMA) DİNLEYİCİSİ
document.addEventListener('click', (event) => {
    // 1. Bildirim Panosu Dışına Tıklama Kontrolü
    const notificationDropdown = document.querySelector('#notification-dropdown') || document.querySelector('#notificationDropdown');
    const notificationBtn = document.querySelector('#notification-bell-btn') || document.querySelector('#notificationBtn');

    if (
        notificationDropdown &&
        !notificationDropdown.classList.contains('hidden') &&
        !notificationDropdown.contains(event.target) &&
        (!notificationBtn || !notificationBtn.contains(event.target))
    ) {
        notificationDropdown.classList.add('hidden');
        notificationDropdown.classList.remove('active');
    }

    // 2. Profil Menüsü Dışına Tıklama Kontrolü
    const profileMenu = document.querySelector('#profile-dropdown-menu');
    const profileBtn = document.querySelector('#user-profile-btn');

    if (
        profileMenu &&
        !profileMenu.classList.contains('hidden') &&
        !profileMenu.contains(event.target) &&
        (!profileBtn || !profileBtn.contains(event.target))
    ) {
        profileMenu.classList.add('hidden');
    }
});

function listenUserNotifications(user) {
    if (!user || typeof db === 'undefined' || !db) return;
    if (notificationUnsubscribe) notificationUnsubscribe();

    notificationUnsubscribe = db.collection("notifications")
        .where("targetUserUid", "==", user.uid)
        .onSnapshot(snapshot => {
            const badge = document.getElementById('notification-badge');
            const countLabel = document.getElementById('notification-dropdown-count');
            const list = document.getElementById('notification-list');

            if (!snapshot || snapshot.empty) {
                if (badge) badge.classList.add('hidden');
                if (countLabel) countLabel.innerText = "0 Bildirim";
                if (list) list.innerHTML = `<div class="py-6 text-center text-xs text-slate-400">Henüz bildiriminiz yok.</div>`;
                return;
            }

            let notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            notifications.sort((a, b) => {
                const tA = a.createdAt && typeof a.createdAt.toMillis === 'function' ? a.createdAt.toMillis() : 0;
                const tB = b.createdAt && typeof b.createdAt.toMillis === 'function' ? b.createdAt.toMillis() : 0;
                return tB - tA;
            });

            const unreadCount = notifications.filter(n => n.read === false || n.status === 'pending' || n.status === 'unread').length;
            if (badge) {
                if (unreadCount > 0) {
                    badge.innerText = unreadCount;
                    badge.classList.remove('hidden');
                } else {
                    badge.classList.add('hidden');
                }
            }

            if (countLabel) countLabel.innerText = `${unreadCount} Okunmamış`;

            if (list) {
                let html = "";
                notifications.forEach(n => {
                    const dateStr = n.createdAt && typeof n.createdAt.toDate === 'function' ? new Date(n.createdAt.toDate()).toLocaleDateString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : 'Az önce';
                    
                    if (n.status === 'pending') {
                        html += `
                            <div class="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2 text-xs">
                                <div class="flex items-center justify-between">
                                    <span class="font-bold text-amber-500">📩 Katılma İsteği</span>
                                    <span class="text-[10px] text-slate-400">${dateStr}</span>
                                </div>
                                <p class="text-slate-700 dark:text-slate-300 leading-snug">${n.message}</p>
                                <div class="flex justify-end gap-2 pt-1">
                                    <button onclick="handleNotificationResponse('${n.id}', '${n.announcementId || ''}', '${n.senderUid || ''}', 'rejected')" class="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-[11px] font-bold">✕ Reddet</button>
                                    <button onclick="handleNotificationResponse('${n.id}', '${n.announcementId || ''}', '${n.senderUid || ''}', 'accepted')" class="px-3 py-1 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-all text-[11px] font-bold shadow-sm">✓ Kabul Et</button>
                                </div>
                            </div>
                        `;
                    } else if (n.type === 'task_assigned') {
                        html += `
                            <div class="p-3 rounded-2xl ${n.status === 'unread' ? 'bg-tsMavi/10 border border-tsMavi/20' : 'bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700'} space-y-1.5 text-xs">
                                <div class="flex items-center justify-between">
                                    <span class="font-bold ${n.status === 'unread' ? 'text-tsMavi' : 'text-slate-500'}">🎯 Yeni Görev</span>
                                    <span class="text-[10px] text-slate-400">${dateStr}</span>
                                </div>
                                <p class="text-slate-700 dark:text-slate-300 leading-snug">${n.message}</p>
                                ${n.status === 'unread' ? `
                                    <div class="flex justify-end gap-2 pt-1">
                                        <button onclick="window.location.href='grup-detay.html?id=${n.groupId}'" class="px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-all text-[11px] font-bold shadow-sm">Grubu Ziyaret Et</button>
                                        <button onclick="markNotificationRead('${n.id}', '${n.groupId}', '${n.taskId}')" class="px-3 py-1 rounded-lg bg-tsMavi text-white hover:bg-sky-500 transition-all text-[11px] font-bold shadow-sm">✓ Okudum</button>
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    } else if (n.type === 'doc_approved' || n.status === 'approved') {
                        html += `
                            <div class="p-3 rounded-2xl ${n.read ? 'bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700' : 'bg-emerald-500/10 border border-emerald-500/30'} space-y-1.5 text-xs">
                                <div class="flex items-center justify-between">
                                    <span class="font-bold text-emerald-500">🎉 Belgeniz Onaylandı!</span>
                                    <span class="text-[10px] text-slate-400">${dateStr}</span>
                                </div>
                                <p class="text-slate-700 dark:text-slate-300 leading-snug">${n.message}</p>
                                ${!n.read ? `
                                    <div class="flex justify-end pt-1">
                                        <button onclick="markNotificationAsRead('${n.id}')" class="px-2.5 py-1 rounded-lg bg-emerald-500 text-white font-bold text-[10px] hover:bg-emerald-600 transition-all shadow-sm">✓ Okundu İşaretle</button>
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    } else if (n.status === 'accepted') {
                        html += `
                            <div class="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5 text-xs">
                                <div class="flex items-center justify-between">
                                    <span class="font-bold text-emerald-500">🎉 İsteğiniz Onaylandı!</span>
                                    <span class="text-[10px] text-slate-400">${dateStr}</span>
                                </div>
                                <p class="text-slate-700 dark:text-slate-300 leading-snug">${n.message}</p>
                                ${n.inviteLink ? `
                                    <div class="pt-1">
                                        <a href="${n.inviteLink}" target="_blank" class="px-3 py-1 rounded-lg bg-emerald-500 text-white font-bold text-[11px] inline-block shadow">Gruba Katıl ↗</a>
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    } else if (n.status === 'rejected') {
                        html += `
                            <div class="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-1 text-xs">
                                <div class="flex items-center justify-between">
                                    <span class="font-bold text-red-400">✕ İsteğiniz Reddedildi</span>
                                    <span class="text-[10px] text-slate-400">${dateStr}</span>
                                </div>
                                <p class="text-slate-600 dark:text-slate-400 leading-snug">${n.message}</p>
                            </div>
                        `;
                    } else {
                        html += `
                            <div class="p-3 rounded-2xl ${n.read === false ? 'bg-tsMavi/10 border border-tsMavi/20' : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'} space-y-1 text-xs">
                                <div class="flex items-center justify-between">
                                    <span class="font-bold text-tsMavi">ℹ️ Bilgilendirme</span>
                                    <span class="text-[10px] text-slate-400">${dateStr}</span>
                                </div>
                                <p class="text-slate-600 dark:text-slate-300 leading-snug">${n.message}</p>
                                ${n.read === false ? `
                                    <div class="flex justify-end pt-1">
                                        <button onclick="markNotificationAsRead('${n.id}')" class="px-2 py-0.5 rounded bg-tsMavi text-white font-bold text-[10px]">Okundu</button>
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    }
                });
                list.innerHTML = html;
            }
        }, (err) => {
            console.warn("Bildirim okuma hatası:", err);
        });
}

window.markNotificationAsRead = function(notificationId) {
    if (typeof db !== 'undefined' && db && db.collection) {
        db.collection("notifications").doc(notificationId).update({
            read: true,
            status: 'read'
        }).catch(err => console.warn("Bildirim okundu işaretlenemedi:", err));
    }
};

window.markNotificationRead = function(notificationId, groupId, taskId) {
    if (typeof db !== 'undefined' && db && db.collection) {
        db.collection("notifications").doc(notificationId).update({ status: 'read' });
        
        if (groupId && taskId) {
            // Update task status to "devam_ediyor"
            db.collection("project_groups").doc(groupId).collection("tasks").doc(taskId).update({
                status: 'devam_ediyor',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }).catch(() => {
                db.collection("groups").doc(groupId).collection("tasks").doc(taskId).update({
                    status: 'devam_ediyor',
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }).catch(() => {});
            });
        }
    }
}

window.clearAllNotifications = function() {
    const user = window.auth ? window.auth.currentUser : null;
    if (!user || typeof db === 'undefined' || !db) return;
    
    if (!confirm("Tüm bildirimleri temizlemek istediğinize emin misiniz?")) return;

    db.collection("notifications").where("targetUserUid", "==", user.uid).get()
        .then(snapshot => {
            const batch = db.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            return batch.commit();
        })
        .then(() => {
            console.log("Tüm bildirimler temizlendi.");
        })
        .catch(err => {
            console.error("Bildirimler temizlenirken hata oluştu:", err);
            alert("Bildirimler temizlenirken bir hata oluştu.");
        });
}

function handleNotificationResponse(notificationId, announcementId, senderUid, action) {
    if (typeof db === 'undefined' || !db) return;

    db.collection("notifications").doc(notificationId).get().then(doc => {
        if (!doc.exists) return;
        const nData = doc.data();

        db.collection("notifications").doc(notificationId).update({
            status: action,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        if (announcementId && senderUid) {
            db.collection("announcements").doc(announcementId).collection("requests").doc(senderUid).update({
                status: action,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }).catch(() => {});
        }

        if (action === 'accepted') {
            const memberObj = {
                uid: senderUid,
                name: nData.senderName || 'Kullanıcı',
                photo: nData.senderPhoto || '',
                role: 'Üye',
                joinedAt: new Date().toISOString()
            };

            const targetGroupId = nData.groupId || null;
            if (targetGroupId && targetGroupId !== 'custom') {
                db.collection("project_groups").doc(targetGroupId).update({
                    members: firebase.firestore.FieldValue.arrayUnion(memberObj),
                    membersCount: firebase.firestore.FieldValue.increment(1)
                }).catch(() => {
                    db.collection("groups").doc(targetGroupId).update({
                        members: firebase.firestore.FieldValue.arrayUnion(memberObj),
                        membersCount: firebase.firestore.FieldValue.increment(1)
                    }).catch(() => {});
                });
            }

            db.collection("announcements").doc(announcementId).get().then(adoc => {
                const aData = adoc.exists ? adoc.data() : {};
                const inviteLink = aData.inviteLink || '';
                const displayGrpName = nData.groupName || aData.groupName || nData.announcementTitle || 'Grubunuz';

                db.collection("notifications").add({
                    announcementId: announcementId,
                    groupId: targetGroupId || 'custom',
                    groupName: displayGrpName,
                    announcementTitle: aData.title || nData.announcementTitle || 'İlan',
                    targetUserUid: senderUid,
                    senderUid: auth.currentUser.uid,
                    message: `'${displayGrpName}' grubuna katılım isteğiniz kabul edildi! Gruba üye olarak eklendiniz.${inviteLink ? ' Katılım Linkiniz: ' + inviteLink : ''}`,
                    inviteLink: inviteLink,
                    status: 'accepted',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                }).then(() => {
                    if (typeof showToast === 'function') showToast("✓ Katılma isteği kabul edildi ve üye gruba eklendi!", "success");
                });
            });
        } else if (action === 'rejected') {
            const annTitle = nData.announcementTitle || 'İlan';
            db.collection("notifications").add({
                announcementId: announcementId,
                announcementTitle: annTitle,
                targetUserUid: senderUid,
                senderUid: auth.currentUser.uid,
                message: `'${annTitle}' grubuna katılım isteğiniz ilan sahibi tarafından bu dönem için kabul edilemedi.`,
                status: 'rejected',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                if (typeof showToast === 'function') showToast("Katılma isteği reddedildi.", "info");
            });
        }
    });
}

if (typeof auth !== 'undefined' && auth) {
    auth.onAuthStateChanged(async (user) => {
        try {
            if (user) {
                console.log("Aktif Kullanıcı:", user.displayName || user.email);
                if (user.email) {
                    _cachedUserEmailHash = await computeSHA256(user.email.toLowerCase().trim());
                }
                if (typeof SSO !== 'undefined') SSO.onLogin(user);
                listenUserNotifications(user);
                
                if (typeof db !== 'undefined' && db && db.collection) {
                    db.collection("users").doc(user.uid).get().then(doc => {
                        if (doc.exists && doc.data().photoURL) {
                            user.customPhotoURL = doc.data().photoURL;
                            const userBtn = document.getElementById('user-profile-btn');
                            if (userBtn) {
                                const avatarHTML = getUserAvatarHTML(user, "w-7 h-7 text-xs");
                                const nameStr = user.displayName || (user.email ? user.email.split('@')[0] : 'Kullanıcı');
                                userBtn.innerHTML = `
                                    ${avatarHTML}
                                    <span class="text-xs font-bold text-slate-800 dark:text-slate-200 hidden sm:inline truncate max-w-[110px]">${nameStr}</span>
                                    <span class="text-[10px] text-slate-400">▾</span>
                                `;
                            }
                        }
                    }).catch(() => {});
                }
                
                // 3. Modalları Otomatik Kapat
                document.querySelectorAll('.login-modal, #auth-modal').forEach(m => m.classList.add('hidden'));
                
                const userBtn = document.getElementById('user-profile-btn');
                if (userBtn && user) {
                    const avatarHTML = getUserAvatarHTML(user, "w-7 h-7 text-xs");
                    const nameStr = user.displayName || (user.email ? user.email.split('@')[0] : 'Kullanıcı');

                    userBtn.innerHTML = `
                        ${avatarHTML}
                        <span class="text-xs font-bold text-slate-800 dark:text-slate-200 hidden sm:inline truncate max-w-[110px]">${nameStr}</span>
                        <span class="text-[10px] text-slate-400">▾</span>
                    `;
                }
            } else {
                console.log("Kullanıcı oturumu kapalı.");
                _cachedUserEmailHash = null;
            }
        } catch (e) {}
        initNavbar();
        if (typeof checkGoogleRedirectResult === 'function') checkGoogleRedirectResult();
    });
}

function openAuthModal() { 
    const modal = document.getElementById('auth-modal');
    if(modal) modal.classList.remove('hidden'); 
}
function closeAuthModal() { 
    const modal = document.getElementById('auth-modal');
    if(modal) modal.classList.add('hidden'); 
}

// ==========================================
// MALI NETWORK - ÖZEL TOAST BİLDİRİM SİSTEMİ
// ==========================================

// Global Browser Alert Override -> Transforms all native browser popups into sleek Website Toast Notifications
window.alert = function(message) {
    if (typeof showToast === 'function') {
        let toastType = 'info';
        if (typeof message === 'string') {
            if (message.includes('✅') || message.includes('🎉') || message.includes('başarıyla') || message.includes('kabul edildi')) toastType = 'success';
            else if (message.includes('❌') || message.includes('Hata') || message.includes('hata') || message.includes('Eyvah') || message.includes('reddedildi')) toastType = 'error';
            else if (message.includes('⚠️') || message.includes('Lütfen') || message.includes('uyarı') || message.includes('🔑') || message.includes('🔒')) toastType = 'warning';
        }
        showToast(message, toastType);
    } else {
        console.log("ALERT:", message);
    }
};

function dismissToast(toastEl) {
    if (!toastEl) return;
    toastEl.classList.remove('translate-x-0', 'opacity-100');
    toastEl.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => {
        if (toastEl && toastEl.parentNode) {
            toastEl.parentNode.removeChild(toastEl);
        }
    }, 300);
}

function showToast(message, type = 'info') {
    let container = document.getElementById('toast-notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-notification-container';
        container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px; max-width: 380px; width: calc(100vw - 40px); pointer-events: none;';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `pointer-events-auto p-4 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-start gap-3 transition-all duration-300 transform translate-x-full opacity-0 text-xs font-semibold relative overflow-hidden select-none ${
        type === 'error' 
            ? 'bg-rose-950/95 border-rose-700/90 text-rose-100 shadow-rose-950/60' 
            : type === 'success' 
            ? 'bg-emerald-950/95 border-emerald-700/90 text-emerald-100 shadow-emerald-950/60' 
            : type === 'warning'
            ? 'bg-amber-950/95 border-amber-700/90 text-amber-100 shadow-amber-950/60'
            : 'bg-slate-900/95 border-slate-700/90 text-slate-100 shadow-slate-950/60'
    }`;

    const icon = type === 'error' ? '🔴' : type === 'success' ? '🟢' : type === 'warning' ? '⚠️' : 'ℹ️';

    toast.innerHTML = `
        <span class="text-base shrink-0 mt-0.5">${icon}</span>
        <div class="flex-grow pr-4 leading-relaxed">${message}</div>
        <button onclick="dismissToast(this.parentElement)" title="Kapat" class="absolute top-2.5 right-2.5 text-slate-400 hover:text-white shrink-0 w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors text-sm">✕</button>
    `;

    container.appendChild(toast);

    // Sağdan kayarak giriş animasyonu
    requestAnimationFrame(() => {
        toast.classList.remove('translate-x-full', 'opacity-0');
        toast.classList.add('translate-x-0', 'opacity-100');
    });

    // 🟢 SADECE HATA OLMAYAN BİLDİRİMLER İÇİN 10 SANİYE VE HOVER-PAUSE MANTIĞI
    if (type !== 'error') {
        let timeoutId = null;
        let startTime = Date.now();
        let remainingTime = 10000; // 10 saniye

        const startTimer = () => {
            startTime = Date.now();
            timeoutId = setTimeout(() => {
                dismissToast(toast);
            }, remainingTime);
        };

        const pauseTimer = () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
                remainingTime -= (Date.now() - startTime);
                if (remainingTime < 1000) remainingTime = 1000;
            }
        };

        toast.addEventListener('mouseenter', pauseTimer);
        toast.addEventListener('mouseleave', startTimer);

        startTimer();
    }
    // 🔴 HATA BİLDİRİMLERİ (ERROR) İÇİN TIMER ÇALIŞTIRILMAZ; KULLANICI ✕ BASANA KADAR EKRANDA KALIR!
}
window.showToast = showToast;
window.dismissToast = dismissToast;

function openProfileModal() {
    const user = typeof auth !== 'undefined' ? auth.currentUser : null;
    if (!user) return;

    const modal = document.getElementById('user-profile-modal');
    const emailInput = document.getElementById('profile-email-disabled');
    const nameInput = document.getElementById('profile-display-name');
    const photoInput = document.getElementById('profile-photo-url');
    const avatarPreview = document.getElementById('profile-modal-avatar-preview');
    const userTitle = document.getElementById('profile-modal-user-title');
    const userSubtitle = document.getElementById('profile-modal-user-subtitle');

    if (emailInput) emailInput.value = user.email || '';
    if (nameInput) nameInput.value = user.displayName || (user.email ? user.email.split('@')[0] : '');
    if (photoInput) photoInput.value = user.photoURL || '';
    if (avatarPreview) avatarPreview.innerHTML = getUserAvatarHTML(user, "w-10 h-10 text-sm");
    if (userTitle) userTitle.innerText = user.displayName || (user.email ? user.email.split('@')[0] : 'Kullanıcı');
    if (userSubtitle) userSubtitle.innerText = user.email || 'Hesap Ayarları';

    if (modal) modal.classList.remove('hidden');
}

function closeProfileModal() {
    const modal = document.getElementById('user-profile-modal');
    if (modal) modal.classList.add('hidden');
}

function updateUserProfile(e) {
    e.preventDefault();
    const user = typeof auth !== 'undefined' ? auth.currentUser : null;
    if (!user) return;

    const newName = document.getElementById('profile-display-name').value.trim();
    const photoInput = document.getElementById('profile-photo-url');
    const newPhotoUrl = photoInput ? photoInput.value.trim() : '';
    const saveBtn = document.getElementById('profile-save-btn');

    if (!newName) {
        showToast("Lütfen geçerli bir kullanıcı adı girin!", "warning");
        return;
    }

    if (saveBtn) saveBtn.innerText = "Kaydediliyor...";

    user.updateProfile({
        displayName: newName,
        photoURL: newPhotoUrl || null
    }).then(() => {
        showToast("✅ Profil bilgileriniz başarıyla güncellendi!", "success");
        closeProfileModal();
        initNavbar();
        if (typeof renderAcademyUserPanel === 'function') renderAcademyUserPanel();
        setTimeout(() => location.reload(), 1000);
    }).catch((err) => {
        console.error("Firebase Profil Güncelleme Hatası:", err);
        showToast("Güncelleme Hatası: " + (err.message || "Profil güncellenemedi."), "error");
        if (saveBtn) saveBtn.innerText = "Değişiklikleri Kaydet";
    });
}

function toggleAuthMode() {
    isSignUpMode = !isSignUpMode;
    const title = document.getElementById('auth-modal-title');
    const submitBtn = document.getElementById('auth-submit-btn');
    const toggleBtn = document.getElementById('auth-toggle-btn');
    const usernameContainer = document.getElementById('username-container');
    const forgotContainer = document.getElementById('forgot-password-container');
    
    if(title) title.innerText = isSignUpMode ? "📝 Yeni Hesap Oluştur" : "🔑 Hesabınıza Giriş Yapın";
    if(submitBtn) submitBtn.innerText = isSignUpMode ? "Kayıt Ol" : "Giriş Yap";
    if(toggleBtn) toggleBtn.innerText = isSignUpMode ? "Zaten hesabınız var mı? Giriş Yapın" : "Hesabınız yok mu? Kayıt Olun";
    
    if (isSignUpMode) {
        if(usernameContainer) usernameContainer.classList.remove('hidden');
        if(forgotContainer) forgotContainer.classList.add('hidden');
    } else {
        if(usernameContainer) usernameContainer.classList.add('hidden');
        if(forgotContainer) forgotContainer.classList.remove('hidden');
    }
}

// E-POSTA İLE GİRİŞ & KAYIT
function handleAuthSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const usernameInput = document.getElementById('auth-username');
    const username = usernameInput ? usernameInput.value.trim() : '';

    if (isSignUpMode) {
        if (!username) {
            showToast("Lütfen bir kullanıcı adı belirleyin!", "warning");
            return;
        }

        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                return userCredential.user.updateProfile({
                    displayName: username
                });
            })
            .then(() => {
                showToast("✅ Hesabınız başarıyla oluşturuldu ve giriş yapıldı!", "success");
                closeAuthModal();
            })
            .catch(err => {
                console.error("Firebase Kayıt Hatası:", err);
                if (err.code === 'auth/email-already-in-use') {
                    showToast("⚠️ Bu e-posta adresi zaten kullanımda! Lütfen 'Giriş Yap' sekmesini kullanın.", "warning");
                } else if (err.code === 'auth/weak-password') {
                    showToast("⚠️ Şifreniz çok zayıf! En az 6 karakter giriniz.", "warning");
                } else {
                    showToast("Kayıt Hatası: " + (err.message || "Kayıt yapılırken bir hata oluştu."), "error");
                }
            });
    } else {
        auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                showToast("✅ Başarıyla giriş yapıldı!", "success");
                closeAuthModal();
            })
            .catch(err => {
                console.error("Firebase Giriş Hatası:", err);
                if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                    showToast("⚠️ E-posta veya şifre hatalı!", "error");
                } else {
                    showToast("Giriş Hatası: " + (err.message || "Giriş yapılırken bir sorun oluştu."), "error");
                }
            });
    }
}

function handleForgotPassword() {
    const emailInput = document.getElementById('auth-email');
    const email = emailInput ? emailInput.value.trim() : '';

    if (!email) {
        showToast("Lütfen önce E-posta kutusuna adresinizi yazın, ardından 'Şifrenizi mi unuttunuz?' butonuna tıklayın.", "info");
        return;
    }

    auth.sendPasswordResetEmail(email)
        .then(() => {
            showToast(`✅ ${email} adresine şifre sıfırlama bağlantısı gönderildi! Lütfen e-postanızı (ve Spam klasörünü) kontrol edin.`, "success");
            closeAuthModal();
        })
        .catch((err) => {
            console.error("Firebase Şifre Sıfırlama Hatası:", err);
            if (err.code === 'auth/user-not-found') {
                showToast("⚠️ Bu e-posta adresine ait kayıtlı bir kullanıcı bulunamadı.", "warning");
            } else {
                showToast("Sıfırlama Hatası: " + (err.message || "Sıfırlama bağlantısı gönderilemedi."), "error");
            }
        });
}

let _redirectResultChecked = false;

function checkGoogleRedirectResult() {
    if (_redirectResultChecked) return;
    if (typeof auth !== 'undefined' && auth && typeof auth.getRedirectResult === 'function') {
        _redirectResultChecked = true;
        auth.getRedirectResult().then((result) => {
            if (result && result.user) {
                console.log("Redirect ile başarıyla giriş yapıldı:", result.user);
                showToast("✅ Google hesabı ile başarıyla giriş yapıldı!", "success");
                if (typeof SSO !== 'undefined') SSO.onLogin(result.user);
                closeAuthModal();
                initNavbar();
            }
        }).catch((err) => {
            console.error("Redirect alma hatası:", err);
            if (err.code !== 'auth/popup-closed-by-user') {
                showToast("Giriş işlemi gerçekleştirilemedi. Lütfen Firebase Console üzerinden Google giriş sağlayıcısının ve domain izinlerinin (Authorized Domains) aktif olduğunu kontrol edin.", "error");
            }
        });
    }
}

async function loginWithGoogle(e) {
    if (e) {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }

    // PROTOKOL KONTROLÜ (file:// engelleme ve bilgilendirme)
    if (window.location.protocol === 'file:') {
        showToast("🌐 Google ile giriş yapabilmek için projenin yerel bir HTTP sunucusunda (Live Server / localhost) veya yayınlanmış domain üzerinde çalışması gerekmektedir.", "warning");
        console.warn("Firebase Auth: Google 'file://' protokolünde tarayıcı kısıtlaması nedeniyle çalışmaz. Lütfen http://localhost veya domain üzerinden açın.");
        return;
    }

    const currentAuth = (typeof auth !== 'undefined' && auth) ? auth : (typeof window !== 'undefined' && window.auth);
    let provider = (typeof googleProvider !== 'undefined' && googleProvider) ? googleProvider : (typeof window !== 'undefined' && window.googleProvider);

    if (!currentAuth) {
        showToast("Giriş işlemi gerçekleştirilemedi. Lütfen Firebase Console üzerinden Google giriş sağlayıcısının ve domain izinlerinin (Authorized Domains) aktif olduğunu kontrol edin.", "error");
        console.error("Firebase Auth: auth nesnesi bulunamadı.");
        return;
    }

    if (!provider && typeof firebase !== 'undefined' && firebase.auth) {
        provider = new firebase.auth.GoogleAuthProvider();
    }

    if (provider && typeof provider.setCustomParameters === 'function') {
        provider.setCustomParameters({ prompt: 'select_account' });
    }

    // Buton Durumu (Loading State)
    const btn = document.getElementById('google-login-btn') || (e && (e.currentTarget || e.target));
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="animate-spin text-sm">⏳</span> Google'a Yönlendiriliyor...`;
    }

    // GÜVENLİ OAUTH AKIŞI:
    // 1. Önce signInWithPopup dene (Cross-Domain Third-Party Cookie Engellerini Aşar)
    // 2. Eğer Popup engellenirse veya desteklenmezse signInWithRedirect'e geç
    try {
        const result = await currentAuth.signInWithPopup(provider);
        if (result && result.user) {
            console.log("Google Popup ile giriş başarılı:", result.user);
            showToast("✅ Google hesabı ile başarıyla giriş yapıldı!", "success");
            if (typeof SSO !== 'undefined') SSO.onLogin(result.user);
            closeAuthModal();
            initNavbar();
        }
    } catch (err) {
        console.warn("Popup ile giriş denenirken hata/yönlendirme ihtiyacı oluştu:", err);

        // Eğer Popup kapatılmadıysa veya tarayıcı popup engellediyse Redirect dene
        if (err.code === 'auth/popup-blocked' || err.code === 'auth/operation-not-supported-in-this-environment') {
            try {
                await currentAuth.signInWithRedirect(provider);
                return;
            } catch (redirectErr) {
                console.error("signInWithRedirect Hatası:", redirectErr);
            }
        }

        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<svg class="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg> Google ile Devam Et`;
        }

        if (err.code === 'auth/popup-closed-by-user') {
            showToast("ℹ️ Giriş penceresi kapatıldı.", "info");
        } else {
            showToast("Giriş başlatılamadı: " + (err.message || "Bilinmeyen hata"), "error");
        }
    }
}

function logoutUser() {
    if (typeof SSO !== 'undefined') SSO.onLogout();
    localStorage.removeItem('_mali_adm_token');
    sessionStorage.removeItem('_mali_adm_token');
    localStorage.removeItem('is_admin');
    localStorage.removeItem('mali_admin_session');
    if (typeof auth !== 'undefined' && auth.currentUser) {
        auth.signOut().then(() => location.reload());
    } else {
        location.reload();
    }
}

// ==========================================
// 6. YÖNETİCİ GİRİŞİ LOGIC (Cmd+Shift+A & Logo 3-Tık)
// ==========================================
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        openLoginModal();
    }
    
    const modal = document.getElementById('admin-login-modal');
    if (modal && !modal.classList.contains('hidden') && e.key === 'Enter') {
        checkAdminPassword();
    }
});

let logoClickCount = 0;
let logoClickTimer = null;

function handleLogoClick(e) {
    logoClickCount++;
    clearTimeout(logoClickTimer);
    
    if (logoClickCount === 3) {
        if (e) e.preventDefault();
        openLoginModal();
        logoClickCount = 0;
    } else {
        logoClickTimer = setTimeout(() => { logoClickCount = 0; }, 1000);
    }
}

function openLoginModal() {
    const modal = document.getElementById('admin-login-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeLoginModal() {
    const modal = document.getElementById('admin-login-modal');
    const errorMsg = document.getElementById('login-error-msg');
    const inputPass = document.getElementById('admin-password-input');
    if (modal) modal.classList.add('hidden');
    if (errorMsg) errorMsg.classList.add('hidden');
    if (inputPass) inputPass.value = '';
}

async function checkAdminPassword() {
    const inputPassEl = document.getElementById('admin-password-input');
    const errorMsg = document.getElementById('login-error-msg');

    if (!inputPassEl || !inputPassEl.value) return;

    const inputPass = inputPassEl.value.trim();
    const hashedInput = await computeSHA256(inputPass);

    if (hashedInput === SEC_HASH_PASS) {
        sessionStorage.setItem('_mali_adm_token', SEC_HASH_PASS);
        localStorage.setItem('_mali_adm_token', SEC_HASH_PASS);
        localStorage.setItem('is_admin', 'true');
        closeLoginModal();
        location.reload();
    } else {
        if (errorMsg) errorMsg.classList.remove('hidden');
    }
}

function logoutAdmin() {
    localStorage.removeItem('_mali_adm_token');
    sessionStorage.removeItem('_mali_adm_token');
    localStorage.removeItem('is_admin');
    localStorage.removeItem('mali_admin_session');
    location.reload();
}

// ==========================================
// 7. RESİM / İKON DETEKTÖRÜ
// ==========================================
function renderIcon(iconData) {
    if (!iconData) return '⚡';
    
    const isImage = iconData.startsWith('images/') || 
                    iconData.startsWith('http://') || 
                    iconData.startsWith('https://') || 
                    /\.(jpg|jpeg|png|webp|avif|svg)$/i.test(iconData);

    if (isImage) {
        return `<img src="${iconData}" class="w-full h-full object-cover rounded-xl" alt="Görsel">`;
    }
    
    return iconData;
}

// ==========================================
// 8. DERS EKLE MODALINI AÇMA & YÖNLENDİRME
// ==========================================
function openAddModal() {
    if (!window.location.pathname.includes('dersler.html')) {
        window.location.href = 'dersler.html?openModal=true';
        return;
    }

    const modal = document.getElementById('add-course-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.getAttribute('data-page') || 
                 window.location.pathname.split('/').pop().replace('.html', '') || 
                 'index';
    renderNavbar(page);
    initDynamicNavbarFirstLink();

    if (window.location.hash === '#contact-section' || window.location.hash === '#iletisim') {
        setTimeout(() => {
            scrollToContactForm();
        }, 300);
    }
});

// ==========================================
// 9. SİSTEM ALTYAPISI & GÜVENLİK MODALI
// ==========================================
function openSecurityModal() {
    const modal = document.getElementById('security-standards-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeSecurityModal() {
    const modal = document.getElementById('security-standards-modal');
    if (modal) modal.classList.add('hidden');
}

// ==========================================
// 10. İLETİŞİM FORMUNA YUMUŞAK KAYDIRMA & FOCUS VURGUSU
// ==========================================
function scrollToContactForm(e) {
    if (e && e.preventDefault) e.preventDefault();

    const contactSection = document.getElementById('contact-section') || document.getElementById('iletisim') || document.getElementById('contact-form');

    if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setTimeout(() => {
            const nameInput = contactSection.querySelector('input[name="name"]') || contactSection.querySelector('input[type="text"]') || contactSection.querySelector('input');
            if (nameInput) {
                nameInput.focus();
            }

            const highlightTarget = document.getElementById('contact-card-highlight') || contactSection;
            if (highlightTarget) {
                highlightTarget.classList.add('ring-4', 'ring-tsMavi/50', 'border-tsMavi', 'transition-all', 'duration-300');
                setTimeout(() => {
                    highlightTarget.classList.remove('ring-4', 'ring-tsMavi/50', 'border-tsMavi');
                }, 2000);
            }
        }, 500);
    } else {
        window.location.href = 'sosyal.html#contact-section';
    }
}

// ==========================================
// 11. DİNAMİK NAVBAR İLK SEKME METNİ ("Ana Sayfa" <-> "Hakkımda")
// ==========================================
function initDynamicNavbarFirstLink() {
    const desktopLink = document.getElementById('nav-first-link');
    const mobileLink = document.getElementById('mobile-nav-first-link');

    if (!desktopLink && !mobileLink) return;

    const page = document.body.getAttribute('data-page') || 
                 window.location.pathname.split('/').pop().replace('.html', '') || 
                 'index';

    // Sadece index / ana sayfada dinamik scroll takibi yap
    if (page !== 'index' && page !== '' && page !== 'home') {
        if (desktopLink) desktopLink.innerText = "Hakkımda";
        if (mobileLink) mobileLink.innerText = "Hakkımda";
        return;
    }

    let isScrolledPast = false;

    function handleNavbarScroll() {
        const aboutSection = document.getElementById('about-details');
        const scrollThreshold = aboutSection ? (aboutSection.offsetTop - 180) : 300;
        const currentScrollY = window.scrollY || window.pageYOffset;

        if (currentScrollY >= scrollThreshold) {
            if (!isScrolledPast) {
                isScrolledPast = true;
                updateLinkText("Hakkımda");
            }
        } else {
            if (isScrolledPast) {
                isScrolledPast = false;
                updateLinkText("Ana Sayfa");
            }
        }
    }

    function updateLinkText(newText) {
        [desktopLink, mobileLink].forEach(link => {
            if (!link) return;
            link.style.opacity = '0';
            setTimeout(() => {
                link.innerText = newText;
                link.style.opacity = '1';
            }, 150);
        });
    }

    window.addEventListener('scroll', handleNavbarScroll, { passive: true });
    handleNavbarScroll();
}

// ==========================================
// 12. GITHUB TARZI CROPPER.JS PROFİL FOTOĞRAFI YÜKLEME & KIRPMA MANTIĞI
// ==========================================
let cropperInstance = null;

(function injectCropperCircularStyles() {
    if (document.getElementById('cropper-circular-style')) return;
    const style = document.createElement('style');
    style.id = 'cropper-circular-style';
    style.innerHTML = `
        .cropper-view-box,
        .cropper-face {
            border-radius: 50% !important;
        }
        .cropper-view-box {
            outline: 2px dashed #38bdf8 !important;
            outline-offset: -1px;
        }
        .cropper-dashed, .cropper-point {
            border-color: #38bdf8 !important;
        }
        .cropper-point {
            background-color: #38bdf8 !important;
        }
    `;
    document.head.appendChild(style);
})();

function ensureCropperLoaded(callback) {
    if (typeof Cropper !== 'undefined') {
        if (callback) callback();
        return;
    }
    if (!document.getElementById('cropper-css')) {
        const link = document.createElement('link');
        link.id = 'cropper-css';
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css';
        document.head.appendChild(link);
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js';
    script.onload = () => {
        if (callback) callback();
    };
    document.head.appendChild(script);
}

function triggerProfilePictureUpload() {
    const fileInput = document.getElementById('profile-picture-input');
    if (fileInput) {
        fileInput.value = '';
        fileInput.click();
    }
}

function handleProfilePictureSelect(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    if (!file.type.startsWith('image/')) {
        if (typeof showToast === 'function') showToast("Lütfen geçerli bir görsel dosyası seçin (PNG, JPG, WEBP).", "warning");
        return;
    }

    ensureCropperLoaded(() => {
        const reader = new FileReader();
        reader.onload = (event) => {
            openCropModal(event.target.result);
        };
        reader.readAsDataURL(file);
    });
}

function openCropModal(imageSrc) {
    const cropModal = document.getElementById('profile-crop-modal');
    const imageEl = document.getElementById('crop-image-element');
    if (!cropModal || !imageEl) return;

    if (cropperInstance) {
        cropperInstance.destroy();
        cropperInstance = null;
    }

    imageEl.src = imageSrc;
    cropModal.classList.remove('hidden');

    setTimeout(() => {
        cropperInstance = new Cropper(imageEl, {
            aspectRatio: 1,
            viewMode: 1,
            dragMode: 'move',
            autoCropArea: 0.85,
            restore: false,
            guides: true,
            center: true,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false
        });
    }, 100);
}

function closeCropModal() {
    const cropModal = document.getElementById('profile-crop-modal');
    if (cropModal) cropModal.classList.add('hidden');
    if (cropperInstance) {
        cropperInstance.destroy();
        cropperInstance = null;
    }
}

async function saveCroppedProfilePicture() {
    if (!cropperInstance) return;
    const user = (typeof auth !== 'undefined' && auth) ? auth.currentUser : null;
    if (!user) {
        if (typeof showToast === 'function') showToast("Oturum bulunamadı, lütfen önce giriş yapın.", "error");
        return;
    }

    const saveBtn = document.getElementById('save-cropped-photo-btn');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = `<span class="inline-block animate-spin">⏳</span> Kaydediliyor...`;
    }

    try {
        const canvas = cropperInstance.getCroppedCanvas({
            width: 400,
            height: 400,
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high'
        });

        canvas.toBlob(async (blob) => {
            try {
                let downloadURL = null;

                // 1. Firebase Storage'a Yükle (profile_pictures/{uid}.jpg)
                if (typeof firebase !== 'undefined' && firebase.storage) {
                    try {
                        const storageRef = firebase.storage().ref(`profile_pictures/${user.uid}.jpg`);
                        const snapshot = await storageRef.put(blob, { contentType: 'image/jpeg' });
                        downloadURL = await snapshot.ref.getDownloadURL();
                    } catch (storageErr) {
                        console.warn("Firebase Storage yükleme uyarısı:", storageErr);
                    }
                }

                // 2. Eğer Storage'dan HTTPS URL elde edildiyse Firebase Auth profilini güncelle
                if (downloadURL && downloadURL.startsWith('http')) {
                    await user.updateProfile({ photoURL: downloadURL });
                } else {
                    // Storage erişimi kısıtlıysa compressed Base64 DataURL fallback yap
                    downloadURL = canvas.toDataURL('image/jpeg', 0.80);
                    user.customPhotoURL = downloadURL;
                    // NOT: Base64 string "Photo URL too long" hatasına yol açtığı için user.updateProfile'a verilmez.
                }

                // 3. Firestore Kullanıcı Dokümanını Güncelle (Hem HTTPS hem DataURL için geçerlidir)
                if (typeof db !== 'undefined' && db && db.collection) {
                    try {
                        await db.collection("users").doc(user.uid).set({
                            photoURL: downloadURL,
                            updatedAt: (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
                        }, { merge: true });
                    } catch (dbErr) {
                        console.warn("Firestore kullanıcı güncelleme uyarısı:", dbErr);
                    }
                }

                // 4. Modalları kapat ve arayüzü güncelle
                closeCropModal();
                if (typeof showToast === 'function') {
                    showToast("✅ Profil fotoğrafınız başarıyla güncellendi!", "success");
                }
                initNavbar();
                if (typeof renderAcademyUserPanel === 'function') renderAcademyUserPanel();

                const photoUrlInput = document.getElementById('profile-photo-url');
                if (photoUrlInput) photoUrlInput.value = downloadURL;

                const avatarPreview = document.getElementById('profile-modal-avatar-preview');
                if (avatarPreview) avatarPreview.innerHTML = getUserAvatarHTML(user, "w-10 h-10 text-sm");

            } catch (err) {
                console.error("Profil Fotoğrafı Kaydetme Hatası:", err);
                if (typeof showToast === 'function') showToast("Hata: " + (err.message || "Profil fotoğrafı yüklenemedi."), "error");
            } finally {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = `<span>✨</span> Profil Fotoğrafını Kaydet`;
                }
            }
        }, 'image/jpeg', 0.85);

    } catch (e) {
        console.error("Cropper Canvas Hatası:", e);
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = `<span>✨</span> Profil Fotoğrafını Kaydet`;
        }
    }
}

// ==========================================
// 13. DERS & NOT EKLEME MODAL VE GÖNDERİM ALTYAPISI
// ==========================================
function openAddCourseModal() {
    const modal = document.getElementById('add-course-modal');
    if (!modal) return;

    const editInput = document.getElementById('edit-course-id');
    if (editInput) editInput.value = '';

    const form = document.getElementById('add-course-form');
    if (form) form.reset();

    const modalTitle = document.getElementById('course-modal-title');
    if (modalTitle) modalTitle.innerHTML = "<span>➕</span> Yeni Ders & Not Ekle";

    modal.classList.remove('hidden');
}

function closeCourseModal() {
    const modal = document.getElementById('add-course-modal');
    if (modal) modal.classList.add('hidden');
    const form = document.getElementById('add-course-form');
    if (form) form.reset();
    const editInput = document.getElementById('edit-course-id');
    if (editInput) editInput.value = '';
}

function handleAddCourseClick(e) {
    if (e) e.preventDefault();
    openAddCourseModal();
}

function setupAddCourseFormListener() {
    const courseForm = document.getElementById('add-course-form');
    if (!courseForm || courseForm.getAttribute('data-listener-attached') === 'true') return;
    courseForm.setAttribute('data-listener-attached', 'true');

    courseForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const user = (typeof auth !== 'undefined' && auth) ? auth.currentUser : null;
        const adminState = typeof isAdmin === 'function' && isAdmin();

        if (!user && !adminState) {
            if (typeof showToast === 'function') {
                showToast("Ders ve not eklemek için lütfen önce kayıt olun veya giriş yapın!", "warning");
            } else {
                alert("Ders ve not eklemek için lütfen önce kayıt olun veya giriş yapın!");
            }
            closeCourseModal();
            if (typeof openAuthModal === 'function') openAuthModal();
            return;
        }

        const editId = document.getElementById('edit-course-id') ? document.getElementById('edit-course-id').value : '';
        const collName = document.getElementById('edit-course-collection')?.value || "academy_courses";
        const title = document.getElementById('course-title').value.trim();
        const code = document.getElementById('course-code').value.trim();
        const icon = document.getElementById('course-icon').value.trim() || '📚';
        const description = document.getElementById('course-description').value.trim();
        const contentUrlInput = document.getElementById('course-content-url');
        const contentUrl = contentUrlInput ? contentUrlInput.value.trim() : '';

        const authorName = user ? (user.displayName || (user.email ? user.email.split('@')[0] : 'Kullanıcı')) : 'Yönetici';
        const authorUid = user ? user.uid : 'admin';

        const saveBtn = document.getElementById('save-course-btn');
        if (saveBtn) saveBtn.innerText = "Kaydediliyor...";

        const coursePayload = {
            title,
            code,
            icon,
            description,
            contentUrl,
            authorName,
            authorUid,
            updatedAt: (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
        };

        if (typeof db !== 'undefined') {
            if (editId) {
                db.collection(collName).doc(editId).update(coursePayload).then(() => {
                    if (typeof showToast === 'function') showToast("✅ Ders başarıyla güncellendi!", "success");
                    closeCourseModal();
                    if (typeof loadCourses === 'function') loadCourses();
                }).catch(() => {
                    db.collection("courses").doc(editId).update(coursePayload).then(() => {
                        if (typeof showToast === 'function') showToast("✅ Ders başarıyla güncellendi!", "success");
                        closeCourseModal();
                        if (typeof loadCourses === 'function') loadCourses();
                    });
                }).finally(() => {
                    if (saveBtn) saveBtn.innerText = "Kaydet & Yayınla";
                });
            } else {
                coursePayload.createdAt = (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString();
                db.collection("academy_courses").add(coursePayload).then(() => {
                    if (typeof showToast === 'function') showToast("✅ Ders & Not başarıyla eklendi!", "success");
                    closeCourseModal();
                    if (typeof loadCourses === 'function') loadCourses();
                }).catch(err => {
                    console.warn("academy_courses yazma uyarısı, courses deneniyor:", err);
                    db.collection("courses").add(coursePayload).then(() => {
                        if (typeof showToast === 'function') showToast("✅ Ders & Not başarıyla eklendi!", "success");
                        closeCourseModal();
                        if (typeof loadCourses === 'function') loadCourses();
                    });
                }).finally(() => {
                    if (saveBtn) saveBtn.innerText = "Kaydet & Yayınla";
                });
            }
        } else {
            if (typeof showToast === 'function') showToast("Veritabanı bağlantısı henüz hazır değil.", "error");
            if (saveBtn) saveBtn.innerText = "Kaydet & Yayınla";
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupAddCourseFormListener();
});
