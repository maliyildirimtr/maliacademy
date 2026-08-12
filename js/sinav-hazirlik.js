// ==========================================
// SINAV & VİZE HAZIRLIK - DİNAMİK LİSTELEME VE YÜKLEME
// ==========================================


let dynamicExams = [];
let allExams = [];

// MODAL İŞLEMLERİ
function openAddDocumentModal() {
    const user = window.auth ? window.auth.currentUser : null;
    if (!user) {
        alert("Belge ekleyebilmek için lütfen önce giriş yapın.");
        window.location.href = "login.html";
        return;
    }
    
    document.getElementById("add-doc-modal").classList.remove("hidden");
    document.getElementById("add-doc-form").reset();
    toggleUploadType(); // reset inputs
    
    // reset progress
    document.getElementById("upload-progress-container").classList.add("hidden");
    document.getElementById("upload-progress-bar").style.width = "0%";
    document.getElementById("upload-progress-text").innerText = "0%";
    
    document.body.style.overflow = 'hidden';
}

function closeAddDocumentModal() {
    document.getElementById("add-doc-modal").classList.add("hidden");
    document.body.style.overflow = 'auto';
}

function toggleUploadType() {
    const type = document.getElementById("doc-upload-type").value;
    const fileContainer = document.getElementById("file-upload-container");
    const linkContainer = document.getElementById("link-upload-container");
    const fileInput = document.getElementById("doc-file");
    const linkInput = document.getElementById("doc-link");

    if (type === "file") {
        fileContainer.classList.remove("hidden");
        linkContainer.classList.add("hidden");
        fileInput.required = true;
        linkInput.required = false;
    } else {
        fileContainer.classList.add("hidden");
        linkContainer.classList.remove("hidden");
        fileInput.required = false;
        linkInput.required = true;
    }
}

