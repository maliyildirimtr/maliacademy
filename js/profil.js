// ==========================================
// MALI ACADEMY — PROFİL SAYFASI MOTORU (profil.js)
// ==========================================

let _profileUid = null;
let _profileData = null;
let _isSelfProfile = false;
let _activeTab = 'exams';

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

function buildAvatarHtml(photoURL, displayName, size = '80px') {
    if (photoURL) {
        return `<img src="${photoURL}" alt="${displayName}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"><div class="w-full h-full hidden items-center justify-center bg-gradient-to-br from-tsBordo to-tsMavi text-white font-black text-2xl">${getInitials(displayName)}</div>`;
    }
    return `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-tsBordo to-tsMavi text-white font-black text-2xl">${getInitials(displayName)}</div>`;
}

function getRoleBadge(role, isAdmin) {
    if (isAdmin || role === 'admin') return `<span class="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">Yönetici</span>`;
    if (role === 'instructor') return `<span class="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold">Eğitmen</span>`;
    return `<span class="px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-bold">Öğrenci</span>`;
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
    if (handleEl) handleEl.textContent = '@' + (data.handle || (data.email ? data.email.split('@')[0] : 'kullanici'));
    if (joinEl) joinEl.textContent = data.joinedAt ? `Katılım: ${formatJoinDate(data.joinedAt)}` : '';
    if (bioEl) bioEl.textContent = data.bio || 'Henüz biyografi eklenmemiş.';
    if (badgeContEl) badgeContEl.innerHTML = getRoleBadge(data.role, data.isAdmin);
    if (onlineDot) onlineDot.classList.remove('hidden');

    // Social links
    if (socialEl) {
        let links = '';
        if (data.github) links += `<a href="${data.github}" target="_blank" rel="noopener" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors" title="GitHub"><svg class="w-4 h-4 text-slate-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg></a>`;
        if (data.linkedin) links += `<a href="${data.linkedin}" target="_blank" rel="noopener" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors" title="LinkedIn"><svg class="w-4 h-4 text-sky-400" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>`;
        if (data.website) links += `<a href="${data.website}" target="_blank" rel="noopener" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors" title="Web Sitesi"><svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></a>`;
        socialEl.innerHTML = links || `<span class="text-xs text-slate-500">Sosyal bağlantı eklenmemiş</span>`;
    }

    // Stats
    if (statsEl) {
        const uploadCount = data.uploadCount || 0;
        const groupCount = data.groupCount || 0;
        statsEl.innerHTML = `
            <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700">
                <svg class="w-3.5 h-3.5 text-tsMavi" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span class="text-xs font-bold text-slate-200">${uploadCount}</span>
                <span class="text-[10px] text-slate-400">Yükleme</span>
            </div>
            <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700">
                <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <span class="text-xs font-bold text-slate-200">${groupCount}</span>
                <span class="text-[10px] text-slate-400">Grup</span>
            </div>
        `;
    }

    // Self view: show edit button
    if (editBtnEl) {
        if (_isSelfProfile) {
            editBtnEl.classList.remove('hidden');
        } else {
            editBtnEl.classList.add('hidden');
        }
    }
}

// --- TABS ---
window.switchProfileTab = function(tab) {
    _activeTab = tab;
    document.querySelectorAll('.profile-tab-btn').forEach(btn => {
        const isActive = btn.dataset.tab === tab;
        btn.classList.toggle('bg-tsMavi', isActive);
        btn.classList.toggle('text-white', isActive);
        btn.classList.toggle('font-bold', isActive);
        btn.classList.toggle('shadow-md', isActive);
        btn.classList.toggle('text-slate-500', !isActive);
        btn.classList.toggle('dark:text-slate-400', !isActive);
        btn.classList.toggle('hover:bg-slate-100', !isActive);
        btn.classList.toggle('dark:hover:bg-slate-800', !isActive);
    });
    loadTabContent(tab);
}

