// ==========================================
// SINAV & VİZE HAZIRLIK - PDF PREVIEW, NOTIFICATIONS & EDIT/DELETE
// ==========================================

let allExams = [];

// GOOGLE DRIVE / LINK EMBED CONVERTOR
function getEmbedUrl(rawUrl) {
    if (!rawUrl) return '';
    let url = rawUrl.trim();
    
    // Check if Google Drive link
    if (url.includes('drive.google.com')) {
        // Match /file/d/FILE_ID or ?id=FILE_ID
        const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (fileIdMatch && fileIdMatch[1]) {
            return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
        }
    }
    
    return url;
}

// TARİH FORMATLAMA YARDIMCISI
function formatDate(timestamp) {
    if (!timestamp) return '';
    let date = null;
    if (typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
    } else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
    } else if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
    }
    if (!date) return '';
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
}

// BELGE ÖNİZLEME MODALI İŞLEMLERİ
window.openPreviewDocumentModal = function(title, rawLink, category) {
    const embedUrl = getEmbedUrl(rawLink);
    const modal = document.getElementById('preview-doc-modal');
    const titleEl = document.getElementById('preview-modal-title');
    const iframeEl = document.getElementById('preview-doc-iframe');
    const loaderEl = document.getElementById('preview-doc-loader');
    const catEl = document.getElementById('preview-modal-category');
    const extLinkEl = document.getElementById('preview-modal-external-link');

    if (titleEl) titleEl.innerText = title || "Belge Önizleme";
    if (catEl) catEl.innerText = category ? `Ders Kategorisi: ${category}` : "Sınav Belgesi";
    if (extLinkEl) extLinkEl.href = rawLink;

    // Show spinner loader, hide iframe until fully loaded
    if (loaderEl) loaderEl.classList.remove('hidden', 'opacity-0');
    if (iframeEl) {
        iframeEl.classList.add('opacity-0');
        iframeEl.src = embedUrl;
    }

    if (modal) modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

window.handleIframeLoaded = function() {
    const loaderEl = document.getElementById('preview-doc-loader');
    const iframeEl = document.getElementById('preview-doc-iframe');
    if (loaderEl) loaderEl.classList.add('opacity-0', 'hidden');
    if (iframeEl) iframeEl.classList.remove('opacity-0');
}

window.closePreviewDocumentModal = function() {
    const modal = document.getElementById('preview-doc-modal');
    const iframeEl = document.getElementById('preview-doc-iframe');
    const loaderEl = document.getElementById('preview-doc-loader');

    if (iframeEl) {
        iframeEl.src = '';
        iframeEl.classList.add('opacity-0');
    }
    if (loaderEl) loaderEl.classList.remove('hidden', 'opacity-0');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// BELGE DÜZENLEME MODALI İŞLEMLERİ (OWNER)
window.openEditDocumentModal = function(id) {
    const docItem = allExams.find(e => e.id === id);
    if (!docItem) return;

    document.getElementById('edit-doc-id').value = docItem.id;
    document.getElementById('edit-doc-title').value = docItem.title || '';
    document.getElementById('edit-doc-category').value = docItem.category || 'Mantık Devreleri';
    document.getElementById('edit-doc-link').value = docItem.fileUrl || docItem.link || '';
    document.getElementById('edit-doc-description').value = docItem.description || '';

    const modal = document.getElementById('edit-doc-modal');
    if (modal) modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

window.closeEditDocumentModal = function() {
    const modal = document.getElementById('edit-doc-modal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

window.handleEditDocument = async function(event) {
    event.preventDefault();

    const id = document.getElementById('edit-doc-id').value;
    const title = document.getElementById('edit-doc-title').value.trim();
    const category = document.getElementById('edit-doc-category').value;
    const link = document.getElementById('edit-doc-link').value.trim();
    const description = document.getElementById('edit-doc-description').value.trim();
    const btn = document.getElementById('btn-edit-doc');

    if (!id || !title || !category || !link || !description) {
        alert("Lütfen tüm alanları doldurun.");
        return;
    }

    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = "Kaydediliyor...";

    try {
        const targetDb = typeof db !== 'undefined' ? db : window.db;
        if (targetDb && targetDb.collection) {
            await targetDb.collection("exam_prep_resources").doc(id).update({
                title: title,
                category: category,
                fileUrl: link,
                link: link,
                description: description,
                status: "pending", // CRITICAL: Re-approval required!
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            closeEditDocumentModal();

            if (typeof showToast === 'function') {
                showToast("Belgeniz güncellendi! Değişikliklerin yayına alınması için tekrar admin onayı bekleniyor.", "info");
            } else {
                alert("Belgeniz güncellendi! Değişikliklerin yayına alınması için tekrar admin onayı bekleniyor.");
            }
        }
    } catch (error) {
        console.error("Belge güncelleme hatası:", error);
        alert("Güncelleme sırasında hata oluştu: " + error.message);
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

// SİLME İŞLEMLERİ (ADMIN & OWNER)
window.adminDeleteDocument = function(id) {
    const docItem = allExams.find(e => e.id === id);
    const title = docItem ? docItem.title : "Bu belge";
    if (!confirm(`"${title}" belgesini kalıcı olarak silmek istediğinize emin misiniz?`)) return;

    const targetDb = typeof db !== 'undefined' ? db : window.db;
    if (targetDb) {
        targetDb.collection("exam_prep_resources").doc(id).delete()
            .then(() => {
                if (typeof showToast === 'function') {
                    showToast("Belge başarıyla silindi.", "success");
                } else {
                    alert("Belge başarıyla silindi.");
                }
            })
            .catch(err => alert("Silme hatası: " + err.message));
    }
}

window.ownerDeleteDocument = function(id) {
    const docItem = allExams.find(e => e.id === id);
    const title = docItem ? docItem.title : "Bu belge";
    if (!confirm(`"${title}" belgenizi silmek istediğinize emin misiniz?`)) return;

    const targetDb = typeof db !== 'undefined' ? db : window.db;
    if (targetDb) {
        targetDb.collection("exam_prep_resources").doc(id).delete()
            .then(() => {
                if (typeof showToast === 'function') {
                    showToast("Belge başarıyla silindi.", "success");
                } else {
                    alert("Belge başarıyla silindi.");
                }
            })
            .catch(err => alert("Silme hatası: " + err.message));
    }
}

// BELGE EKLEME MODALI İŞLEMLERİ
window.openAddDocumentModal = function() {
    let user = null;
    if (typeof auth !== 'undefined' && auth) user = auth.currentUser;
    if (!user && typeof SSO !== 'undefined') user = SSO.getSSOUser();

    if (!user) {
        if (typeof openAuthModal === 'function') {
            openAuthModal();
        } else {
            alert("Belge ekleyebilmek için lütfen önce giriş yapın.");
        }
        return;
    }
    
    const modal = document.getElementById("add-doc-modal");
    if (modal) {
        modal.classList.remove("hidden");
        document.getElementById("add-doc-form").reset();
    }
    document.body.style.overflow = 'hidden';
}

window.closeAddDocumentModal = function() {
    const modal = document.getElementById("add-doc-modal");
    if (modal) modal.classList.add("hidden");
    document.body.style.overflow = 'auto';
}

// FORM GÖNDERİMİ & KAYIT
window.handleAddDocument = async function(event) {
    event.preventDefault();
    
    let user = null;
    if (typeof auth !== 'undefined' && auth) user = auth.currentUser;
    if (!user && typeof SSO !== 'undefined') user = SSO.getSSOUser();

    if (!user) {
        alert("Bu işlem için oturumunuzun aktif olması gerekiyor.");
        return;
    }

    const title = document.getElementById("doc-title").value.trim();
    const category = document.getElementById("doc-category").value;
    const link = document.getElementById("doc-link").value.trim();
    const description = document.getElementById("doc-description").value.trim();
    const legalConsent = document.getElementById("doc-legal-consent");
    const submitBtn = document.getElementById("btn-add-doc");

    if (!title || !category || !link || !description) {
        alert("Lütfen tüm zorunlu alanları doldurun.");
        return;
    }

    if (legalConsent && !legalConsent.checked) {
        alert("Lütfen yasal sorumluluk metnini onaylayın.");
        return;
    }

    const originalText = submitBtn.innerText;
    submitBtn.disabled = true;
    submitBtn.innerText = "Gönderiliyor...";

    try {
        const newDoc = {
            title: title,
            category: category,
            description: description,
            fileUrl: link,
            link: link,
            fileInfo: "Bağlantı Linki",
            addedBy: user.displayName || (user.email ? user.email.split('@')[0] : 'Öğrenci'),
            uid: user.uid,
            status: "pending", // Default pending admin approval
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        const targetDb = typeof db !== 'undefined' ? db : window.db;
        if (targetDb && targetDb.collection) {
            await targetDb.collection("exam_prep_resources").add(newDoc);
            closeAddDocumentModal();

            if (typeof showToast === 'function') {
                showToast("Bağlantınız başarıyla gönderildi! Admin onayladıktan sonra arşivde yayınlanacaktır.", "success");
            } else {
                alert("Bağlantınız başarıyla gönderildi! Admin onayladıktan sonra arşivde yayınlanacaktır.");
            }
        } else {
            alert("Veritabanı bağlantısı bulunamadı.");
        }
    } catch (error) {
        console.error("Belge kaydı sırasında hata:", error);
        alert("Bir hata oluştu: " + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = originalText;
    }
}

// LİSTELEME
function getCategoryColors(category) {
    if (category === "Mantık Devreleri") return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
    if (category === "Mikroişlemciler") return "bg-sky-500/10 text-sky-500 border-sky-500/20";
    if (category === "İşaretler & Sistemler") return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    if (category === "Devre Analizi") return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    return "bg-slate-500/10 text-slate-500 border-slate-500/20";
}

function renderExams() {
    const mainGrid = document.getElementById("exams-grid");
    const adminContainer = document.getElementById("admin-pending-container");
    const adminGrid = document.getElementById("admin-pending-grid");
    const adminCountLabel = document.getElementById("admin-pending-count");

    if (!mainGrid) return;
    
    mainGrid.innerHTML = "";
    if (adminGrid) adminGrid.innerHTML = "";
    
    const admin = typeof window.isAdmin === 'function' ? window.isAdmin() : false;

    let currentUser = null;
    if (typeof auth !== 'undefined' && auth) currentUser = auth.currentUser;
    if (!currentUser && typeof SSO !== 'undefined') currentUser = SSO.getSSOUser();

    // 1. ADMİN ONAY PANELİ (SADECE ADMİN İÇİN)
    const pendingExams = allExams.filter(e => e.status === 'pending');
    if (admin && adminContainer && adminGrid) {
        adminContainer.classList.remove("hidden");
        if (adminCountLabel) adminCountLabel.innerText = `${pendingExams.length} Bekleyen`;

        if (pendingExams.length === 0) {
            adminGrid.innerHTML = `<div class="col-span-full py-4 text-center text-xs text-amber-600 dark:text-amber-400 italic">Onay bekleyen belge bağlantısı bulunmuyor.</div>`;
        } else {
            pendingExams.forEach(docItem => {
                const colors = getCategoryColors(docItem.category);
                const targetUrl = docItem.fileUrl || docItem.link;
                const formattedDateStr = formatDate(docItem.createdAt || docItem.timestamp);
                const html = `
                    <div class="p-5 rounded-2xl border border-amber-500/40 bg-white dark:bg-slate-900 shadow-md flex flex-col justify-between space-y-3">
                        <div class="space-y-2">
                            <div class="flex items-center justify-between">
                                <span class="px-2 py-0.5 rounded-md ${colors} border text-[10px] font-bold">${docItem.category}</span>
                                <span class="text-[10px] text-amber-600 dark:text-amber-400 font-bold">Onay Bekliyor</span>
                            </div>
                            <h4 class="font-bold text-sm text-slate-900 dark:text-slate-100">${docItem.title}</h4>
                            <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">${docItem.description}</p>
                            <div class="text-[10px] text-slate-400">Ekleyen: <strong>${docItem.addedBy || 'Bilinmiyor'}</strong>${formattedDateStr ? ` • <span class="text-slate-400 dark:text-slate-500 font-normal">${formattedDateStr}</span>` : ''}</div>
                        </div>
                        <div class="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                            <div class="flex items-center justify-between text-xs mb-1">
                                <button onclick="openPreviewDocumentModal('${docItem.title.replace(/'/g, "\\'")}', '${targetUrl}', '${docItem.category}')" class="font-bold text-tsMavi text-[11px] hover:underline flex items-center gap-1">
                                    👁️ Önizle
                                </button>
                                <a href="${targetUrl}" target="_blank" rel="noopener noreferrer" class="font-bold text-slate-500 text-[11px] hover:underline">Linki Kontrol Et ↗</a>
                            </div>
                            <div class="flex gap-2">
                                <button onclick="approveResource('${docItem.id}')" class="flex-1 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm">✓ Onayla / Yayınla</button>
                                <button onclick="rejectResource('${docItem.id}')" class="flex-1 py-1.5 bg-rose-500 text-white rounded-lg text-xs font-bold hover:bg-rose-600 transition-colors shadow-sm">✕ Reddet / Sil</button>
                            </div>
                        </div>
                    </div>
                `;
                adminGrid.innerHTML += html;
            });
        }
    } else if (adminContainer) {
        adminContainer.classList.add("hidden");
    }

    // 2. HERKES İÇİN YAYINDAKİ (APPROVED) BELGELER
    const approvedExams = allExams.filter(e => e.status === 'approved');

    if (approvedExams.length === 0) {
        mainGrid.innerHTML = `
            <div class="col-span-full py-12 text-center text-slate-500">
                <div class="text-4xl mb-3">📄</div>
                <h3 class="text-lg font-bold text-slate-700 dark:text-slate-300">Henüz onaylanmış bir sınav belgesi bulunmuyor</h3>
                <p class="text-sm mt-1">İlk belgeyi siz ekleyin ve topluluğa destek olun!</p>
            </div>
        `;
        return;
    }

    approvedExams.forEach(docItem => {
        const colors = getCategoryColors(docItem.category);
        const targetUrl = docItem.fileUrl || docItem.link;
        const formattedDateStr = formatDate(docItem.createdAt || docItem.timestamp);

        let addedByHtml = "";
        if (docItem.addedBy && docItem.addedBy !== "Sistem") {
            addedByHtml = `<div class="mt-2 text-[10px] text-slate-400 font-medium">Ekleyen: ${docItem.addedBy}${formattedDateStr ? ` • <span class="text-slate-400 dark:text-slate-500 font-normal">${formattedDateStr}</span>` : ''}</div>`;
        } else if (formattedDateStr) {
            addedByHtml = `<div class="mt-2 text-[10px] text-slate-400 font-medium">Tarih: ${formattedDateStr}</div>`;
        }

        // Ownership & Admin Checks
        const isOwner = currentUser && (
            (currentUser.uid && currentUser.uid === docItem.uid) ||
            (docItem.addedBy && currentUser.displayName === docItem.addedBy) ||
            (currentUser.email && docItem.addedBy && currentUser.email.startsWith(docItem.addedBy))
        );

        let actionControlsHtml = "";
        if (isOwner) {
            actionControlsHtml = `
                <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <button onclick="openEditDocumentModal('${docItem.id}')" class="px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:text-white transition-all text-[11px] font-bold flex items-center gap-1">
                        ✏️ Düzenle
                    </button>
                    <button onclick="ownerDeleteDocument('${docItem.id}')" class="px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all text-[11px] font-bold flex items-center gap-1">
                        🗑️ Sil
                    </button>
                </div>
            `;
        } else if (admin) {
            actionControlsHtml = `
                <div class="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <button onclick="adminDeleteDocument('${docItem.id}')" class="px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all text-[11px] font-bold flex items-center gap-1">
                        🗑️ Sil (Admin)
                    </button>
                </div>
            `;
        }

        const html = `
            <div class="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-lg hover:border-tsMavi transition-all flex flex-col justify-between space-y-4">
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="px-2.5 py-1 rounded-lg ${colors} border text-xs font-bold">${docItem.category}</span>
                        ${isOwner ? `<span class="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold">Belgeniz</span>` : ''}
                    </div>
                    <div>
                        <h3 class="font-bold text-base text-slate-900 dark:text-slate-100">${docItem.title}</h3>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-3 leading-relaxed">${docItem.description}</p>
                        ${addedByHtml}
                    </div>
                </div>

                <div class="space-y-2">
                    <div class="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                        <span class="text-slate-400">${docItem.fileInfo || "Bağlantı Linki"}</span>
                        <button onclick="openPreviewDocumentModal('${docItem.title.replace(/'/g, "\\'")}', '${targetUrl}', '${docItem.category}')" class="font-bold text-tsMavi hover:underline flex items-center gap-1">
                            <span>İncele</span>
                            <span>↗</span>
                        </button>
                    </div>
                    ${actionControlsHtml}
                </div>
            </div>
        `;
        mainGrid.innerHTML += html;
    });
}

// ADMİN ONAY VE REDDETME (BİLDİRİM SİSTEMİ DAHİL)
window.approveResource = function(id) {
    const docItem = allExams.find(e => e.id === id);
    const docTitle = docItem ? docItem.title : "Belge";
    
    if (!confirm(`"${docTitle}" başlıklı belge bağlantısını onaylayıp yayınlamak istediğinize emin misiniz?`)) return;
    
    const targetDb = typeof db !== 'undefined' ? db : window.db;
    if (targetDb) {
        targetDb.collection("exam_prep_resources").doc(id).update({ status: 'approved' })
            .then(() => {
                // Bildirim Gönder (Firestore notifications collection)
                if (docItem && docItem.uid) {
                    targetDb.collection("notifications").add({
                        targetUserUid: docItem.uid,
                        userId: docItem.uid,
                        message: `'${docTitle}' başlıklı belgeniz onaylandı ve yayında!`,
                        read: false,
                        status: "unread",
                        type: "doc_approved",
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    }).catch(err => console.warn("Bildirim eklenemedi:", err));
                }

                if (typeof showToast === 'function') {
                    showToast("Belge bağlantısı onaylandı ve kullanıcıya bildirim gönderildi!", "success");
                } else {
                    alert("Belge bağlantısı onaylandı ve yayınlandı!");
                }
            })
            .catch(err => alert("Hata: " + err.message));
    }
};

window.rejectResource = function(id) {
    if (!confirm("Bu belge bağlantısını reddetmek ve silmek istediğinize emin misiniz?")) return;
    const targetDb = typeof db !== 'undefined' ? db : window.db;
    if (targetDb) {
        targetDb.collection("exam_prep_resources").doc(id).delete()
            .then(() => {
                if (typeof showToast === 'function') showToast("Belge bağlantısı reddedildi ve silindi.", "info");
            })
            .catch(err => alert("Hata: " + err.message));
    }
};

function loadResources() {
    const targetDb = typeof db !== 'undefined' ? db : window.db;
    if (!targetDb) {
        console.warn("Firestore db is not initialized yet.");
        allExams = [];
        renderExams();
        return;
    }

    targetDb.collection("exam_prep_resources")
        .orderBy("timestamp", "desc")
        .onSnapshot((snapshot) => {
            allExams = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                allExams.push({
                    id: doc.id,
                    title: data.title,
                    category: data.category,
                    description: data.description,
                    fileInfo: data.fileInfo || "Bağlantı Linki",
                    fileUrl: data.fileUrl || data.link,
                    link: data.link || data.fileUrl,
                    addedBy: data.addedBy,
                    uid: data.uid,
                    status: data.status || 'approved',
                    createdAt: data.createdAt || data.timestamp,
                    timestamp: data.timestamp ? data.timestamp.toMillis() : Date.now()
                });
            });

            renderExams();
        }, (error) => {
            console.error("Kaynakları çekerken hata:", error);
            renderExams();
        });
}

// DOM Yüklendiğinde Başlat
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(loadResources, 400);
});
