// ==========================================
// MALI ACADEMY — PROFİL SAYFASI MOTORU (profil.js) v2
// File Upload + Dinamik Sosyal Bağlantı Sistemi
// ==========================================

let _profileUid = null;
let _profileData = null;
let _isSelfProfile = false;
let _activeTab = 'exams';

// Seçilen dosyalar (File nesneleri)
let _selectedAvatarFile = null;
let _selectedBannerFile = null;

// --- HELPERS ---
function formatJoinDate(ts) {
    if (!ts) return '';
    let d = null;
    if (typeof ts.toDate === 'function') d = ts.toDate();
    else if (ts.seconds) d = new Date(ts.seconds * 1000);
    else if (typeof ts === 'number') d = new Date(ts);
    if (!d) return '';
    return d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name[0].toUpperCase();
}

function buildAvatarHtml(photoURL, displayName) {
    if (photoURL) {
        return `<img src="${photoURL}" alt="${displayName}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"><div class="w-full h-full hidden items-center justify-center bg-gradient-to-br from-tsBordo to-tsMavi text-white font-black text-2xl">${getInitials(displayName)}</div>`;
    }
    return `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-tsBordo to-tsMavi text-white font-black text-2xl">${getInitials(displayName)}</div>`;
}

function getRoleBadge(role, isAdminFlag) {
    if (isAdminFlag || role === 'admin') return `<span class="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">Yönetici</span>`;
    if (role === 'instructor') return `<span class="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold">Eğitmen</span>`;
    return `<span class="px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-bold">Öğrenci</span>`;
}

// --- SOSYAL İKON ALGILAMA ---
function getSocialIconHtml(url) {
    const u = (url || '').toLowerCase();
    if (u.includes('github.com')) return {
        bg: 'bg-slate-700',
        icon: `<svg class="w-4 h-4 text-slate-200" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>`
    };
    if (u.includes('linkedin.com')) return {
        bg: 'bg-sky-800/60',
        icon: `<svg class="w-4 h-4 text-sky-400" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`
    };
    if (u.includes('twitter.com') || u.includes('x.com')) return {
        bg: 'bg-slate-800',
        icon: `<svg class="w-4 h-4 text-slate-200" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`
    };
    if (u.includes('instagram.com')) return {
        bg: 'bg-pink-900/60',
        icon: `<svg class="w-4 h-4 text-pink-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`
    };
    if (u.includes('youtube.com')) return {
        bg: 'bg-red-900/60',
        icon: `<svg class="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`
    };
    // Genel / Globe
    return {
        bg: 'bg-emerald-900/50',
        icon: `<svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`
    };
}

// --- HERO RENDER ---
function renderProfileHero(data) {
    const bannerEl = document.getElementById('profile-banner-bg');
    const avatarEl = document.getElementById('profile-avatar-inner');
    const nameEl = document.getElementById('profile-display-name');
    const handleEl = document.getElementById('profile-handle');
    const joinEl = document.getElementById('profile-join-date');
    const bioEl = document.getElementById('profile-bio');
    const badgeContEl = document.getElementById('profile-role-badge');
    const socialEl = document.getElementById('profile-social-links');
    const statsEl = document.getElementById('profile-stats');
    const editBtnEl = document.getElementById('profile-edit-btn');
    const onlineDot = document.getElementById('profile-online-dot');

    if (bannerEl && data.bannerURL) {
        bannerEl.style.backgroundImage = `url('${data.bannerURL}')`;
        bannerEl.style.backgroundSize = 'cover';
        bannerEl.style.backgroundPosition = 'center';
    }

    if (avatarEl) avatarEl.innerHTML = buildAvatarHtml(data.photoURL, data.displayName);
    if (nameEl) nameEl.textContent = data.displayName || 'Kullanıcı';
    if (handleEl) handleEl.textContent = '@' + (data.username || data.handle || (data.email ? data.email.split('@')[0] : 'kullanici'));
    if (joinEl) joinEl.textContent = data.joinedAt ? `Katılım: ${formatJoinDate(data.joinedAt)}` : '';
    if (bioEl) bioEl.textContent = data.bio || 'Henüz biyografi eklenmemiş.';
    if (badgeContEl) badgeContEl.innerHTML = getRoleBadge(data.role, data.isAdmin);
    if (onlineDot) onlineDot.classList.remove('hidden');

    // Sosyal linkler (socialLinks array formatı veya eski github/linkedin/website alanları)
    if (socialEl) {
        const links = data.socialLinks || [];
        // Geriye dönük uyumluluk: eski format
        const legacyLinks = [];
        if (!links.length) {
            if (data.github) legacyLinks.push(data.github);
            if (data.linkedin) legacyLinks.push(data.linkedin);
            if (data.website) legacyLinks.push(data.website);
        }
        const allLinks = links.length ? links : legacyLinks;

        if (allLinks.length) {
            socialEl.innerHTML = allLinks.map(url => {
                const { bg, icon } = getSocialIconHtml(url);
                return `<a href="${url}" target="_blank" rel="noopener" class="p-2 rounded-xl ${bg} hover:opacity-80 border border-slate-700 transition-all">${icon}</a>`;
            }).join('');
        } else {
            socialEl.innerHTML = `<span class="text-xs text-slate-500">Sosyal bağlantı eklenmemiş</span>`;
        }
    }

    // Stats
    if (statsEl) {
        const uploadCount = data.uploadCount || 0;
        const groupCount = data.groupCount || 0;
        statsEl.innerHTML = `
            <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700">
                <svg class="w-3.5 h-3.5 text-tsMavi" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span id="profile-stat-upload" class="text-xs font-bold text-slate-200">${uploadCount}</span>
                <span class="text-[10px] text-slate-400">Yükleme</span>
            </div>
            <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700">
                <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <span id="profile-stat-group" class="text-xs font-bold text-slate-200">${groupCount}</span>
                <span class="text-[10px] text-slate-400">Grup</span>
            </div>
        `;
    }

    if (editBtnEl) {
        if (_isSelfProfile) editBtnEl.classList.remove('hidden');
        else editBtnEl.classList.add('hidden');
    }
}

