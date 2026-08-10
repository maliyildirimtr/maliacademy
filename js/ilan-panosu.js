let currentAnnouncementId = null;
let currentAnnouncementData = null;

function getCategoryBadgeClass(category) {
    switch (category) {
        case 'TEKNOFEST 2026': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
        case 'Bitirme Projesi': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
        case 'Çalışma Grubu': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
        case 'Akademik İlan': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
        default: return 'bg-tsMavi/10 text-tsMavi border-tsMavi/20';
    }
}

function openCreateAnnouncementModal() {
    const user = typeof auth !== 'undefined' ? auth.currentUser : null;
    if (!user) {
        if (typeof showToast === 'function') showToast("İlan oluşturmak için lütfen önce giriş yapın!", "info");
        if (typeof openAuthModal === 'function') openAuthModal();
        return;
    }

    const selectEl = document.getElementById('announcement-project-group');
    const noticeEl = document.getElementById('no-admin-group-notice');
    if (noticeEl) noticeEl.classList.add('hidden');

    if (selectEl) {
        selectEl.innerHTML = `<option value="custom">⏳ Yönetici olduğunuz proje grupları yükleniyor...</option>`;

        if (typeof db !== 'undefined' && db && db.collection) {
            const fetchP1 = db.collection("project_groups").get().catch(() => ({ docs: [] }));
            const fetchP2 = db.collection("groups").get().catch(() => ({ docs: [] }));

            Promise.all([fetchP1, fetchP2]).then(([snap1, snap2]) => {
                const groupMap = new Map();
                const uid = user.uid;

                const filterAdminGroup = (doc) => {
                    const data = doc.data();
                    if (!data) return false;

                    // 1. Kurucu / Yönetici / Lider Kontrolü (adminUid, ownerUid, authorUid, leaderUid, leader.uid, roles[uid] === 'admin')
                    const isCreator = (data.adminUid === uid) || (data.ownerUid === uid) || (data.authorUid === uid) || (data.leaderUid === uid) || (data.leader && data.leader.uid === uid);
                    const hasAdminRole = data.roles && (data.roles[uid] === 'admin' || data.roles[uid] === 'owner');

                    // 2. Yönetici Yardımcısı / Moderatör Kontrolü (coAdmins, moderators dizileri veya roles[uid] === 'co_admin')
                    const isCoAdmin = (Array.isArray(data.coAdmins) && data.coAdmins.includes(uid)) || 
                                      (Array.isArray(data.moderators) && data.moderators.includes(uid)) ||
                                      (data.roles && (data.roles[uid] === 'co_admin' || data.roles[uid] === 'moderator'));

                    // 3. Üyeler dizisindeki rol kontrolü (Yönetici, Lider, Yönetici Yardımcısı)
                    let isMemberAdmin = false;
                    if (Array.isArray(data.members)) {
                        const m = data.members.find(mem => mem.uid === uid || mem.id === uid);
                        if (m && (m.role === 'Yönetici' || m.role === 'Lider' || m.role === 'Yönetici Yardımcısı' || m.role === 'Admin' || m.role === 'Co-Admin')) {
                            isMemberAdmin = true;
                        }
                    }

                    return isCreator || hasAdminRole || isCoAdmin || isMemberAdmin;
                };

                if (snap1 && snap1.docs) {
                    snap1.docs.forEach(d => {
                        if (filterAdminGroup(d)) groupMap.set(d.id, { id: d.id, ...d.data() });
                    });
                }
                if (snap2 && snap2.docs) {
                    snap2.docs.forEach(d => {
                        if (filterAdminGroup(d)) groupMap.set(d.id, { id: d.id, ...d.data() });
                    });
                }

                const adminGroups = Array.from(groupMap.values());

                let optionsHTML = "";
                if (adminGroups.length > 0) {
                    adminGroups.forEach((g, idx) => {
                        const gName = g.name || g.title || 'Proje Grubu';
                        const isSel = (targetGroupId && g.id === targetGroupId) || (!targetGroupId && idx === 0) ? 'selected' : '';
                        optionsHTML += `<option value="${g.id}" data-name="${gName}" ${isSel}>👥 ${gName} (Yönetici)</option>`;
                    });
                    optionsHTML += `<option value="custom">＋ Özel / Bağımsız İlan Grubu</option>`;
                    if (noticeEl) noticeEl.classList.add('hidden');
                } else {
                    optionsHTML = `<option value="custom" selected>＋ Özel / Bağımsız İlan Grubu</option>`;
                    if (noticeEl) noticeEl.classList.remove('hidden');
                }

                selectEl.innerHTML = optionsHTML;
                if (targetGroupId) selectEl.value = targetGroupId;
            }).catch(() => {
                selectEl.innerHTML = `<option value="custom" selected>＋ Özel / Bağımsız İlan Grubu</option>`;
                if (noticeEl) noticeEl.classList.remove('hidden');
            });
        } else {
            selectEl.innerHTML = `<option value="custom" selected>＋ Özel / Bağımsız İlan Grubu</option>`;
            if (noticeEl) noticeEl.classList.remove('hidden');
        }
    }

    const modal = document.getElementById('announcement-create-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeCreateAnnouncementModal() {
    const modal = document.getElementById('announcement-create-modal');
    if (modal) modal.classList.add('hidden');
    const form = document.getElementById('announcement-create-form');
    if (form) form.reset();
}

function closeAnnouncementDetailModal() {
    const modal = document.getElementById('announcement-detail-modal');
    if (modal) modal.classList.add('hidden');
    currentAnnouncementId = null;
    currentAnnouncementData = null;
}

function loadAnnouncements() {
    const grid = document.getElementById('announcements-grid');
    if (!grid) return;

    if (typeof db !== 'undefined' && db) {
        db.collection("announcements").onSnapshot((snapshot) => {
            if (!snapshot || snapshot.empty) {
                renderEmptyState(grid);
                return;
            }

            let rawItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Delete legacy system-card entries from Firestore announcements collection
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                if (doc.id.startsWith('system-card-') || data.isProtected || (data.title && (data.title.includes('Mantıksal Devre Tasarımı') || data.title.includes('Açık Kaynak Mühendislik')))) {
                    db.collection("announcements").doc(doc.id).delete().catch(() => {});
                }
            });

            // Filter out system cards and mock items
            let items = rawItems.filter(item => {
                if (item.id.startsWith('system-card-') || item.isProtected) return false;
                const t = (item.title || '').toLowerCase();
                if (t.includes('mantıksal devre tasarımı') || t.includes('açık kaynak mühendislik') || t === 'aaaa' || t === 'aaa') return false;
                return true;
            });
            
            // Client-side sort by timestamp/createdAt
            items.sort((a, b) => {
                const tA = a.createdAt && typeof a.createdAt.toMillis === 'function' ? a.createdAt.toMillis() : (a.createdAt && a.createdAt.seconds ? a.createdAt.seconds * 1000 : 0);
                const tB = b.createdAt && typeof b.createdAt.toMillis === 'function' ? b.createdAt.toMillis() : (b.createdAt && b.createdAt.seconds ? b.createdAt.seconds * 1000 : 0);
                return tB - tA;
            });

            if (items.length === 0) {
                renderEmptyState(grid);
                return;
            }

            let html = "";
            items.forEach((item) => {
                const id = item.id;
                let dateStr = 'Yeni';
                if (item.createdAt && typeof item.createdAt.toDate === 'function') {
                    dateStr = item.createdAt.toDate().toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
                }
                const badgeClass = getCategoryBadgeClass(item.category);
                const grpBadgeHTML = item.groupName ? `<span class="text-[11px] font-bold text-tsMavi block mb-1">👥 ${item.groupName}</span>` : '';

                html += `
                    <div onclick="openAnnouncementDetailModal('${id}')" class="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-lg hover:border-tsMavi transition-all flex flex-col justify-between space-y-4 relative overflow-hidden cursor-pointer group">
                        <div class="space-y-3">
                            <div class="flex items-center justify-between">
                                <span class="px-2.5 py-1 rounded-lg border text-xs font-bold ${badgeClass}">${item.category || 'İlan'}</span>
                                <span class="text-[11px] text-slate-400 font-mono">${dateStr}</span>
                            </div>
                            <div>
                                ${grpBadgeHTML}
                                <h3 class="font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-tsMavi transition-colors">${item.title}</h3>
                                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-3 leading-relaxed">${item.description}</p>
                            </div>
                        </div>

                        <div class="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                            <span class="text-slate-400 font-mono flex items-center gap-1">👤 ${item.authorName || 'Kullanıcı'}</span>
                            <span class="font-bold text-tsMavi group-hover:translate-x-1 transition-transform flex items-center gap-1">Detayları Gör →</span>
                        </div>
                    </div>
                `;
            });

            grid.innerHTML = html;

            // Automatic ID matching: check URL query parameter ?id=ANNOUNCEMENT_ID
            const urlParams = new URLSearchParams(window.location.search);
            const targetId = urlParams.get('id');
            if (targetId && !currentAnnouncementId) {
                openAnnouncementDetailModal(targetId);
            }
        }, (err) => {
            console.warn("Firestore announcements okuma uyarısı:", err);
            renderEmptyState(grid);
        });
    } else {
        renderEmptyState(grid);
    }
}

