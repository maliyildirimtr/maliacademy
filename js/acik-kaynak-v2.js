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
    const cat = category.toLowerCase();
    if (cat.includes('yazılım') || cat.includes('software')) return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    if (cat.includes('donanım') || cat.includes('hardware')) return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    if (cat.includes('veri') || cat.includes('data')) return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    if (cat.includes('yapay zeka') || cat.includes('ai')) return "bg-purple-500/10 text-purple-500 border-purple-500/20";
    return "bg-slate-500/10 text-slate-500 border-slate-500/20"; // Default
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
            command: res.link, // For custom ones we just show the link here if it's clonable or they can copy it
            license: res.license || "Kullanıcı Kaynağı",
            link: res.link,
            authorName: res.authorName || "Anonim"
        };
        html += createKitCard(kitData);
    });

    grid.innerHTML = html;
}

function createKitCard(kit) {
    return \`
        <div class="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-lg hover:border-tsMavi transition-all flex flex-col justify-between space-y-4">
            <div class="space-y-3">
                <div class="flex items-center justify-between">
                    <span class="px-2.5 py-1 rounded-lg \${kit.categoryColor} border text-xs font-bold">\${kit.category}</span>
                    <span class="text-xs text-slate-400 font-mono">\${kit.version}</span>
                </div>
                <div>
                    <h3 class="font-bold text-base text-slate-900 dark:text-slate-100">\${kit.title}</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-3 leading-relaxed">\${kit.description}</p>
                </div>
                <div class="p-3 rounded-xl bg-slate-100 dark:bg-slate-950 font-mono text-[11px] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 break-all select-all overflow-x-auto whitespace-pre-wrap flex items-center justify-between group cursor-pointer" onclick="navigator.clipboard.writeText('\${kit.command}')">
                    <span>\${kit.command}</span>
                    <span class="opacity-0 group-hover:opacity-100 transition-opacity text-tsMavi" title="Kopyala">📋</span>
                </div>
            </div>
            
            <div class="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <div class="flex flex-col">
                    <span class="text-slate-400 font-mono">\${kit.license}</span>
                    \${kit.authorName ? \`<span class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Ekleyen: <strong class="text-slate-700 dark:text-slate-300">\${kit.authorName}</strong></span>\` : ''}
                </div>
                <a href="\${kit.link}" target="_blank" rel="noopener noreferrer" class="font-bold text-tsMavi hover:underline">Repoyu İncele ↗</a>
            </div>
        </div>
    \`;
}

// Modal Fonksiyonları
function checkAuthOrPrompt() {
    let user = null;
    if (typeof auth !== 'undefined' && auth) user = auth.currentUser;
    if (!user && typeof SSO !== 'undefined') user = SSO.getSSOUser();
    
    if (!user) {
        if (typeof openAuthModal === 'function') {
            openAuthModal();
        } else {
            alert("Bu işlemi gerçekleştirmek için lütfen giriş yapın veya kayıt olun.");
        }
        return false;
    }
    return true;
}

function openAddResourceModal() {
    if (!checkAuthOrPrompt()) return;
    const modal = document.getElementById('add-resource-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeAddResourceModal() {
    const modal = document.getElementById('add-resource-modal');
    if (modal) modal.classList.add('hidden');
    document.getElementById('add-resource-form').reset();
}

function handleAddResource(event) {
    event.preventDefault();
    if (!checkAuthOrPrompt()) return;

    let user = null;
    if (typeof auth !== 'undefined' && auth) user = auth.currentUser;
    if (!user && typeof SSO !== 'undefined') user = SSO.getSSOUser();
    
    if (!user) return;

    const btn = document.getElementById('btn-add-resource');
    const originalText = btn.innerHTML;
    btn.innerHTML = \`Yükleniyor...\`;
    btn.disabled = true;

    const title = document.getElementById('res-title').value.trim();
    const category = document.getElementById('res-category').value.trim();
    const description = document.getElementById('res-description').value.trim();
    const link = document.getElementById('res-link').value.trim();

    if (!title || !category || !description || !link) {
        alert("Lütfen tüm alanları doldurun.");
        btn.innerHTML = originalText;
        btn.disabled = false;
        return;
    }

    const newResource = {
        title,
        category,
        description,
        link,
        authorUid: user.uid,
        authorName: user.displayName || user.email.split('@')[0],
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    db.collection("open_source_resources").add(newResource).then(() => {
        closeAddResourceModal();
        btn.innerHTML = originalText;
        btn.disabled = false;
        // renderKits() will be called automatically by onSnapshot
    }).catch(error => {
        console.error(error);
        alert("Kaynak eklenirken bir hata oluştu.");
        btn.innerHTML = originalText;
        btn.disabled = false;
    });
}