// --- TABS ---
window.switchProfileTab = function(tab) {
    _activeTab = tab;
    document.querySelectorAll('.profile-tab-btn').forEach(btn => {
        const isActive = btn.dataset.tab === tab;
        btn.classList.toggle('active-tab', isActive);
        
        // Active styles
        btn.classList.toggle('bg-[#38bdf8]', isActive);
        btn.classList.toggle('text-white', isActive);
        btn.classList.toggle('shadow-md', isActive);
        
        // Inactive styles
        if (btn.dataset.tab !== 'pending') {
            btn.classList.toggle('bg-slate-200/50', !isActive);
            btn.classList.toggle('dark:bg-white/5', !isActive);
            btn.classList.toggle('hover:bg-slate-300/50', !isActive);
            btn.classList.toggle('dark:hover:bg-white/10', !isActive);
            btn.classList.toggle('text-slate-400', !isActive);
            btn.classList.toggle('hover:text-slate-200', !isActive);
        } else {
            // Pending inactive styles
            btn.classList.toggle('bg-amber-500/10', !isActive);
            btn.classList.toggle('hover:bg-amber-500/20', !isActive);
            btn.classList.toggle('text-amber-500', !isActive);
            btn.classList.toggle('hover:text-amber-400', !isActive);
        }
    });
    loadTabContent(tab);
};

