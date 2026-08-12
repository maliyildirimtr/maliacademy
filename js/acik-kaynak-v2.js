const DEFAULT_KITS = [
    {
        title: "32-Bit RV32I RISC-V İşlemci Çekirdeği Kiti",
        category: "SystemVerilog",
        version: "v1.4",
        categoryColor: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
        description: "5 aşamalı boru hattı (Pipeline) mimarisine sahip açık kaynak SystemVerilog çekirdeği. Vivado & ModelSim testbench simülasyon kodları içerir.",
        command: "git clone https://github.com/maliyildirimtr/riscv-sv.git",
        license: "MIT Lisansı",
        link: "https://github.com/maliyildirimtr",
        authorName: "Mali Academy"
    },
    {
        title: "STM32F4 Gerçek Zamanlı Gömülü Şablon Kit",
        category: "STM32 & FreeRTOS",
        version: "v2.0",
        categoryColor: "bg-sky-500/10 text-sky-500 border-sky-500/20",
        description: "Task senkronizasyon mekanizmaları, Kuyruk (Queue) ve Semaför konfigürasyonu tamamlanmış hazır STM32CubeIDE başlangıç kiti.",
        command: "git clone https://github.com/maliyildirimtr/stm32-freertos.git",
        license: "Apache 2.0",
        link: "https://github.com/maliyildirimtr",
        authorName: "Mali Academy"
    },
    {
        title: "İşaret İşleme & Filtre Tasarım Kütüphanesi",
        category: "Python DSP",
        version: "v1.1",
        categoryColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        description: "SciPy ve NumPy tabanlı FIR/IIR dijital filtre tasarım aracı, FFT spektrum analizi ve Kalman filtresi uygulama kütüphanesi.",
        command: "pip install mali-dsp-toolkit",
        license: "MIT Lisansı",
        link: "https://github.com/maliyildirimtr",
        authorName: "Mali Academy"
    }
];

let dynamicResources = [];

document.addEventListener('DOMContentLoaded', () => {
    loadResources();
});

function loadResources() {
    if (typeof db !== 'undefined' && db && db.collection) {
        db.collection("open_source_resources").orderBy("createdAt", "desc").onSnapshot(snapshot => {
            dynamicResources = [];
            if (!snapshot.empty) {
                snapshot.forEach(doc => {
                    dynamicResources.push({ id: doc.id, ...doc.data() });
                });
            }
            renderKits();
        }, error => {
            console.error("Kaynaklar yüklenirken hata oluştu:", error);
            renderKits();
        });
    } else {
        renderKits();
    }
}

function getCategoryColor(category) {
    const cat = (category || '').toLowerCase();
    if (cat.includes('yazılım') || cat.includes('software')) return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    if (cat.includes('donanım') || cat.includes('hardware')) return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    if (cat.includes('veri') || cat.includes('data')) return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    if (cat.includes('yapay zeka') || cat.includes('ai')) return "bg-purple-500/10 text-purple-500 border-purple-500/20";
    return "bg-slate-500/10 text-slate-500 border-slate-500/20";
}

function renderKits() {
    const grid = document.getElementById('kit-cards-grid');
    if (!grid) return;

    let html = "";
    
    // Varsayılan kitleri render et
    DEFAULT_KITS.forEach(kit => {
        html += createKitCard(kit);
    });

    // Kullanıcıların eklediği dinamik kitleri render et
    dynamicResources.forEach(res => {
        const kitData = {
            title: res.title,
            category: res.category,
            version: res.version || "v1.0",
            categoryColor: getCategoryColor(res.category),
            description: res.description,
            command: res.link,
            license: res.isBase64 ? "Yerel Belge" : (res.license || "Kullanıcı Kaynağı"),
            link: res.link,
            authorName: res.authorName || "Anonim"
        };
        html += createKitCard(kitData);
    });

    grid.innerHTML = html;
}

function createKitCard(kit) {
    return `
        <div class="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-lg hover:border-tsMavi transition-all flex flex-col justify-between space-y-4">
            <div class="space-y-3">
                <div class="flex items-center justify-between">
                    <span class="px-2.5 py-1 rounded-lg ${kit.categoryColor} border text-xs font-bold">${kit.category}</span>
                    <span class="text-xs text-slate-400 font-mono">${kit.version}</span>
                </div>
                <div>
                    <h3 class="font-bold text-base text-slate-900 dark:text-slate-100">${kit.title}</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-3 leading-relaxed">${kit.description}</p>
                </div>
                <div class="p-3 rounded-xl bg-slate-100 dark:bg-slate-950 font-mono text-[11px] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 break-all select-all overflow-x-auto whitespace-pre-wrap flex items-center justify-between group cursor-pointer" onclick="navigator.clipboard.writeText('${kit.command}')">
                    <span class="truncate max-w-[200px]">${kit.command}</span>
                    <span class="opacity-0 group-hover:opacity-100 transition-opacity text-tsMavi" title="Kopyala">📋</span>
                </div>
            </div>
            
            <div class="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <div class="flex flex-col">
                    <span class="text-slate-400 font-mono">${kit.license}</span>
                    ${kit.authorName ? `<span class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Ekleyen: <strong class="text-slate-700 dark:text-slate-300">${kit.authorName}</strong></span>` : ''}
                </div>
                <a href="${kit.link}" target="_blank" rel="noopener noreferrer" class="font-bold text-tsMavi hover:underline">İncele / İndir ↗</a>
            </div>
        </div>
    `;
}