function renderEmptyState(grid) {
    if (!grid) return;
    grid.innerHTML = `
        <div class="col-span-full py-16 px-6 text-center space-y-4 max-w-md mx-auto">
            <div class="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-3xl flex items-center justify-center mx-auto text-slate-400 shadow-inner">
                📢
            </div>
            <div class="space-y-1">
                <h4 class="font-bold text-base text-slate-800 dark:text-slate-200">Henüz yayınlanmış bir ilan bulunmuyor.</h4>
                <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">İlk ilanı siz oluşturun, takım arkadaşlarınızı bulun ve projenizi hayata geçirin!</p>
            </div>
            <div>
                <button onclick="openCreateAnnouncementModal()" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-tsBordo to-tsMavi text-white font-bold text-xs shadow-lg hover:opacity-90 transition-opacity inline-flex items-center gap-1.5">
                    <span>＋</span> İlk İlanı Siz Oluşturun
                </button>
            </div>
        </div>
    `;
}

function openAnnouncementDetailModal(announcementId) {
    currentAnnouncementId = announcementId;
    const modal = document.getElementById('announcement-detail-modal');
    const container = document.getElementById('announcement-detail-content');
    if (!modal || !container) return;

    modal.classList.remove('hidden');
    container.innerHTML = `<div class="py-12 text-center text-slate-500 text-xs font-mono">⏳ İlan detayları yükleniyor...</div>`;

    if (typeof db !== 'undefined') {
        db.collection("announcements").doc(announcementId).get().then(doc => {
            if (!doc.exists) {
                container.innerHTML = `<div class="py-12 text-center text-red-500 text-sm">İlan bulunamadı!</div>`;
                return;
            }
            currentAnnouncementData = doc.data();
            renderAnnouncementDetailUI(announcementId, currentAnnouncementData);
        }).catch(() => {
            container.innerHTML = `<div class="py-12 text-center text-slate-400 text-xs">Örnek İlan Detayı</div>`;
        });
    } else {
        container.innerHTML = `<div class="py-12 text-center text-slate-400 text-xs">Veritabanı bağlantısı yok.</div>`;
    }
}

