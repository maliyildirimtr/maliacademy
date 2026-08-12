// ==========================================
// SINAV & VİZE HAZIRLIK - DİNAMİK LİSTELEME VE YÜKLEME
// ==========================================

let allExams = [];

function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
}

async function uploadFileOrFallback(file, folderName, userUid, onProgress) {
    const storageObj = (typeof firebase !== 'undefined' && typeof firebase.storage === 'function') ? firebase.storage() : (window.storage || null);

    if (storageObj) {
        try {
            const storageRef = storageObj.ref();
            const fileRef = storageRef.child(`${folderName}/${userUid}/${Date.now()}_${file.name}`);
            const uploadTask = fileRef.put(file);

            const uploadPromise = new Promise((resolve, reject) => {
                let bytesMoved = false;
                const timeoutId = setTimeout(() => {
                    if (!bytesMoved) {
                        try { uploadTask.cancel(); } catch (e) {}
                        reject(new Error("CORS_TIMEOUT"));
                    }
                }, 6000);

                uploadTask.on('state_changed',
                    (snapshot) => {
                        if (snapshot.bytesTransferred > 0) bytesMoved = true;
                        if (snapshot.totalBytes > 0 && onProgress) {
                            onProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
                        }
                    },
                    (err) => {
                        clearTimeout(timeoutId);
                        reject(err);
                    },
                    () => {
                        clearTimeout(timeoutId);
                        uploadTask.snapshot.ref.getDownloadURL()
                            .then(url => resolve(url))
                            .catch(err => reject(err));
                    }
                );
            });

            const downloadUrl = await uploadPromise;
            return { link: downloadUrl, isBase64: false };
        } catch (storageErr) {
            console.warn("Storage yuklemesi basarisiz (CORS/Ağ). Base64 yedek sistemine geciliyor:", storageErr);
        }
    }

    if (file.size <= 2 * 1024 * 1024) {
        if (onProgress) onProgress(100);
        const base64 = await readFileAsBase64(file);
        return { link: base64, isBase64: true };
    } else {
        throw new Error("Storage CORS/Ağ engeli nedeniyle 2MB üzeri dosya yüklenemedi. Lütfen 'Harici Link' (Google Drive / GitHub) seçeneğini kullanın.");
    }
}

// MODAL İŞLEMLERİ
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
        toggleUploadType();
        
        const progressContainer = document.getElementById("upload-progress-container");
        const progressBar = document.getElementById("upload-progress-bar");
        const progressText = document.getElementById("upload-progress-text");
        if (progressContainer) progressContainer.classList.add("hidden");
        if (progressBar) progressBar.style.width = "0%";
        if (progressText) progressText.innerText = "0%";
    }
    document.body.style.overflow = 'hidden';
}

window.closeAddDocumentModal = function() {
    const modal = document.getElementById("add-doc-modal");
    if (modal) modal.classList.add("hidden");
    document.body.style.overflow = 'auto';
}

window.toggleUploadType = function() {
    const typeSelect = document.getElementById("doc-upload-type");
    const type = typeSelect ? typeSelect.value : 'file';
    const fileContainer = document.getElementById("file-upload-container");
    const linkContainer = document.getElementById("link-upload-container");
    const fileInput = document.getElementById("doc-file");
    const linkInput = document.getElementById("doc-link");

    if (type === "file") {
        if (fileContainer) fileContainer.classList.remove("hidden");
        if (linkContainer) linkContainer.classList.add("hidden");
        if (fileInput) fileInput.required = true;
        if (linkInput) linkInput.required = false;
    } else {
        if (fileContainer) fileContainer.classList.add("hidden");
        if (linkContainer) linkContainer.classList.remove("hidden");
        if (fileInput) fileInput.required = false;
        if (linkInput) linkInput.required = true;
    }
}

