// ==========================================
// MALI ACADEMY — SİTE GENELİ USER HOVER CARD SİSTEMİ
// Herhangi bir [data-user-uid] elementine hover yapıldığında
// mini profil önizleme kartı açılır.
// ==========================================

(function() {
    'use strict';

    const CACHE = {}; // uid -> profileData
    let _card = null;
    let _showTimer = null;
    let _hideTimer = null;
    let _currentUid = null;

    // ---- KART DOM OLUŞTURMA ----
    function createCard() {
        const el = document.createElement('div');
        el.id = 'user-hover-card';
        el.className = [
            'fixed z-[9999] w-72 p-4 rounded-2xl shadow-2xl',
            'bg-white dark:bg-[#111b21] border border-slate-200 dark:border-slate-800',
            'transition-all duration-200 opacity-0 pointer-events-none',
            'backdrop-blur-md'
        ].join(' ');
        el.innerHTML = `
            <div class="flex items-start gap-3">
                <div id="uhc-avatar" class="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-slate-200 dark:border-slate-700 bg-gradient-to-br from-tsBordo to-tsMavi flex items-center justify-center"></div>
                <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-1.5 flex-wrap">
                        <span id="uhc-name" class="font-bold text-sm text-slate-900 dark:text-slate-100 truncate"></span>
                        <span id="uhc-badge" class="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">Öğrenci</span>
                    </div>
                    <span id="uhc-handle" class="text-[11px] text-slate-400 block"></span>
                </div>
            </div>
            <p id="uhc-bio" class="mt-3 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed"></p>
            <div class="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <a id="uhc-profile-link" href="#" class="flex-1 text-center py-1.5 rounded-xl bg-gradient-to-r from-tsBordo to-tsMavi text-white text-xs font-bold hover:opacity-90 transition-opacity shadow-sm">
                    Profili İncele →
                </a>
            </div>
        `;
        // Hover üzerinde kalınca kapanmasın
        el.addEventListener('mouseenter', cancelHide);
        el.addEventListener('mouseleave', scheduleHide);
        document.body.appendChild(el);
        return el;
    }

    function getCard() {
        if (!_card) _card = createCard();
        return _card;
    }

    // ---- POZİSYON HESAPLAMA ----
    function positionCard(anchor) {
        const card = getCard();
        const rect = anchor.getBoundingClientRect();
        const cardW = 288; // w-72
        const cardH = 180; // yaklaşık
        const margin = 8;

        let top = rect.bottom + margin + window.scrollY;
        let left = rect.left + window.scrollX;

        // Sağa taşma kontrolü
        if (left + cardW > window.innerWidth - margin) {
            left = window.innerWidth - cardW - margin;
        }
        // Alt taşma kontrolü
        if (rect.bottom + cardH + margin > window.innerHeight) {
            top = rect.top - cardH - margin + window.scrollY;
        }

        card.style.top = `${top}px`;
        card.style.left = `${left}px`;
    }

    // ---- PROFIL VERİSİ ÇEKME ----
    async function fetchProfile(uid) {
        if (CACHE[uid]) return CACHE[uid];
        const targetDb = (typeof db !== 'undefined' && db) ? db : window.db;
        if (!targetDb) return null;
        try {
            const snap = await targetDb.collection('users').doc(uid).get();
            const data = snap.exists ? { uid, ...snap.data() } : { uid, displayName: 'Kullanıcı', bio: '', role: 'student' };
            CACHE[uid] = data;
            // Cache 60s sonra temizle
            setTimeout(() => { delete CACHE[uid]; }, 60000);
            return data;
        } catch (e) {
            return null;
        }
    }

    // ---- KART GÜNCELLEMESİ ----
    function getInitials(name) {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        return name[0].toUpperCase();
    }

    function updateCard(data, uid) {
        const card = getCard();
        const avatarEl = card.querySelector('#uhc-avatar');
        const nameEl = card.querySelector('#uhc-name');
        const badgeEl = card.querySelector('#uhc-badge');
        const handleEl = card.querySelector('#uhc-handle');
        const bioEl = card.querySelector('#uhc-bio');
        const profileLink = card.querySelector('#uhc-profile-link');

        // Avatar
        if (avatarEl) {
            if (data.photoURL) {
                avatarEl.innerHTML = `<img src="${data.photoURL}" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<span class=\\'text-white font-black text-lg\\'>${getInitials(data.displayName)}</span>';">`;
            } else {
                avatarEl.innerHTML = `<span class="text-white font-black text-lg">${getInitials(data.displayName)}</span>`;
            }
        }

        if (nameEl) nameEl.textContent = data.displayName || 'Kullanıcı';
        if (handleEl) handleEl.textContent = '@' + (data.handle || (data.email ? data.email.split('@')[0] : uid.slice(0, 8)));

        if (badgeEl) {
            if (data.role === 'admin' || data.isAdmin) {
                badgeEl.textContent = 'Yönetici';
                badgeEl.className = 'px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20';
            } else if (data.role === 'instructor') {
                badgeEl.textContent = 'Eğitmen';
                badgeEl.className = 'px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20';
            } else {
                badgeEl.textContent = 'Öğrenci';
                badgeEl.className = 'px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20';
            }
        }

        if (bioEl) bioEl.textContent = data.bio || 'Kullanıcı biyografisi henüz eklenmemiş.';
        if (profileLink) profileLink.href = `profil.html?uid=${uid}`;
    }

    // ---- GÖSTER / GİZLE ----
    function showCard(anchor, uid) {
        const card = getCard();
        _currentUid = uid;
        positionCard(anchor);
        card.style.opacity = '0';
        card.style.transform = 'translateY(6px)';
        card.style.pointerEvents = 'auto';
        card.classList.remove('hidden');

        fetchProfile(uid).then(data => {
            if (!data || _currentUid !== uid) return;
            updateCard(data, uid);
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        });
    }

    function hideCard() {
        const card = getCard();
        card.style.opacity = '0';
        card.style.transform = 'translateY(6px)';
        card.style.pointerEvents = 'none';
        _currentUid = null;
    }

    function scheduleShow(anchor, uid) {
        cancelHide();
        clearTimeout(_showTimer);
        _showTimer = setTimeout(() => showCard(anchor, uid), 300);
    }

    function scheduleHide() {
        clearTimeout(_showTimer);
        _hideTimer = setTimeout(hideCard, 200);
    }

    function cancelHide() {
        clearTimeout(_hideTimer);
    }

    // ---- EVENT DELEGATION ----
    document.addEventListener('mouseover', function(e) {
        const target = e.target.closest('[data-user-uid]');
        if (!target) return;
        const uid = target.dataset.userUid;
        if (!uid) return;
        scheduleShow(target, uid);
    });

    document.addEventListener('mouseout', function(e) {
        const target = e.target.closest('[data-user-uid]');
        if (!target) return;
        // Karta gidiyorsa iptal et
        const relatedTarget = e.relatedTarget;
        if (relatedTarget && relatedTarget.closest('#user-hover-card')) return;
        scheduleHide();
    });

    // Sayfadan çıkınca gizle
    document.addEventListener('scroll', hideCard, { passive: true });

    // Touch cihazlarda hover'ı devre dışı bırak
    window.addEventListener('touchstart', hideCard, { passive: true });

    // Global erişim
    window.UserHoverCard = { fetchProfile, updateCard, hideCard };

})();
