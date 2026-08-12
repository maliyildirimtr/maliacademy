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
        authorName: "Mali Academy",
        status: "approved"
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
        authorName: "Mali Academy",
        status: "approved"
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
        authorName: "Mali Academy",
        status: "approved"
    }
];

let dynamicResources = [];

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(loadResources, 400);
});

function loadResources() {
    const targetDb = typeof db !== 'undefined' ? db : window.db;
    if (targetDb && targetDb.collection) {
        targetDb.collection("open_source_resources").orderBy("createdAt", "desc").onSnapshot(snapshot => {
            dynamicResources = [];
            if (!snapshot.empty) {
                snapshot.forEach(doc => {
                    const data = doc.data();
                    dynamicResources.push({
                        id: doc.id,
                        title: data.title,
                        category: data.category,
                        description: data.description,
                        link: data.fileUrl || data.link,
                        version: data.version || "v1.0",
                        authorName: data.authorName || "Anonim",
                        authorUid: data.authorUid,
                        status: data.status || "approved"
                    });
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
    const mainGrid = document.getElementById('kit-cards-grid');
    const adminContainer = document.getElementById("admin-pending-container");
    const adminGrid = document.getElementById("admin-pending-grid");
    const adminCountLabel = document.getElementById("admin-pending-count");

    if (!mainGrid) return;
    if (adminGrid) adminGrid.innerHTML = "";

    const admin = typeof window.isAdmin === 'function' ? window.isAdmin() : false;

    // 1. ADMİN ONAY PANELİ (SADECE ADMİN İÇİN)
    const pendingKits = dynamicResources.filter(r => r.status === 'pending');
    if (admin && adminContainer && adminGrid) {
        adminContainer.classList.remove("hidden");
        if (adminCountLabel) adminCountLabel.innerText = `${pendingKits.length} Bekleyen`;

        if (pendingKits.length === 0) {
            adminGrid.innerHTML = `<div class="col-span-full py-4 text-center text-xs text-amber-600 dark:text-amber-400 italic">Onay bekleyen kaynak bağlantısı bulunmuyor.</div>`;
        } else {
            pendingKits.forEach(kit => {
                const colors = getCategoryColor(kit.category);
                const html = `
                    <div class="p-5 rounded-2xl border border-amber-500/40 bg-white dark:bg-slate-900 shadow-md flex flex-col justify-between space-y-3">
                        <div class="space-y-2">
                            <div class="flex items-center justify-between">
                                <span class="px-2 py-0.5 rounded-md ${colors} border text-[10px] font-bold">${kit.category}</span>
                                <span class="text-[10px] text-amber-600 dark:text-amber-400 font-bold">Onay Bekliyor</span>
                            </div>
                            <h4 class="font-bold text-sm text-slate-900 dark:text-slate-100">${kit.title}</h4>
                            <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">${kit.description}</p>
                            <div class="text-[10px] text-slate-400">Ekleyen: <strong>${kit.authorName}</strong></div>
                        </div>
                        <div class="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                            <div class="flex items-center justify-between text-xs mb-1">
                                <span class="text-slate-400 text-[10px] truncate max-w-[150px]">${kit.link}</span>
                                <a href="${kit.link}" target="_blank" rel="noopener noreferrer" class="font-bold text-tsMavi text-[11px] hover:underline">Linki Kontrol Et ↗</a>
                            </div>
                            <div class="flex gap-2">
                                <button onclick="approveResource('${kit.id}')" class="flex-1 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm">✓ Onayla / Yayınla</button>
                                <button onclick="rejectResource('${kit.id}')" class="flex-1 py-1.5 bg-rose-500 text-white rounded-lg text-xs font-bold hover:bg-rose-600 transition-colors shadow-sm">✕ Reddet / Sil</button>
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

    // 2. HERKES İÇİN YAYINDAKİ (APPROVED) KAYNAKLAR
    let html = "";
    
    // Varsayılan kitler
    DEFAULT_KITS.forEach(kit => {
        html += createKitCard(kit);
    });

    // Kullanıcıların eklediği onaylanmış kitler (status === 'approved')
    const approvedDynamic = dynamicResources.filter(r => r.status === 'approved');
    approvedDynamic.forEach(res => {
        const kitData = {
            title: res.title,
            category: res.category,
            version: res.version || "v1.0",
            categoryColor: getCategoryColor(res.category),
            description: res.description,
            command: res.link,
            license: "Kullanıcı Kaynağı",
            link: res.link,
            authorName: res.authorName || "Anonim"
        };
        html += createKitCard(kitData);
    });

    mainGrid.innerHTML = html;
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
                <a href="${kit.link}" target="_blank" rel="noopener noreferrer" class="font-bold text-tsMavi hover:underline">İncele ↗</a>
            </div>
        </div>
    `;
}

window.toggleResourceDocTypeCustom = function() {
    const select = document.getElementById('res-category');
    const container = document.getElementById('res-type-custom-container');
    const input = document.getElementById('res-type-custom');

    if (select && container && input) {
        if (select.value === "Diğer") {
            container.classList.remove('hidden');
            input.focus();
        } else {
            container.classList.add('hidden');
            input.value = '';
        }
    }
}

// Modal Fonksiyonları
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
        const customContainer = document.getElementById('res-type-custom-container');
        if (customContainer) customContainer.classList.add('hidden');
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
    let category = document.getElementById('res-category').value;
    if (category === "Diğer") {
        const customVal = document.getElementById('res-type-custom').value.trim();
        if (customVal) category = customVal;
    }
    const link = document.getElementById('res-link').value.trim();
    const description = document.getElementById('res-description').value.trim();
    const legalConsent = document.getElementById('res-legal-consent');
    const btn = document.getElementById('btn-add-resource');

    if (!title || !category || !link || !description) {
        alert("Lütfen tüm zorunlu alanları doldurun.");
        return;
    }

    if (legalConsent && !legalConsent.checked) {
        alert("Lütfen yasal sorumluluk metnini onaylayın.");
        return;
    }

    const originalText = btn.innerHTML;
    btn.innerHTML = `Gönderiliyor...`;
    btn.disabled = true;

    try {
        const newResource = {
            title: title,
            category: category,
            description: description,
            fileUrl: link,
            link: link,
            version: "v1.0",
            authorUid: user.uid,
            authorName: user.displayName || (user.email ? user.email.split('@')[0] : 'Geliştirici'),
            status: "pending", // Default pending admin approval
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const targetDb = typeof db !== 'undefined' ? db : window.db;
        if (targetDb && targetDb.collection) {
            await targetDb.collection("open_source_resources").add(newResource);
            closeAddResourceModal();

            if (typeof showToast === 'function') {
                showToast("Bağlantınız başarıyla gönderildi! Admin onayladıktan sonra yayınlanacaktır.", "success");
            } else {
                alert("Bağlantınız başarıyla gönderildi! Admin onayladıktan sonra yayınlanacaktır.");
            }
        } else {
            alert("Veritabanı bağlantısı kurulamadı.");
        }
    } catch (error) {
        console.error("Kaynak ekleme hatası:", error);
        alert("Bir hata oluştu: " + error.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

window.approveResource = function(id) {
    if (!confirm("Bu kaynak bağlantısını onaylayıp yayınlamak istediğinize emin misiniz?")) return;
    const targetDb = typeof db !== 'undefined' ? db : window.db;
    if (targetDb) {
        targetDb.collection("open_source_resources").doc(id).update({ status: 'approved' })
            .then(() => {
                if (typeof showToast === 'function') showToast("Kaynak bağlantısı onaylandı ve yayınlandı!", "success");
            })
            .catch(err => alert("Hata: " + err.message));
    }
};

window.rejectResource = function(id) {
    if (!confirm("Bu kaynak bağlantısını reddetmek ve silmek istediğinize emin misiniz?")) return;
    const targetDb = typeof db !== 'undefined' ? db : window.db;
    if (targetDb) {
        targetDb.collection("open_source_resources").doc(id).delete()
            .then(() => {
                if (typeof showToast === 'function') showToast("Kaynak bağlantısı reddedildi ve silindi.", "info");
            })
            .catch(err => alert("Hata: " + err.message));
    }
};