async function loadTabContent(tab) {
    const grid = document.getElementById('profile-content-grid');
    if (!grid) return;
    grid.innerHTML = `<div class="col-span-full flex justify-center py-12"><div class="w-8 h-8 border-4 border-tsMavi border-t-transparent rounded-full animate-spin"></div></div>`;

    const targetDb = (typeof db !== 'undefined' && db) ? db : window.db;
    if (!targetDb || !_profileUid) {
        grid.innerHTML = `<div class="col-span-full text-center py-10 text-xs text-slate-400">Veri yüklenemedi.</div>`;
        return;
    }

    try {
        let items = [];
        if (tab === 'exams') {
            const snap = await targetDb.collection('exam_prep_resources').where('uid', '==', _profileUid).where('status', '==', 'approved').get();
            snap.forEach(doc => items.push({ id: doc.id, ...doc.data(), _type: 'exam' }));
        } else if (tab === 'openSource') {
            const snap = await targetDb.collection('open_source_resources').where('uid', '==', _profileUid).where('status', '==', 'approved').get();
            snap.forEach(doc => items.push({ id: doc.id, ...doc.data(), _type: 'kit' }));
        } else if (tab === 'groups') {
            const snap = await targetDb.collection('groups').where('memberUids', 'array-contains', _profileUid).get();
            snap.forEach(doc => items.push({ id: doc.id, ...doc.data(), _type: 'group' }));
        } else if (tab === 'ads') {
            const snap = await targetDb.collection('ads').where('uid', '==', _profileUid).where('status', '==', 'approved').get();
            snap.forEach(doc => items.push({ id: doc.id, ...doc.data(), _type: 'ad' }));
        } else if (tab === 'pending' && _isSelfProfile) {
            const [s1, s2] = await Promise.all([
                targetDb.collection('exam_prep_resources').where('uid', '==', _profileUid).where('status', '==', 'pending').get(),
                targetDb.collection('open_source_resources').where('uid', '==', _profileUid).where('status', '==', 'pending').get()
            ]);
            s1.forEach(doc => items.push({ id: doc.id, ...doc.data(), _type: 'exam', _pending: true }));
            s2.forEach(doc => items.push({ id: doc.id, ...doc.data(), _type: 'kit', _pending: true }));
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
    const borderStyle = isPending
        ? 'border-amber-500/50 bg-amber-500/5'
        : 'border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111b21]';
    const stripStyle = isPending
        ? 'bg-gradient-to-b from-amber-500 to-amber-600'
        : 'bg-gradient-to-b from-tsBordo to-tsMavi';

    let title = '', subtitle = '', description = '', url = '#', badge = '';

    if (item._type === 'exam') {
        title = item.title || 'Sınav Belgesi';
        subtitle = item.documentType || item.category || 'Belge';
        description = item.description || '';
        url = `sinav-hazirlik.html?highlight=${item.id}`;
        badge = isPending
            ? `<span class="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">🟡 Onay Bekliyor</span>`
            : `<span class="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">Sınav Belgesi</span>`;
    } else if (item._type === 'kit') {
        title = item.title || 'Açık Kaynak Kit';
        subtitle = item.sourceType || item.category || 'Proje';
        description = item.description || '';
        url = `acik-kaynak.html?highlight=${item.id}`;
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
        url = `ilan-panosu.html?highlight=${item.id}`;
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

// --- EDIT MODAL ---
window.openEditProfileModal = function() {
    if (!_profileData) return;
    const d = _profileData;
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    setVal('edit-profile-displayname', d.displayName);
    setVal('edit-profile-bio', d.bio);
    setVal('edit-profile-photo', d.photoURL);
    setVal('edit-profile-banner', d.bannerURL);
    setVal('edit-profile-github', d.github);
    setVal('edit-profile-linkedin', d.linkedin);
    setVal('edit-profile-website', d.website);
    const modal = document.getElementById('edit-profile-modal');
    if (modal) { modal.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
}

window.closeEditProfileModal = function() {
    const modal = document.getElementById('edit-profile-modal');
    if (modal) { modal.classList.add('hidden'); document.body.style.overflow = 'auto'; }
}

window.handleEditProfile = async function(e) {
    e.preventDefault();
    const getVal = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
    const btn = document.getElementById('btn-save-profile');
    if (btn) { btn.disabled = true; btn.textContent = 'Kaydediliyor...'; }

    const updates = {
        displayName: getVal('edit-profile-displayname') || _profileData.displayName,
        bio: getVal('edit-profile-bio'),
        photoURL: getVal('edit-profile-photo'),
        bannerURL: getVal('edit-profile-banner'),
        github: getVal('edit-profile-github'),
        linkedin: getVal('edit-profile-linkedin'),
        website: getVal('edit-profile-website'),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        const targetDb = (typeof db !== 'undefined' && db) ? db : window.db;
        await targetDb.collection('users').doc(_profileUid).set(updates, { merge: true });
        _profileData = { ..._profileData, ...updates };

        // Update Firebase auth displayName
        const currentAuth = (typeof auth !== 'undefined' && auth) ? auth : window.auth;
        if (currentAuth && currentAuth.currentUser && updates.displayName) {
            await currentAuth.currentUser.updateProfile({ displayName: updates.displayName });
        }

        renderProfileHero(_profileData);
        closeEditProfileModal();
        if (typeof showToast === 'function') showToast('Profiliniz başarıyla güncellendi!', 'success');
    } catch (err) {
        console.error('Profil güncelleme hatası:', err);
        if (typeof showToast === 'function') showToast('Güncelleme sırasında hata oluştu: ' + err.message, 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Kaydet'; }
    }
}

// --- MAIN INIT ---
async function initProfilePage() {
    const urlParams = new URLSearchParams(window.location.search);
    const uidParam = urlParams.get('uid');

    const currentAuth = (typeof auth !== 'undefined' && auth) ? auth : window.auth;
    const currentAuthUser = currentAuth ? currentAuth.currentUser : null;
    const ssoUser = (typeof SSO !== 'undefined') ? SSO.getSSOUser() : null;
    const currentUser = currentAuthUser || ssoUser;

    _profileUid = uidParam || (currentUser ? currentUser.uid : null);
    _isSelfProfile = !!(currentUser && _profileUid && currentUser.uid === _profileUid);

    // Update page title query display
    const titleQueryEl = document.getElementById('profile-title-query');
    if (titleQueryEl) titleQueryEl.textContent = _profileUid || '...';

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

        if (!docSnap.exists) {
            // Auto-create from auth/SSO data
            const autoData = {
                uid: _profileUid,
                displayName: currentUser ? (currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Kullanıcı')) : 'Kullanıcı',
                email: currentUser ? currentUser.email : '',
                photoURL: currentUser ? (currentUser.photoURL || '') : '',
                bio: '',
                github: '', linkedin: '', website: '', bannerURL: '',
                role: 'student',
                uploadCount: 0, groupCount: 0,
                joinedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            if (_isSelfProfile) {
                await docRef.set(autoData);
                docSnap = await docRef.get();
            } else {
                _profileData = autoData;
            }
        }

        if (docSnap && docSnap.exists) {
            _profileData = { uid: _profileUid, ...docSnap.data() };
        }

        if (!_profileData) {
            const heroEl = document.getElementById('profile-hero-section');
            if (heroEl) heroEl.innerHTML = `<div class="text-center py-20 text-slate-400">Profil bulunamadı.</div>`;
            return;
        }

        renderProfileHero(_profileData);

        // Show/hide pending tab
        const pendingTabBtn = document.getElementById('tab-btn-pending');
        if (pendingTabBtn) {
            if (_isSelfProfile) pendingTabBtn.classList.remove('hidden');
            else pendingTabBtn.classList.add('hidden');
        }

        // Load default tab
        switchProfileTab('exams');

    } catch (err) {
        console.error('Profil yükleme hatası:', err);
    }
}

// Wait for Firebase to be ready
function waitAndInit() {
    const checkReady = (attempt) => {
        const targetDb = (typeof db !== 'undefined' && db) ? db : window.db;
        if (targetDb) {
            initProfilePage();
        } else if (attempt < 15) {
            setTimeout(() => checkReady(attempt + 1), 300);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(() => checkReady(0), 300));
    } else {
        setTimeout(() => checkReady(0), 300);
    }
}

waitAndInit();