function copyAnnouncementLink(id) {
    const fullUrl = `${window.location.origin}${window.location.pathname}?id=${id}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
        if (typeof showToast === 'function') showToast("🔗 İlan linki kopyalandı!", "success");
        else alert("🔗 İlan linki kopyalandı!");
    });
}

function renderAnnouncementDetailUI(id, data) {
    const container = document.getElementById('announcement-detail-content');
    if (!container) return;

    const user = typeof auth !== 'undefined' ? auth.currentUser : null;
    const adminState = typeof isAdmin === 'function' && isAdmin();
    const isAuthor = (user && data.authorUid === user.uid) || adminState;

    const badgeClass = getCategoryBadgeClass(data.category);
    const dateStr = data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Tarih Belirtilmedi';

    container.innerHTML = `
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div class="flex items-center gap-2">
                <span class="px-3 py-1 rounded-xl border text-xs font-bold ${badgeClass}">${data.category || 'İlan'}</span>
                <span class="text-xs text-slate-400 font-mono">${dateStr}</span>
            </div>
            <div class="flex items-center gap-2">
                <button onclick="copyAnnouncementLink('${id}')" class="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-tsMavi transition-colors">
                    🔗 Linki Kopyala
                </button>
                <button onclick="closeAnnouncementDetailModal()" class="text-slate-400 hover:text-white text-lg p-1">✕</button>
            </div>
        </div>

        <div class="space-y-3">
            <h2 class="text-2xl font-extrabold tracking-tight">${data.title}</h2>
            <div class="flex flex-wrap items-center gap-2.5 text-xs text-slate-400">
                ${data.groupName ? `<span class="px-3 py-1 rounded-xl bg-tsMavi/10 text-tsMavi border border-tsMavi/20 font-bold flex items-center gap-1">👥 Bağlı Grup: ${data.groupName}</span>` : ''}
                <span>👤 İlan Sahibi: <strong class="text-slate-200">${data.authorName || 'Anonim'}</strong></span>
            </div>
            <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                ${data.description}
            </div>
        </div>

        <!-- İSTEK & BAŞVURU BÖLÜMÜ -->
        <div id="request-section-container" class="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
            <div class="text-center py-4 text-xs text-slate-400">İstekler yükleniyor...</div>
        </div>

        ${isAuthor ? `
            <div class="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button onclick="deleteAnnouncement('${id}')" class="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-semibold border border-red-500/20">
                    🗑️ Bu İlanı Sil
                </button>
            </div>
        ` : ''}
    `;

    loadRequestSection(id, data, isAuthor);
}

function loadRequestSection(announcementId, announcementData, isAuthor) {
    const reqContainer = document.getElementById('request-section-container');
    if (!reqContainer) return;

    const user = typeof auth !== 'undefined' ? auth.currentUser : null;

    if (isAuthor) {
        db.collection("announcements").doc(announcementId).collection("requests").onSnapshot(snapshot => {
            if (!snapshot || snapshot.empty) {
                reqContainer.innerHTML = `
                    <div class="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                        📩 Henüz bu ilana katılma isteği gönderilmedi.
                    </div>
                `;
                return;
            }

            let requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            requests.sort((a, b) => {
                const tA = a.createdAt && typeof a.createdAt.toMillis === 'function' ? a.createdAt.toMillis() : (a.createdAt && a.createdAt.seconds ? a.createdAt.seconds * 1000 : 0);
                const tB = b.createdAt && typeof b.createdAt.toMillis === 'function' ? b.createdAt.toMillis() : (b.createdAt && b.createdAt.seconds ? b.createdAt.seconds * 1000 : 0);
                return tB - tA;
            });

            let html = `<h4 class="font-bold text-sm flex items-center gap-2">📩 Gelen Katılma İstekleri (${requests.length})</h4><div class="space-y-3">`;
            requests.forEach(req => {
                const reqId = req.id;
                const statusBadge = req.status === 'accepted' ? '<span class="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">✓ Kabul Edildi</span>'
                    : req.status === 'rejected' ? '<span class="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded">✕ Reddedildi</span>'
                    : '<span class="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">⏳ Bekliyor</span>';

                html += `
                    <div class="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2 shadow-sm">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <div class="w-7 h-7 rounded-full bg-tsMavi/10 text-tsMavi flex items-center justify-center font-bold text-xs">
                                    ${(req.applicantName || 'K')[0]}
                                </div>
                                <span class="text-xs font-bold">${req.applicantName || 'Kullanıcı'}</span>
                            </div>
                            <div>${statusBadge}</div>
                        </div>

                        ${req.note ? `<p class="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/50">${req.note}</p>` : ''}

                        ${req.status === 'pending' ? `
                            <div class="flex justify-end gap-2 pt-2">
                                <button onclick="updateRequestStatus('${announcementId}', '${reqId}', 'rejected')" class="px-3 py-1.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-semibold">✕ Reddet</button>
                                <button onclick="updateRequestStatus('${announcementId}', '${reqId}', 'accepted')" class="px-4 py-1.5 rounded-xl bg-emerald-500 text-white shadow-md hover:bg-emerald-600 transition-all text-xs font-semibold">✓ Kabul Et</button>
                            </div>
                        ` : ''}
                    </div>
                `;
            });
            html += `</div>`;
            reqContainer.innerHTML = html;
        }, (err) => {
            console.warn("Gelen istekler okuma uyarısı:", err);
            reqContainer.innerHTML = `<div class="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">📩 Henüz bu ilana katılma isteği gönderilmedi.</div>`;
        });
    } else {
        if (!user) {
            reqContainer.innerHTML = `
                <div class="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-2">
                    <p class="text-xs text-amber-500 font-semibold">🔒 Bu ilana katılma isteği göndermek için lütfen önce giriş yapın.</p>
                    <button onclick="openAuthModal()" class="px-4 py-1.5 rounded-xl bg-amber-500 text-slate-900 font-bold text-xs shadow">Giriş Yap / Kayıt Ol</button>
                </div>
            `;
            return;
        }

        db.collection("announcements").doc(announcementId).collection("requests").doc(user.uid).onSnapshot(doc => {
            if (doc.exists) {
                const req = doc.data();
                if (req.status === 'accepted') {
                    reqContainer.innerHTML = `
                        <div class="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                            <div class="flex items-center gap-2 text-emerald-500 font-bold text-sm">
                                <span>🎉</span> Tebrikler! Katılma İsteğiniz Kabul Edildi!
                            </div>
                            <p class="text-xs text-slate-600 dark:text-slate-300">İlan sahibi ekibe katılmanız için gerekli iletişim linkini aşağıda paylaştı:</p>
                            ${announcementData.inviteLink ? `
                                <div class="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/20 flex items-center justify-between gap-2">
                                    <span class="text-xs font-mono truncate text-tsMavi">${announcementData.inviteLink}</span>
                                    <a href="${announcementData.inviteLink}" target="_blank" class="px-3 py-1.5 rounded-lg bg-emerald-500 text-white font-bold text-xs shrink-0 shadow">Gruba Katıl ↗</a>
                                </div>
                            ` : `
                                <p class="text-xs text-slate-400 italic">İlan sahibi harici davet linki belirtmemiş. Profil detaylarınız üzerinden sizinle iletişime geçecektir.</p>
                            `}
                        </div>
                    `;
                } else if (req.status === 'rejected') {
                    reqContainer.innerHTML = `
                        <div class="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-center space-y-1">
                            <p class="text-xs font-bold text-red-500">❌ Katılma İsteğiniz Reddedildi</p>
                            <p class="text-[11px] text-slate-400">İlan sahibi başvurunuzu bu dönem için uygun bulmadı.</p>
                        </div>
                    `;
                } else {
                    reqContainer.innerHTML = `
                        <div class="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1">
                            <p class="text-xs font-bold text-amber-500">⏳ Katılma İsteğiniz Gönderildi</p>
                            <p class="text-[11px] text-slate-400">İlan sahibinin başvurunuzu onaylaması bekleniyor. Onaylandığında katılım linki burada görüntülenecektir.</p>
                        </div>
                    `;
                }
            } else {
                reqContainer.innerHTML = `
                    <form onsubmit="submitJoinRequest(event, '${announcementId}')" class="space-y-3">
                        <h4 class="font-bold text-sm flex items-center gap-2">🚀 Bu Ekibe / Gruba Katılma İsteği Gönder</h4>
                        <div>
                            <textarea id="join-request-note" rows="3" placeholder="İlan sahibine mesajınız, tecrübeleriniz ve yetenekleriniz (İsteğe bağlı)..." class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-tsMavi resize-none"></textarea>
                        </div>
                        <div class="flex justify-end">
                            <button type="submit" id="submit-join-btn" class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-tsBordo to-tsMavi text-white font-bold text-xs shadow-md hover:opacity-90 transition-opacity">
                                Katılma İsteği Gönder
                            </button>
                        </div>
                    </form>
                `;
            }
        });
    }
}

function submitJoinRequest(e, announcementId) {
    if (e && e.preventDefault) e.preventDefault();

    const user = typeof auth !== 'undefined' ? auth.currentUser : null;
    if (!user) {
        if (typeof showToast === 'function') showToast("İstek göndermek için giriş yapmalısınız!", "info");
        if (typeof openAuthModal === 'function') openAuthModal();
        return;
    }

    const noteInput = document.getElementById('join-request-note');
    const noteText = noteInput ? noteInput.value.trim() : '';

    const submitBtn = document.getElementById('submit-join-btn');
    if (submitBtn) submitBtn.innerText = "Gönderiliyor...";

    const targetAuthorUid = currentAnnouncementData ? currentAnnouncementData.authorUid : null;
    const annTitle = currentAnnouncementData ? currentAnnouncementData.title : 'İlan';
    const groupId = currentAnnouncementData ? (currentAnnouncementData.groupId || 'custom') : 'custom';
    const groupName = currentAnnouncementData ? (currentAnnouncementData.groupName || annTitle) : annTitle;

    db.collection("announcements").doc(announcementId).collection("requests").doc(user.uid).set({
        applicantUid: user.uid,
        applicantName: user.displayName || user.email.split('@')[0],
        applicantPhotoURL: user.photoURL || '',
        note: noteText,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        if (targetAuthorUid && targetAuthorUid !== user.uid) {
            db.collection("notifications").add({
                announcementId: announcementId,
                groupId: groupId,
                groupName: groupName,
                announcementTitle: annTitle,
                targetUserUid: targetAuthorUid,
                senderUid: user.uid,
                senderName: user.displayName || user.email.split('@')[0],
                senderPhoto: user.photoURL || '',
                message: `${user.displayName || user.email.split('@')[0]} '${groupName}' grubunuza katılmak istiyor.`,
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).catch(() => {});
        }
        if (typeof showToast === 'function') showToast("🚀 Katılma isteğiniz başarıyla gönderildi!", "success");
    }).catch(err => {
        alert("Hata oluştu: " + err.message);
    }).finally(() => {
        if (submitBtn) {
            submitBtn.innerText = "✓ İstek Gönderildi";
            submitBtn.disabled = true;
        }
    });
}

function updateRequestStatus(announcementId, reqId, newStatus) {
    db.collection("announcements").doc(announcementId).collection("requests").doc(reqId).update({
        status: newStatus,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        if (typeof showToast === 'function') showToast(`İstek durumu güncellendi: ${newStatus}`, "info");
    }).catch(err => alert("Güncelleme hatası: " + err.message));
}

function deleteAnnouncement(announcementId) {
    if (confirm("Bu ilanı ve tüm başvuruları silmek istediğinize emin misiniz?")) {
        db.collection("announcements").doc(announcementId).delete().then(() => {
            if (typeof showToast === 'function') showToast("🗑️ İlan silindi.", "info");
            closeAnnouncementDetailModal();
        }).catch(err => alert("Silme hatası: " + err.message));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadAnnouncements();

    const urlParams = new URLSearchParams(window.location.search);
    const targetGroupId = urlParams.get('groupId');
    if (targetGroupId) {
        setTimeout(() => {
            openCreateAnnouncementModal(targetGroupId);
        }, 400);
    }

    const createForm = document.getElementById('announcement-create-form');
    if (createForm) {
        createForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const user = typeof auth !== 'undefined' ? auth.currentUser : null;
            if (!user) {
                if (typeof showToast === 'function') showToast("İlan eklemek için giriş yapmalısınız!", "info");
                if (typeof openAuthModal === 'function') openAuthModal();
                return;
            }

            const groupSelect = document.getElementById('announcement-project-group');
            const selectedOpt = groupSelect ? groupSelect.options[groupSelect.selectedIndex] : null;
            const groupId = groupSelect ? groupSelect.value : 'custom';
            const groupName = (selectedOpt && selectedOpt.hasAttribute('data-name')) ? selectedOpt.getAttribute('data-name') : (document.getElementById('announcement-title').value.trim());

            const category = document.getElementById('announcement-category').value;
            const title = document.getElementById('announcement-title').value.trim();
            const description = document.getElementById('announcement-description').value.trim();
            const inviteLink = document.getElementById('announcement-invite-link') ? document.getElementById('announcement-invite-link').value.trim() : '';

            const submitBtn = document.getElementById('create-announcement-submit-btn');
            if (submitBtn) submitBtn.innerText = "Yayınlanıyor...";

            db.collection("announcements").add({
                groupId: groupId || 'custom',
                groupName: groupName || title,
                category: category,
                title: title,
                description: description,
                inviteLink: inviteLink,
                authorUid: user.uid,
                authorName: user.displayName || user.email.split('@')[0],
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                if (typeof showToast === 'function') showToast("🎉 İlanınız başarıyla yayınlandı!", "success");
                closeCreateAnnouncementModal();
                loadAnnouncements();
            }).catch(err => {
                if (typeof showToast === 'function') showToast("İlan eklenirken hata oluştu: " + err.message, "error");
                else alert("İlan eklenirken hata oluştu: " + err.message);
            }).finally(() => {
                if (submitBtn) submitBtn.innerText = "İlanı Yayınla";
            });
        });
    }
});