// BASE64 FALLBACK YARDIMCI FONKSİYONU
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

// Modal Fonksiyonları
window.toggleResourceUploadType = function() {
    const uploadTypeSelect = document.getElementById("res-upload-type");
    const uploadType = uploadTypeSelect ? uploadTypeSelect.value : 'file';
    const fileContainer = document.getElementById("res-file-container");
    const linkContainer = document.getElementById("res-link-container");
    const fileInput = document.getElementById("res-file");
    const linkInput = document.getElementById("res-link");

    if (uploadType === "file") {
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

    const progressContainer = document.getElementById("res-upload-progress-container");
    if (progressContainer) progressContainer.classList.add("hidden");
}

window.openAddResourceModal = function() {
    let user = null;
    if (typeof auth !== 'undefined' && auth) user = auth.currentUser;
    if (!user && typeof SSO !== 'undefined') user = SSO.getSSOUser();
    
    if (!user) {
        if (typeof openAuthModal === 'function') {
            openAuthModal();
        } else {
            alert("Bu işlemi gerçekleştirmek için lütfen giriş yapın veya kayıt olun.");
        }
        return;
    }
    
    const modal = document.getElementById('add-resource-modal');
    if (modal) {
        modal.classList.remove('hidden');
        const form = document.getElementById('add-resource-form');
        if (form) form.reset();
        if (typeof window.toggleResourceUploadType === 'function') window.toggleResourceUploadType();
    }
}

window.closeAddResourceModal = function() {
    const modal = document.getElementById('add-resource-modal');
    if (modal) modal.classList.add('hidden');
    const form = document.getElementById('add-resource-form');
    if (form) form.reset();
}

window.handleAddResource = async function(event) {
    event.preventDefault();

    let user = null;
    if (typeof auth !== 'undefined' && auth) user = auth.currentUser;
    if (!user && typeof SSO !== 'undefined') user = SSO.getSSOUser();
    
    if (!user) {
        alert("Lütfen giriş yapın.");
        return;
    }

    const title = document.getElementById('res-title').value.trim();
    const category = document.getElementById('res-category').value;
    const description = document.getElementById('res-description').value.trim();
    const uploadTypeSelect = document.getElementById('res-upload-type');
    const uploadType = uploadTypeSelect ? uploadTypeSelect.value : 'link';
    const legalConsent = document.getElementById('res-legal-consent');
    const btn = document.getElementById('btn-add-resource');

    if (!title || !category || !description) {
        alert("Lütfen tüm zorunlu alanları doldurun.");
        return;
    }

    if (legalConsent && !legalConsent.checked) {
        alert("Lütfen yasal sorumluluk metnini onaylayın.");
        return;
    }

    const originalText = btn.innerHTML;
    btn.innerHTML = `Yükleniyor...`;
    btn.disabled = true;

    try {
        let finalLink = "";
        let isBase64 = false;
        let finalVersion = "v1.0";

        if (uploadType === "file") {
            const fileInput = document.getElementById("res-file");
            const file = fileInput ? fileInput.files[0] : null;
            if (!file) {
                alert("Lütfen bir dosya seçin.");
                return;
            }

            const progressContainer = document.getElementById("res-upload-progress-container");
            const progressBar = document.getElementById("res-upload-progress-bar");
            const progressText = document.getElementById("res-upload-progress-text");
            if (progressContainer) progressContainer.classList.remove("hidden");

            const uploadResult = await uploadFileOrFallback(file, 'acik_kaynak_dosyalari', user.uid, (progress) => {
                if (progressBar) progressBar.style.width = progress + '%';
                if (progressText) progressText.innerText = progress + '%';
            });

            finalLink = uploadResult.link;
            isBase64 = uploadResult.isBase64;
        } else {
            finalLink = document.getElementById("res-link").value.trim();
            if (!finalLink) {
                alert("Lütfen geçerli bir bağlantı adresi girin.");
                return;
            }
        }

        const newResource = {
            title,
            category,
            description,
            link: finalLink,
            isBase64: isBase64,
            version: finalVersion,
            authorUid: user.uid,
            authorName: user.displayName || (user.email ? user.email.split('@')[0] : 'Geliştirici'),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (typeof db !== 'undefined' && db && db.collection) {
            await db.collection("open_source_resources").add(newResource);
            alert("Kaynak başarıyla eklendi!");
            closeAddResourceModal();
        } else {
            alert("Veritabanı bağlantısı kurulamadı.");
        }
    } catch (error) {
        console.error("Kaynak ekleme hatası:", error);
        alert("Dosya yükleme hatası: " + error.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}
