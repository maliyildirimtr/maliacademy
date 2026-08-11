// ==========================================
// SINAV & VİZE HAZIRLIK - DİNAMİK LİSTELEME VE YÜKLEME
// ==========================================

const DEFAULT_EXAMS = [
    {
        id: "static_1",
        title: "Karnaugh Haritaları & Flip-Flop Vize Çözümleri",
        category: "Mantık Devreleri",
        description: "Bileşimsel ve ardışıl devre tasarımları, durum diyagramları azaltma vize sınavı çözümlü çalışma seti.",
        fileInfo: "PDF • 4.2 MB",
        link: "dersler.html",
        addedBy: "Sistem",
        timestamp: new Date().getTime()
    },
    {
        id: "static_2",
        title: "Assembly Kod Örnekleri & Interrupt Final Seti",
        category: "Mikroişlemciler",
        description: "8086 / ARM mimarisi komut setleri, kesme (Interrupt) rutinleri ve bellek haritalama soru çözümleri.",
        fileInfo: "PDF • 6.8 MB",
        link: "dersler.html",
        addedBy: "Sistem",
        timestamp: new Date().getTime() - 1000
    },
    {
        id: "static_3",
        title: "Fourier & Laplace Dönüşümü Örnek Çözümler",
        category: "İşaretler & Sistemler",
        description: "Sürekli ve ayrık zamanlı LTI sistemler, Konvolüsyon integrali ve Z-Dönüşümü vize/final hazırlık notları.",
        fileInfo: "PDF • 8.1 MB",
        link: "dersler.html",
        addedBy: "Sistem",
        timestamp: new Date().getTime() - 2000
    }
];

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
    
    const user = window.auth ? window.auth.currentUser : null;
    if (!user) {
        alert("Lütfen giriş yapın.");
        return;
    }

    const title = document.getElementById("doc-title").value.trim();
    const category = document.getElementById("doc-category").value;
    const description = document.getElementById("doc-description").value.trim();
    const uploadType = document.getElementById("doc-upload-type").value;
    const submitBtn = document.getElementById("btn-add-doc");

    if (!title || !category || !description) {
        alert("Lütfen zorunlu alanları doldurun.");
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
            addedBy: user.displayName || user.email.split('@')[0],
            uid: user.uid,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert("Belge başarıyla eklendi!");
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
    
    allExams.forEach(docItem => {
        const colors = getCategoryColors(docItem.category);
        
        // addedBy bilgisi gösterme
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
                    <a href="${docItem.link}" ${docItem.link.startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : ''} class="font-bold text-tsMavi hover:underline">İncele →</a>
                </div>
            </div>
        `;
        grid.innerHTML += html;
    });
}

function loadResources() {
    if (!window.db) {
        console.warn("Firestore db is not initialized yet.");
        allExams = [...DEFAULT_EXAMS];
        renderExams();
        return;
    }

    window.db.collection("exam_prep_resources")
        .orderBy("timestamp", "desc")
        .onSnapshot((snapshot) => {
            dynamicExams = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                dynamicExams.push({
                    id: doc.id,
                    title: data.title,
                    category: data.category,
                    description: data.description,
                    fileInfo: data.fileInfo || "Belge",
                    link: data.link,
                    addedBy: data.addedBy,
                    timestamp: data.timestamp ? data.timestamp.toMillis() : Date.now()
                });
            });

            // Statik verilerle birleştirip tarihe göre sırala
            allExams = [...DEFAULT_EXAMS, ...dynamicExams];
            allExams.sort((a, b) => b.timestamp - a.timestamp);
            
            renderExams();
        }, (error) => {
            console.error("Kaynakları çekerken hata:", error);
            // Hata olsa bile statikleri gösterelim
            allExams = [...DEFAULT_EXAMS];
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