// FORM GÖNDERİMİ & YÜKLEME
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
    const description = document.getElementById("doc-description").value.trim();
    const uploadType = document.getElementById("doc-upload-type").value;
    const legalConsent = document.getElementById("doc-legal-consent");
    const submitBtn = document.getElementById("btn-add-doc");

    if (!title || !category || !description) {
        alert("Lütfen zorunlu alanları doldurun.");
        return;
    }

    if (legalConsent && !legalConsent.checked) {
        alert("Lütfen yasal sorumluluk metnini onaylayın.");
        return;
    }

    const originalText = submitBtn.innerText;
    submitBtn.disabled = true;
    submitBtn.innerText = "Ekleniyor...";

    try {
        let finalLink = "";
        let isBase64 = false;
        let finalFileInfo = "Link";

        if (uploadType === "file") {
            const fileInput = document.getElementById("doc-file");
            const file = fileInput ? fileInput.files[0] : null;
            
            if (!file) {
                alert("Lütfen bir dosya seçin.");
                return;
            }

            const ext = file.name.split('.').pop().toUpperCase();
            const sizeMB = (file.size / (1024 * 1024)).toFixed(1);

            const progressContainer = document.getElementById("upload-progress-container");
            const progressBar = document.getElementById("upload-progress-bar");
            const progressText = document.getElementById("upload-progress-text");
            if (progressContainer) progressContainer.classList.remove("hidden");

            const uploadResult = await uploadFileOrFallback(file, 'sinav_belgeleri', user.uid, (progress) => {
                if (progressBar) progressBar.style.width = progress + '%';
                if (progressText) progressText.innerText = progress + '%';
            });

            finalLink = uploadResult.link;
            isBase64 = uploadResult.isBase64;
            finalFileInfo = `${ext} • ${sizeMB} MB ${isBase64 ? '(Yerel Veri)' : ''}`;

        } else {
            finalLink = document.getElementById("doc-link").value.trim();
            finalFileInfo = "Harici Link";
            if (!finalLink) {
                alert("Lütfen geçerli bir bağlantı adresi girin.");
                return;
            }
        }

        // Firestore'a Kaydetme (status: pending)
        if (typeof db !== 'undefined' && db && db.collection) {
            await db.collection("exam_prep_resources").add({
                title: title,
                category: category,
                description: description,
                fileInfo: finalFileInfo,
                link: finalLink,
                isBase64: isBase64,
                addedBy: user.displayName || (user.email ? user.email.split('@')[0] : 'Öğrenci'),
                uid: user.uid,
                status: "pending", // Admin onayı bekliyor
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            closeAddDocumentModal();

            if (typeof showToast === 'function') {
                showToast("Belgeniz başarıyla gönderildi! Admin onayladıktan sonra arşivde yayınlanacaktır.", "success");
            } else {
                alert("Belgeniz başarıyla gönderildi! Admin onayladıktan sonra arşivde yayınlanacaktır.");
            }
        } else {
            alert("Veritabanı bağlantısı bulunamadı.");
        }

    } catch (error) {
        console.error("Belge eklenirken hata oluştu:", error);
        alert("Dosya yükleme hatası: " + error.message);
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

    // 1. ADMİN PANELİ YÖNETİMİ
    const pendingExams = allExams.filter(e => e.status === 'pending');
    if (admin && adminContainer && adminGrid) {
        adminContainer.classList.remove("hidden");
        if (adminCountLabel) adminCountLabel.innerText = `${pendingExams.length} Bekleyen`;

        if (pendingExams.length === 0) {
            adminGrid.innerHTML = `<div class="col-span-full py-4 text-center text-xs text-amber-600 dark:text-amber-400 italic">Onay bekleyen belge bulunmuyor.</div>`;
        } else {
            pendingExams.forEach(docItem => {
                const colors = getCategoryColors(docItem.category);
                const html = `
                    <div class="p-5 rounded-2xl border border-amber-500/40 bg-white dark:bg-slate-900 shadow-md flex flex-col justify-between space-y-3">
                        <div class="space-y-2">
                            <div class="flex items-center justify-between">
                                <span class="px-2 py-0.5 rounded-md ${colors} border text-[10px] font-bold">${docItem.category}</span>
                                <span class="text-[10px] text-amber-600 dark:text-amber-400 font-bold">Onay Bekliyor</span>
                            </div>
                            <h4 class="font-bold text-sm text-slate-900 dark:text-slate-100">${docItem.title}</h4>
                            <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">${docItem.description}</p>
                            <div class="text-[10px] text-slate-400">Ekleyen: <strong>${docItem.addedBy || 'Bilinmiyor'}</strong></div>
                        </div>
                        <div class="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                            <div class="flex items-center justify-between text-xs mb-1">
                                <span class="text-slate-400 text-[10px]">${docItem.fileInfo}</span>
                                <a href="${docItem.link}" target="_blank" rel="noopener noreferrer" class="font-bold text-tsMavi text-[11px] hover:underline">İncele / İndir ↗</a>
                            </div>
                            <div class="flex gap-2">
                                <button onclick="approveResource('${docItem.id}')" class="flex-1 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm">✓ Yayınla / Onayla</button>
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
        
        let addedByHtml = "";
        if (docItem.addedBy && docItem.addedBy !== "Sistem") {
            addedByHtml = `<div class="mt-2 text-[10px] text-slate-400 font-medium">Ekleyen: ${docItem.addedBy}</div>`;
        }

        const html = `
            <div class="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-lg hover:border-tsMavi transition-all flex flex-col justify-between space-y-4">
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="px-2.5 py-1 rounded-lg ${colors} border text-xs font-bold">${docItem.category}</span>
                    </div>
                    <div>
                        <h3 class="font-bold text-base text-slate-900 dark:text-slate-100">${docItem.title}</h3>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-3 leading-relaxed">${docItem.description}</p>
                        ${addedByHtml}
                    </div>
                </div>

                <div class="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <span class="text-slate-400">${docItem.fileInfo}</span>
                    <a href="${docItem.link}" ${docItem.link.startsWith('http') || docItem.link.startsWith('data:') ? 'target="_blank" rel="noopener noreferrer"' : ''} class="font-bold text-tsMavi hover:underline">İncele / İndir →</a>
                </div>
            </div>
        `;
        mainGrid.innerHTML += html;
    });
}

window.approveResource = function(id) {
    if (!confirm("Bu belgeyi onaylayıp yayınlamak istediğinize emin misiniz?")) return;
    if (typeof db !== 'undefined' && db) {
        db.collection("exam_prep_resources").doc(id).update({ status: 'approved' })
            .then(() => {
                if (typeof showToast === 'function') showToast("Belge onaylandı ve yayınlandı!", "success");
            })
            .catch(err => alert("Hata: " + err.message));
    }
};

window.rejectResource = function(id) {
    if (!confirm("Bu belgeyi reddetmek ve silmek istediğinize emin misiniz?")) return;
    if (typeof db !== 'undefined' && db) {
        db.collection("exam_prep_resources").doc(id).delete()
            .then(() => {
                if (typeof showToast === 'function') showToast("Belge reddedildi ve silindi.", "info");
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
                    fileInfo: data.fileInfo || "Belge",
                    link: data.link,
                    addedBy: data.addedBy,
                    uid: data.uid,
                    status: data.status || 'approved',
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