async function loadTabContent(tab) {
    const grid = document.getElementById('profile-content-grid');
    if (!grid) return;
    grid.innerHTML = `<div class="col-span-full flex justify-center py-12"><div class="w-8 h-8 border-4 border-[#38bdf8] border-t-transparent rounded-full animate-spin"></div></div>`;

    const targetDb = (typeof db !== 'undefined' && db) ? db : window.db;
    if (!targetDb || !_profileUid) {
        grid.innerHTML = `<div class="col-span-full text-center py-10 text-xs text-slate-400">Veri yüklenemedi.</div>`;
        return;
    }

    try {
        let items = [];
        
        // 1. Fetch counts in parallel and populate badges
        const counts = { exams: 0, openSource: 0, groups: 0, ads: 0, pending: 0, all: 0 };
        const pExams = targetDb.collection('exam_prep_resources').where('uid', '==', _profileUid).where('status', '==', 'approved').get();
        const pKits = targetDb.collection('open_source_resources').where('uid', '==', _profileUid).where('status', '==', 'approved').get();
        const pGroups = targetDb.collection('groups').where('memberUids', 'array-contains', _profileUid).get();
        const pAds = targetDb.collection('ads').where('uid', '==', _profileUid).where('status', '==', 'approved').get();
        
        let pendingExams, pendingKits;
        if (_isSelfProfile) {
            pendingExams = targetDb.collection('exam_prep_resources').where('uid', '==', _profileUid).where('status', '==', 'pending').get();
            pendingKits = targetDb.collection('open_source_resources').where('uid', '==', _profileUid).where('status', '==', 'pending').get();
        }

        const responses = await Promise.all([pExams, pKits, pGroups, pAds, pendingExams, pendingKits]);
        
        const snaps = {
            exams: responses[0],
            openSource: responses[1],
            groups: responses[2],
            ads: responses[3],
            pendingE: responses[4],
            pendingK: responses[5]
        };
        
        counts.exams = snaps.exams.size;
        counts.openSource = snaps.openSource.size;
        counts.groups = snaps.groups.size;
        counts.ads = snaps.ads.size;
        
        if (_isSelfProfile && snaps.pendingE && snaps.pendingK) {
            counts.pending = snaps.pendingE.size + snaps.pendingK.size;
        }
        
        counts.all = counts.exams + counts.openSource + counts.groups + counts.ads;
        
        // Update badges
        const updateBadge = (id, count) => {
            const el = document.getElementById(id);
            if (el) el.textContent = count;
        };
        updateBadge('badge-all', counts.all);
        updateBadge('badge-exams', counts.exams);
        updateBadge('badge-openSource', counts.openSource);
        updateBadge('badge-groups', counts.groups);
        updateBadge('badge-ads', counts.ads);
        updateBadge('badge-pending', counts.pending);

        // Update hero stats dynamically
        updateBadge('profile-stat-upload', counts.all - counts.groups);
        updateBadge('profile-stat-group', counts.groups);

        // 2. Populate items array based on selected tab
        if (tab === 'all') {
            snaps.exams.forEach(doc => items.push({ id: doc.id, ...doc.data(), _type: 'exam' }));
            snaps.openSource.forEach(doc => items.push({ id: doc.id, ...doc.data(), _type: 'kit' }));
            snaps.groups.forEach(doc => items.push({ id: doc.id, ...doc.data(), _type: 'group' }));
            snaps.ads.forEach(doc => items.push({ id: doc.id, ...doc.data(), _type: 'ad' }));
            items.sort((a, b) => {
                const ta = a.createdAt ? (a.createdAt.toMillis ? a.createdAt.toMillis() : a.createdAt) : 0;
                const tb = b.createdAt ? (b.createdAt.toMillis ? b.createdAt.toMillis() : b.createdAt) : 0;
                return tb - ta;
            });
        } else if (tab === 'exams') {
            snaps.exams.forEach(doc => items.push({ id: doc.id, ...doc.data(), _type: 'exam' }));
        } else if (tab === 'openSource') {
            snaps.openSource.forEach(doc => items.push({ id: doc.id, ...doc.data(), _type: 'kit' }));
        } else if (tab === 'groups') {
            snaps.groups.forEach(doc => items.push({ id: doc.id, ...doc.data(), _type: 'group' }));
        } else if (tab === 'ads') {
            snaps.ads.forEach(doc => items.push({ id: doc.id, ...doc.data(), _type: 'ad' }));
        } else if (tab === 'pending' && _isSelfProfile) {
            if (snaps.pendingE) snaps.pendingE.forEach(doc => items.push({ id: doc.id, ...doc.data(), _type: 'exam', _pending: true }));
            if (snaps.pendingK) snaps.pendingK.forEach(doc => items.push({ id: doc.id, ...doc.data(), _type: 'kit', _pending: true }));
        }

        if (items.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full py-16 text-center space-y-3">
                    <div class="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto">
                        <svg class="w-7 h-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
                    </div>
                    <p class="text-sm font-semibold text-slate-600 dark:text-slate-400">Bu kategoride henüz içerik yok.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = items.map(item => renderProfileCard(item)).join('');
    } catch (e) {
        console.error('Profil sekme yükleme hatası:', e);
        grid.innerHTML = `<div class="col-span-full text-center py-10 text-xs text-rose-400">Veri yüklenirken hata oluştu.</div>`;
    }
}

function renderProfileCard(item) {
    const isPending = item._pending || false;
    const borderStyle = isPending ? 'border-amber-500/50 bg-amber-500/5' : 'border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111b21]';
    const stripStyle = isPending ? 'bg-gradient-to-b from-amber-500 to-amber-600' : 'bg-gradient-to-b from-tsBordo to-tsMavi';

    let title = '', subtitle = '', description = '', url = '#', badge = '';

    if (item._type === 'exam') {
        title = item.title || 'Sınav Belgesi';
        subtitle = item.documentType || item.category || 'Belge';
        description = item.description || '';
        url = `sinav-hazirlik.html`;
        badge = isPending
            ? `<span class="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">🟡 Onay Bekliyor</span>`
            : `<span class="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">Sınav Belgesi</span>`;
    } else if (item._type === 'kit') {
        title = item.title || 'Açık Kaynak Kit';
        subtitle = item.sourceType || item.category || 'Proje';
        description = item.description || '';
        url = `acik-kaynak.html`;
        badge = isPending
            ? `<span class="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">🟡 Onay Bekliyor</span>`
            : `<span class="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold">Açık Kaynak</span>`;
    } else if (item._type === 'group') {
        title = item.name || 'Proje Grubu';
        subtitle = item.category || 'Takım';
        description = item.description || '';
        url = `grup-detay.html?id=${item.id}`;
        badge = `<span class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">Proje Grubu</span>`;
    } else if (item._type === 'ad') {
        title = item.title || 'İlan';
        subtitle = item.category || 'İlan';
        description = item.description || '';
        url = `ilan-panosu.html`;
        badge = `<span class="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-bold">İlan</span>`;
    }

    return `
        <a href="${url}" class="group relative overflow-hidden rounded-2xl border ${borderStyle} shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col p-5 space-y-3">
            <div class="absolute top-0 left-0 w-1.5 h-full ${stripStyle} opacity-80 group-hover:opacity-100 transition-opacity"></div>
            <div class="pl-2 space-y-2">
                ${badge}
                <h3 class="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-tsMavi transition-colors">${title}</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">${description}</p>
                <span class="text-[10px] font-mono text-slate-400">${subtitle}</span>
            </div>
            <div class="pl-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-tsMavi group-hover:text-sky-400 transition-colors">
                <span>İncele</span>
                <span class="group-hover:translate-x-1 transition-transform">→</span>
            </div>
        </a>
    `;
}

// ======================================================
// DOSYA YÜKLEME: ANLIK ÖNİZLEME
// ======================================================
window.handleAvatarFileSelect = function(input) {
    const file = input.files[0];
    if (!file) return;
    _selectedAvatarFile = file;

    const img = document.getElementById('avatar-preview-img');
    const placeholder = document.getElementById('avatar-upload-placeholder');
    const overlay = document.getElementById('avatar-change-overlay');

    const url = URL.createObjectURL(file);
    if (img) { img.src = url; img.classList.remove('hidden'); }
    if (placeholder) placeholder.classList.add('hidden');
    if (overlay) overlay.classList.remove('hidden');
};

window.handleBannerFileSelect = function(input) {
    const file = input.files[0];
    if (!file) return;
    _selectedBannerFile = file;

    const img = document.getElementById('banner-preview-img');
    const placeholder = document.getElementById('banner-upload-placeholder');
    const overlay = document.getElementById('banner-change-overlay');

    const url = URL.createObjectURL(file);
    if (img) { img.src = url; img.classList.remove('hidden'); }
    if (placeholder) placeholder.classList.add('hidden');
    if (overlay) overlay.classList.remove('hidden');
};

// ======================================================
// FIREBASE STORAGE YÜKLEME YARDIMCISI
// ======================================================
async function uploadFileToStorage(file, storagePath, progressLabel) {
    const targetStorage = (typeof storage !== 'undefined' && storage) ? storage : window.storage;
    if (!targetStorage || !file) return null;

    const progressWrap = document.getElementById('upload-progress-wrap');
    const progressBar = document.getElementById('upload-progress-bar');
    const progressPct = document.getElementById('upload-progress-pct');
    const progressLabelEl = document.getElementById('upload-progress-label');

    if (progressWrap) progressWrap.classList.remove('hidden');
    if (progressLabelEl) progressLabelEl.textContent = progressLabel || 'Yükleniyor...';

    return new Promise((resolve, reject) => {
        const storageRef = targetStorage.ref(storagePath);
        const uploadTask = storageRef.put(file, { contentType: file.type });

        uploadTask.on('state_changed',
            (snapshot) => {
                const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                if (progressBar) progressBar.style.width = pct + '%';
                if (progressPct) progressPct.textContent = pct + '%';
            },
            (error) => {
                console.error('Storage yükleme hatası:', error);
                reject(error);
            },
            async () => {
                try {
                    const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                    if (progressBar) progressBar.style.width = '100%';
                    resolve(downloadURL);
                } catch (e) {
                    reject(e);
                }
            }
        );
    });
}

// ======================================================
// DİNAMİK SOSYAL BAĞLANTILAR
// ======================================================
let _socialLinkCounter = 0;

function updateSocialEmptyState() {
    const container = document.getElementById('social-links-container');
    const emptyMsg = document.getElementById('social-links-empty');
    if (!container || !emptyMsg) return;
    emptyMsg.classList.toggle('hidden', container.children.length > 0);
}

window.addSocialLinkRow = function(existingUrl = '') {
    const container = document.getElementById('social-links-container');
    if (!container) return;

    const rowId = 'social-row-' + (++_socialLinkCounter);
    const { bg, icon } = getSocialIconHtml(existingUrl);

    const row = document.createElement('div');
    row.id = rowId;
    row.className = 'flex items-center gap-2 group animate-in';
    row.style.animation = 'slideInRow 0.2s ease';
    row.innerHTML = `
        <div id="${rowId}-icon" class="w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0 transition-all duration-200">
            ${icon}
        </div>
        <input
            type="url"
            value="${existingUrl}"
            placeholder="https://github.com, linkedin.com, vb..."
            class="flex-1 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-tsMavi transition-colors placeholder-slate-400"
            oninput="updateSocialRowIcon('${rowId}', this.value)"
        >
        <button
            type="button"
            onclick="removeSocialLinkRow('${rowId}')"
            class="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all shrink-0"
            title="Kaldır"
        >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </button>
    `;
    container.appendChild(row);
    updateSocialEmptyState();

    // Input'a odaklan
    const inp = row.querySelector('input');
    if (inp && !existingUrl) inp.focus();
};

window.updateSocialRowIcon = function(rowId, url) {
    const iconContainer = document.getElementById(rowId + '-icon');
    if (!iconContainer) return;
    const { bg, icon } = getSocialIconHtml(url);
    // bg class'larını güncelle
    iconContainer.className = `w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0 transition-all duration-200`;
    iconContainer.innerHTML = icon;
};

window.removeSocialLinkRow = function(rowId) {
    const row = document.getElementById(rowId);
    if (!row) return;
    row.style.opacity = '0';
    row.style.transform = 'translateX(-8px)';
    row.style.transition = 'all 0.15s ease';
    setTimeout(() => { row.remove(); updateSocialEmptyState(); }, 150);
};

function getSocialLinksFromForm() {
    const container = document.getElementById('social-links-container');
    if (!container) return [];
    const inputs = container.querySelectorAll('input[type="url"]');
    const links = [];
    inputs.forEach(inp => {
        const val = inp.value.trim();
        if (val) links.push(val);
    });
    return links;
}

function populateSocialLinksInForm(links) {
    const container = document.getElementById('social-links-container');
    if (!container) return;
    container.innerHTML = '';
    _socialLinkCounter = 0;

    const allLinks = [];
    // Destekle eski format (github/linkedin/website string alanları)
    if (Array.isArray(links) && links.length) {
        allLinks.push(...links);
    } else if (_profileData) {
        if (_profileData.github) allLinks.push(_profileData.github);
        if (_profileData.linkedin) allLinks.push(_profileData.linkedin);
        if (_profileData.website) allLinks.push(_profileData.website);
    }

    allLinks.forEach(url => { if (url) addSocialLinkRow(url); });
    updateSocialEmptyState();
}

// ======================================================
// MODAL AÇ / KAPAT
// ======================================================
window.openEditProfileModal = function() {
    if (!_profileData) return;
    const d = _profileData;

    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    setVal('edit-profile-displayname', d.displayName);
    setVal('edit-profile-bio', d.bio);
    setVal('edit-profile-username', d.username || d.handle || (d.email ? d.email.split('@')[0] : ''));

    // Fotoğraf önizlemelerini temizle
    _selectedAvatarFile = null;
    _selectedBannerFile = null;
    const avatarPreviewImg = document.getElementById('avatar-preview-img');
    const bannerPreviewImg = document.getElementById('banner-preview-img');
    if (avatarPreviewImg) {
        avatarPreviewImg.src = d.photoURL || '';
        const hasPhoto = !!(d.photoURL);
        avatarPreviewImg.classList.toggle('hidden', !hasPhoto);
        const placeholder = document.getElementById('avatar-upload-placeholder');
        if (placeholder) placeholder.classList.toggle('hidden', hasPhoto);
        const overlay = document.getElementById('avatar-change-overlay');
        if (overlay) overlay.classList.toggle('hidden', !hasPhoto);
    }
    if (bannerPreviewImg) {
        bannerPreviewImg.src = d.bannerURL || '';
        const hasBanner = !!(d.bannerURL);
        bannerPreviewImg.classList.toggle('hidden', !hasBanner);
        const placeholder = document.getElementById('banner-upload-placeholder');
        if (placeholder) placeholder.classList.toggle('hidden', hasBanner);
        const overlay = document.getElementById('banner-change-overlay');
        if (overlay) overlay.classList.toggle('hidden', !hasBanner);
    }

    // İlerleme çubuğunu gizle
    const progressWrap = document.getElementById('upload-progress-wrap');
    if (progressWrap) progressWrap.classList.add('hidden');

    // Sosyal linkleri doldur
    populateSocialLinksInForm(d.socialLinks || null);

    const modal = document.getElementById('edit-profile-modal');
    if (modal) { modal.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
};

window.closeEditProfileModal = function() {
    const modal = document.getElementById('edit-profile-modal');
    if (modal) { modal.classList.add('hidden'); document.body.style.overflow = 'auto'; }
    _selectedAvatarFile = null;
    _selectedBannerFile = null;
};

// ======================================================
// KAYDET (handleEditProfile)
// ======================================================
window.handleEditProfile = async function(e) {
    e.preventDefault();
    const getVal = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
    const btn = document.getElementById('btn-save-profile');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="inline-block animate-spin">⏳</span> Kaydediliyor...'; }

    const progressWrap = document.getElementById('upload-progress-wrap');
    const progressBar = document.getElementById('upload-progress-bar');
    const progressPct = document.getElementById('upload-progress-pct');
    if (progressWrap) progressWrap.classList.remove('hidden');
    if (progressBar) { progressBar.style.width = '0%'; }
    if (progressPct) progressPct.textContent = '0%';

    try {
        let photoURL = _profileData.photoURL || '';
        let bannerURL = _profileData.bannerURL || '';

        // 1. Profil fotoğrafı yükle
        if (_selectedAvatarFile) {
            const label = document.getElementById('upload-progress-label');
            if (label) label.textContent = 'Profil fotoğrafı yükleniyor...';
            const ext = _selectedAvatarFile.name.split('.').pop() || 'jpg';
            const url = await uploadFileToStorage(
                _selectedAvatarFile,
                `profile_pictures/${_profileUid}.${ext}`,
                'Profil fotoğrafı yükleniyor...'
            );
            if (url) photoURL = url;
        }

        // 2. Kapak fotoğrafı yükle
        if (_selectedBannerFile) {
            const label = document.getElementById('upload-progress-label');
            if (label) label.textContent = 'Kapak fotoğrafı yükleniyor...';
            if (progressBar) progressBar.style.width = '0%';
            if (progressPct) progressPct.textContent = '0%';
            const ext = _selectedBannerFile.name.split('.').pop() || 'jpg';
            const url = await uploadFileToStorage(
                _selectedBannerFile,
                `cover_pictures/${_profileUid}.${ext}`,
                'Kapak fotoğrafı yükleniyor...'
            );
            if (url) bannerURL = url;
        }

        // 3. Sosyal linkleri topla
        const socialLinks = getSocialLinksFromForm();

        // 4. Kullanıcı Adı Validasyonu
        let usernameVal = getVal('edit-profile-username').toLowerCase();
        if (usernameVal && !/^[a-z0-9_\.]{3,20}$/.test(usernameVal)) {
            throw new Error("Kullanıcı adı geçersiz. Sadece küçük harf, rakam, alt çizgi ve nokta kullanılabilir (En az 3 karakter).");
        }

        // 5. Firestore'a kaydet
        const updates = {
            displayName: getVal('edit-profile-displayname') || _profileData.displayName,
            username: usernameVal || _profileData.username || _profileData.handle || '',
            bio: getVal('edit-profile-bio'),
            photoURL,
            bannerURL,
            socialLinks,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const targetDb = (typeof db !== 'undefined' && db) ? db : window.db;
        await targetDb.collection('users').doc(_profileUid).set(updates, { merge: true });
        _profileData = { ..._profileData, ...updates };

        // 6. Firebase Auth displayName güncelle
        const currentAuth = (typeof auth !== 'undefined' && auth) ? auth : window.auth;
        if (currentAuth && currentAuth.currentUser && updates.displayName) {
            await currentAuth.currentUser.updateProfile({ displayName: updates.displayName, photoURL });
        }

        // 7. Hero'yu güncelle
        renderProfileHero(_profileData);
        closeEditProfileModal();
        if (typeof showToast === 'function') showToast('Profiliniz başarıyla güncellendi! ✅', 'success');

    } catch (err) {
        console.error('Profil güncelleme hatası:', err);
        if (typeof showToast === 'function') showToast('Hata: ' + (err.message || 'Güncelleme başarısız.'), 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Kaydet'; }
        if (progressWrap) setTimeout(() => progressWrap.classList.add('hidden'), 1500);
    }
};

// ======================================================
// ANA BAŞLATICI
// ======================================================
async function initProfilePage() {
    const urlParams = new URLSearchParams(window.location.search);
    const uidParam = urlParams.get('uid');

    const currentAuth = (typeof auth !== 'undefined' && auth) ? auth : window.auth;
    const currentAuthUser = currentAuth ? currentAuth.currentUser : null;
    const ssoUser = (typeof SSO !== 'undefined') ? SSO.getSSOUser() : null;
    const currentUser = currentAuthUser || ssoUser;

    _profileUid = uidParam || (currentUser ? currentUser.uid : null);
    _isSelfProfile = !!(currentUser && _profileUid && currentUser.uid === _profileUid);

    if (!_profileUid) {
        const heroEl = document.getElementById('profile-hero-section');
        if (heroEl) heroEl.innerHTML = `<div class="text-center py-20 text-slate-400">Görüntülenecek profil bulunamadı. <a href="index.html" class="text-tsMavi underline">Ana Sayfaya Dön</a></div>`;
        return;
    }

    const targetDb = (typeof db !== 'undefined' && db) ? db : window.db;
    if (!targetDb) return;

    try {
        const docRef = targetDb.collection('users').doc(_profileUid);
        let docSnap = await docRef.get();

        if (!docSnap.exists && _isSelfProfile) {
            let defaultUsername = currentUser && currentUser.email ? currentUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_\.]/g, '') : '';
            const autoData = {
                uid: _profileUid,
                displayName: currentUser ? (currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Kullanıcı')) : 'Kullanıcı',
                username: defaultUsername,
                email: currentUser ? currentUser.email : '',
                photoURL: currentUser ? (currentUser.photoURL || '') : '',
                bio: '', bannerURL: '',
                socialLinks: [],
                role: 'student', uploadCount: 0, groupCount: 0,
                joinedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            await docRef.set(autoData);
            docSnap = await docRef.get();
        }

        if (docSnap && docSnap.exists) {
            _profileData = { uid: _profileUid, ...docSnap.data() };
        } else if (!_profileData) {
            const heroEl = document.getElementById('profile-hero-section');
            if (heroEl) heroEl.innerHTML = `<div class="text-center py-20 text-slate-400">Profil bulunamadı.</div>`;
            return;
        }

        renderProfileHero(_profileData);

        // Onay Bekleyenler sekmesi
        const pendingTabBtn = document.getElementById('tab-btn-pending');
        if (pendingTabBtn) {
            if (_isSelfProfile) pendingTabBtn.classList.remove('hidden');
            else pendingTabBtn.classList.add('hidden');
        }

        switchProfileTab('all');

    } catch (err) {
        console.error('Profil yükleme hatası:', err);
    }
}

// CSS animasyonu için style enjekte et
(function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRow {
            from { opacity: 0; transform: translateX(-12px); }
            to   { opacity: 1; transform: translateX(0); }
        }
    `;
    document.head.appendChild(style);
})();

// Firebase hazır olunca başlat
function waitAndInit() {
    const checkReady = (attempt) => {
        const targetDb = (typeof db !== 'undefined' && db) ? db : window.db;
        if (targetDb) { initProfilePage(); }
        else if (attempt < 20) { setTimeout(() => checkReady(attempt + 1), 300); }
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(() => checkReady(0), 300));
    } else {
        setTimeout(() => checkReady(0), 300);
    }
}

waitAndInit();