// FORM GÖNDERİMİ
async function handleAddDocument(event) {
    event.preventDefault();
    
    let user = null;
    if (typeof auth !== 'undefined' && auth) user = auth.currentUser;
    if (!user) {
        alert("Bu işlem için Firebase oturumunuzun aktif olması gerekiyor. Sayfayı yenileyip giriş yaptığınızdan emin olun.");
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

    submitBtn.disabled = true;
    submitBtn.innerText = "Ekleniyor...";

    try {
        let finalLink = "";
        let finalFileInfo = "Link";

        if (uploadType === "file") {
            const fileInput = document.getElementById("doc-file");
            const file = fileInput.files[0];
            
            if (!file) {
                alert("Lütfen bir dosya seçin.");
                submitBtn.disabled = false;
                submitBtn.innerText = "Belgeyi Ekle";
                return;
            }

            // Boyut kontrolü (15MB)
            if (file.size > 15 * 1024 * 1024) {
                alert("Dosya boyutu 15 MB'tan büyük olamaz. Lütfen 'Harici Link' seçeneğini kullanarak Drive vb. bir link ekleyin.");
                submitBtn.disabled = false;
                submitBtn.innerText = "Belgeyi Ekle";
                return;
            }

            // Dosya uzantısı belirleme (PDF, vs.)
            const ext = file.name.split('.').pop().toUpperCase();
            const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
            finalFileInfo = `${ext} • ${sizeMB} MB`;

            // Storage'a Yükleme İşlemi
            const storageRef = firebase.storage().ref();
            const fileRef = storageRef.child(`sinav_belgeleri/${user.uid}/${Date.now()}_${file.name}`);
            
            const uploadTask = fileRef.put(file);
            
            // Progress Bar Göster
            const progressContainer = document.getElementById("upload-progress-container");
            const progressBar = document.getElementById("upload-progress-bar");
            const progressText = document.getElementById("upload-progress-text");
            progressContainer.classList.remove("hidden");

            await new Promise((resolve, reject) => {
                uploadTask.on('state_changed', 
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        progressBar.style.width = progress + '%';
                        progressText.innerText = Math.round(progress) + '%';
                    }, 
                    (error) => {
                        console.error("Yükleme Hatası:", error);
                        reject(error);
                    }, 
                    async () => {
                        finalLink = await uploadTask.snapshot.ref.getDownloadURL();
                        resolve();
                    }
                );
            });

        } else {
            // URL Link
            finalLink = document.getElementById("doc-link").value.trim();
            finalFileInfo = "Harici Link";
        }

        // Firestore'a Kaydetme
        await window.db.collection("exam_prep_resources").add({
            title: title,
            category: category,
            description: description,
            fileInfo: finalFileInfo,
            link: finalLink,
            addedBy: user.displayName || (user.email ? user.email.split('@')[0] : 'Öğrenci'),
            uid: user.uid,
            status: "pending", // Admin onayı bekliyor
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert("Belge başarıyla eklendi! Yönetici onayından sonra herkese açık olarak listelenecektir.");
        closeAddDocumentModal();

    } catch (error) {
        console.error("Belge eklenirken hata oluştu:", error);
        alert("Bir hata oluştu: " + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "Belgeyi Ekle";
    }
}

// LİSTELEME
function getCategoryColors(category) {
    if (category === "Mantık Devreleri") return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
    if (category === "Mikroişlemciler") return "bg-sky-500/10 text-sky-500 border-sky-500/20";
    if (category === "İşaretler & Sistemler") return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    if (category === "Devre Analizi") return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    return "bg-slate-500/10 text-slate-500 border-slate-500/20"; // Diğer
}

function renderExams() {
    const grid = document.getElementById("exams-grid");
    if (!grid) return;
    
    grid.innerHTML = "";
    
    const currentUser = (typeof auth !== 'undefined' && auth) ? auth.currentUser : null;
    const admin = typeof window.isAdmin === 'function' ? window.isAdmin() : false;

    if (allExams.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-12 text-center text-slate-500">
                <div class="text-4xl mb-3">📄</div>
                <h3 class="text-lg font-bold text-slate-700 dark:text-slate-300">Henüz bir sınav belgesi bulunmuyor</h3>
                <p class="text-sm mt-1">İlk belgeyi siz ekleyin ve topluluğa destek olun!</p>
            </div>
        `;
        return;
    }

    allExams.forEach(docItem => {
        // Görünürlük Kuralı: Onaylı belgeler VEYA ekleyen kişinin kendisi VEYA Admin
        if (docItem.status === 'approved' || (currentUser && docItem.uid === currentUser.uid) || admin) {
            const colors = getCategoryColors(docItem.category);
            
            let statusBadge = "";
            if (docItem.status === 'pending') {
                statusBadge = `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">Onay Bekliyor</span>`;
            }

            let adminControls = "";
            if (admin && docItem.status === 'pending') {
                adminControls = `
                    <div class="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                        <button onclick="approveResource('${docItem.id}')" class="flex-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors">Onayla</button>
                        <button onclick="rejectResource('${docItem.id}')" class="flex-1 px-3 py-1.5 bg-rose-500 text-white rounded-lg text-xs font-bold hover:bg-rose-600 transition-colors">Reddet / Sil</button>
                    </div>
                `;
            }

            let addedByHtml = "";
            if (docItem.addedBy && docItem.addedBy !== "Sistem") {
                addedByHtml = `<div class="mt-2 text-[10px] text-slate-400 font-medium flex items-center gap-1 justify-between">
                    <span>Ekleyen: ${docItem.addedBy}</span>
                    ${statusBadge}
                </div>`;
            } else if (statusBadge) {
                addedByHtml = `<div class="mt-2 text-[10px] flex items-center justify-end">${statusBadge}</div>`;
            }

            const html = `
                <div class="p-6 rounded-3xl border ${docItem.status === 'pending' ? 'border-amber-500/40 border-dashed' : 'border-slate-200 dark:border-slate-800'} bg-white dark:bg-slate-900/60 shadow-lg hover:border-tsMavi transition-all flex flex-col justify-between space-y-4 relative">
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

                    <div>
                        <div class="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                            <span class="text-slate-400">${docItem.fileInfo}</span>
                            <a href="${docItem.link}" ${docItem.link.startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : ''} class="font-bold text-tsMavi hover:underline">İncele →</a>
                        </div>
                        ${adminControls}
                    </div>
                </div>
            `;
            grid.innerHTML += html;
        }
    });
}

window.approveResource = function(id) {
    if (!confirm("Bu belgeyi onaylamak istediğinize emin misiniz?")) return;
    if (window.db) {
        window.db.collection("exam_prep_resources").doc(id).update({ status: 'approved' })
            .catch(err => alert("Hata: " + err.message));
    }
};

window.rejectResource = function(id) {
    if (!confirm("Bu belgeyi reddetmek ve silmek istediğinize emin misiniz?")) return;
    if (window.db) {
        window.db.collection("exam_prep_resources").doc(id).delete()
            .catch(err => alert("Hata: " + err.message));
    }
};

function loadResources() {
    if (!window.db) {
        console.warn("Firestore db is not initialized yet.");
        allExams = [];
        renderExams();
        return;
    }

    window.db.collection("exam_prep_resources")
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
                    status: data.status || 'approved', // Eski veriler varsa onaylı varsay
                    timestamp: data.timestamp ? data.timestamp.toMillis() : Date.now()
                });
            });

            renderExams();
        }, (error) => {
            console.error("Kaynakları çekerken hata:", error);
            renderExams();
        });
}

// Firebase SDK yüklenmesini bekle ve başlat
document.addEventListener('DOMContentLoaded', () => {
    // Sayfa DOM yüklendi, ancak firebase.js içerisindeki window.db ne zaman hazır olacak?
    // main.js vb dosyalar senkron çalışıyor, ancak firebase init bir miktar gecikebilir. 
    // Garanti altına almak için küçük bir gecikme ekliyoruz veya direkt çağırıyoruz.
    setTimeout(loadResources, 500);
});
