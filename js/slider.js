// ==========================================
// HERO SLIDER & DUYURU YÖNETİMİ (js/slider.js)
// ==========================================

let allSlides = [];
let currentSlideIndex = 0;
let slideInterval = null;

// SÜRÜKLEME (DRAG & TOUCH) DEĞİŞKENLERİ
let isDragging = false;
let startX = 0;
let hasDraggedSignificant = false;

document.addEventListener('DOMContentLoaded', () => {
    initHeroSlider();
    setupAuthObserverForAdminButton();
});

// AUTH DURUMU DEĞİŞTİĞİNDE ADMİN BUTONUNU VE SLIDER KONTROLLERİNİ GÜNCELLE
function setupAuthObserverForAdminButton() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(() => {
            checkAdminButtonVisibility();
            renderSliderUI();
        });
    }
}

function checkAdminButtonVisibility() {
    const adminBtn = document.getElementById('admin-announcement-btn');
    if (adminBtn) {
        if (typeof isAdmin === 'function' && isAdmin()) {
            adminBtn.classList.remove('hidden');
            adminBtn.classList.add('inline-flex');
        } else {
            adminBtn.classList.add('hidden');
            adminBtn.classList.remove('inline-flex');
        }
    }
}

// SLIDER BAŞLATICI & FIRESTORE REALTIME DİNLEYİCİ
function initHeroSlider() {
    setupDragAndDropEvents();
    checkAdminButtonVisibility();

    if (typeof db !== 'undefined' && db && db.collection) {
        db.collection("announcements").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
            let loadedSlides = [];
            if (!snapshot.empty) {
                snapshot.docs.forEach((doc) => {
                    loadedSlides.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
            }
            allSlides = loadedSlides;
            renderSliderUI();
        }, (err) => {
            console.warn("Firestore announcements okuma hatası:", err);
            allSlides = [];
            renderSliderUI();
        });
    } else {
        allSlides = [];
        renderSliderUI();
    }
}

// SLIDER ARAYÜZÜNÜ ÇİZME
function renderSliderUI() {
    checkAdminButtonVisibility();
    const track = document.getElementById('slider-track');
    const dotsContainer = document.getElementById('slider-dots');
    const countBadge = document.getElementById('slider-count-badge');

    if (!track) return;

    // BOŞ DURUM KONTROLÜ (DUYURU YOKSA)
    if (!allSlides || allSlides.length === 0) {
        stopAutoSlide();
        if (countBadge) countBadge.innerText = "0 / 0";
        if (dotsContainer) dotsContainer.innerHTML = "";
        
        track.className = "w-full";
        track.innerHTML = `
            <div class="w-full p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-center space-y-3 py-12 shadow-sm backdrop-blur-md">
                <div class="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-2xl">📢</div>
                <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">Henüz yayınlanmış bir duyuru bulunmuyor.</p>
                <p class="text-xs text-slate-500">Yöneticiler üstteki "+ Duyuru Ekle" butonunu kullanarak duyuru yayınlayabilir.</p>
            </div>
        `;
        return;
    }

    if (currentSlideIndex >= allSlides.length) {
        currentSlideIndex = 0;
    }

    if (countBadge) {
        countBadge.innerText = `${currentSlideIndex + 1} / ${allSlides.length}`;
    }

    const userIsAdmin = (typeof isAdmin === 'function' && isAdmin());

    track.className = "flex w-full transition-transform duration-500 ease-out cursor-grab active:cursor-grabbing select-none";

    let slidesHTML = "";
    allSlides.forEach((slide) => {
        const category = slide.category || slide.badge || "Duyuru";
        const icon = slide.icon || getIconForCategory(category);
        const title = slide.title || "Duyuru Başlığı";
        const desc = slide.description || "";
        const buttonText = slide.buttonText || "Detayları İncele →";
        const targetUrl = slide.link || slide.targetUrl || "";

        const isExternal = targetUrl.startsWith('http');

        slidesHTML += `
            <div class="w-full shrink-0 flex-none px-1">
                <div class="relative rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-slate-950 shadow-xl backdrop-blur-md overflow-hidden min-h-[190px] flex flex-col justify-center">
                    
                    <div class="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-tsBordo via-rose-500 to-tsMavi"></div>

                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div class="space-y-3 max-w-2xl text-left">
                            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tsMavi/10 text-tsMavi dark:text-sky-400 border border-tsMavi/20 text-xs font-bold w-fit">
                                <span>${icon}</span> ${category}
                            </div>
                            
                            <h2 class="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-snug">
                                ${title}
                            </h2>

                            <p class="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                                ${desc}
                            </p>
                        </div>

                        <div class="shrink-0 flex items-center gap-2 flex-wrap">
                            ${targetUrl ? `
                            <a href="${targetUrl}" ${isExternal ? 'target="_blank" rel="noopener noreferrer"' : ''} class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-tsBordo to-tsMavi text-white font-bold text-xs shadow-lg shadow-tsBordo/20 hover:opacity-90 transition-all flex items-center gap-2 drag-prevent-click">
                                ${buttonText}
                            </a>
                            ` : ''}

                            ${userIsAdmin ? `
                            <div class="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
                                <button onclick="editAnnouncement('${slide.id}')" title="Duyuruyu Düzenle" class="px-3 py-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white border border-amber-500/20 font-bold transition-all text-xs flex items-center gap-1 cursor-pointer">
                                    ✏️ Düzenle
                                </button>
                                <button onclick="deleteAnnouncement('${slide.id}')" title="Duyuruyu Sil" class="px-3 py-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/20 font-bold transition-all text-xs flex items-center gap-1 cursor-pointer">
                                    🗑️ Sil
                                </button>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    track.innerHTML = slidesHTML;

    // Sürükleme sırasında link tıklanmasını engelle
    track.querySelectorAll('.drag-prevent-click').forEach(link => {
        link.addEventListener('click', (e) => {
            if (hasDraggedSignificant) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
    });

    updateTrackPosition();
    renderDotsUI();
    startAutoSlide();
}

function getIconForCategory(cat) {
    if (!cat) return "📢";
    if (cat.includes("Sınav")) return "✍️";
    if (cat.includes("İçerik") || cat.includes("Eğitim")) return "🚀";
    if (cat.includes("Yarışma")) return "🏆";
    if (cat.includes("Takım") || cat.includes("Proje")) return "🤝";
    return "📢";
}

function updateTrackPosition() {
    const track = document.getElementById('slider-track');
    if (!track) return;
    track.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
}

function goToSlide(index) {
    if (!allSlides || allSlides.length === 0) return;
    if (index < 0) index = allSlides.length - 1;
    if (index >= allSlides.length) index = 0;
    currentSlideIndex = index;
    updateTrackPosition();
    renderDotsUI();
}

function renderDotsUI() {
    const dotsContainer = document.getElementById('slider-dots');
    const countBadge = document.getElementById('slider-count-badge');

    if (countBadge) {
        countBadge.innerText = `${currentSlideIndex + 1} / ${allSlides.length}`;
    }

    if (dotsContainer) {
        let dotsHTML = "";
        allSlides.forEach((_, idx) => {
            const isActive = idx === currentSlideIndex;
            dotsHTML += `
                <button onclick="goToSlide(${idx})" title="Slayt ${idx + 1}" class="h-2 rounded-full transition-all duration-300 ${isActive ? 'w-8 bg-tsMavi' : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'}"></button>
            `;
        });
        dotsContainer.innerHTML = dotsHTML;
    }
}

function nextSlide() {
    if (allSlides && allSlides.length > 0) goToSlide(currentSlideIndex + 1);
}

function prevSlide() {
    if (allSlides && allSlides.length > 0) goToSlide(currentSlideIndex - 1);
}

function startAutoSlide() {
    stopAutoSlide();
    if (allSlides.length <= 1) return;
    slideInterval = setInterval(() => {
        nextSlide();
    }, 5000);
}

function stopAutoSlide() {
    if (slideInterval) {
        clearInterval(slideInterval);
        slideInterval = null;
    }
}

// SÜRÜKLEME VE DOKUNMA ETKİLEŞİMLERİ
function setupDragAndDropEvents() {
    const container = document.getElementById('slider-container');
    if (!container) return;

    container.addEventListener('mousedown', touchStart);
    container.addEventListener('mouseup', touchEnd);
    container.addEventListener('mouseleave', touchEnd);
    container.addEventListener('mousemove', touchMove);

    container.addEventListener('touchstart', touchStart, { passive: true });
    container.addEventListener('touchend', touchEnd);
    container.addEventListener('touchmove', touchMove, { passive: true });
}

function getPositionX(event) {
    return event.type.includes('touch') ? event.touches[0].clientX : event.clientX;
}

function touchStart(event) {
    if (allSlides.length <= 1) return;
    stopAutoSlide();
    isDragging = true;
    hasDraggedSignificant = false;
    startX = getPositionX(event);
    
    const track = document.getElementById('slider-track');
    if (track) {
        track.style.transition = 'none';
    }
}

function touchMove(event) {
    if (!isDragging) return;
    const currentX = getPositionX(event);
    const diffX = currentX - startX;

    if (Math.abs(diffX) > 5) {
        hasDraggedSignificant = true;
    }

    const container = document.getElementById('slider-container');
    const containerWidth = container ? container.clientWidth : 800;
    const currentTranslatePercent = -(currentSlideIndex * 100) + (diffX / containerWidth) * 100;

    const track = document.getElementById('slider-track');
    if (track) {
        track.style.transform = `translateX(${currentTranslatePercent}%)`;
    }
}

function touchEnd(event) {
    if (!isDragging) return;
    isDragging = false;

    const track = document.getElementById('slider-track');
    if (track) {
        track.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
    }

    const endX = (event.changedTouches && event.changedTouches.length > 0)
        ? event.changedTouches[0].clientX
        : (event.clientX || startX);

    const diffX = endX - startX;

    if (diffX < -50) {
        nextSlide();
    } else if (diffX > 50) {
        prevSlide();
    } else {
        goToSlide(currentSlideIndex);
    }

    startAutoSlide();

    setTimeout(() => {
        hasDraggedSignificant = false;
    }, 100);
}

// ==========================================
// ADMİN DUYURU CRUD FONKSİYONLARI
// ==========================================
function openAddAnnouncementModal() {
    if (typeof isAdmin === 'function' && !isAdmin()) {
        alert("Bu işlem yalnızca Yönetici (Admin) yetkisine açıktır.");
        return;
    }

    resetAnnouncementForm();
    const modalTitle = document.getElementById('announcement-modal-title');
    const submitBtn = document.getElementById('announcement-submit-btn');

    if (modalTitle) modalTitle.innerHTML = "<span>📢</span> Yeni Duyuru Yayınla";
    if (submitBtn) submitBtn.innerHTML = "<span>🚀</span> Duyuruyu Yayınla";

    const modal = document.getElementById('announcement-admin-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeAnnouncementModal() {
    const modal = document.getElementById('announcement-admin-modal');
    if (modal) modal.classList.add('hidden');
    resetAnnouncementForm();
}

function resetAnnouncementForm() {
    const form = document.getElementById('announcement-admin-form');
    const editIdInput = document.getElementById('announcement-edit-id');
    const customContainer = document.getElementById('custom-category-container');

    if (form) form.reset();
    if (editIdInput) editIdInput.value = "";
    if (customContainer) customContainer.classList.add('hidden');
}

function toggleCustomAnnouncementCategory() {
    const categorySelect = document.getElementById('announcement-category');
    const customContainer = document.getElementById('custom-category-container');

    if (categorySelect && customContainer) {
        if (categorySelect.value === 'Diğer') {
            customContainer.classList.remove('hidden');
        } else {
            customContainer.classList.add('hidden');
        }
    }
}

function handleAnnouncementSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();

    if (typeof isAdmin === 'function' && !isAdmin()) {
        alert("Bu işlemi gerçekleştirme yetkiniz bulunmuyor.");
        return;
    }

    const editId = document.getElementById('announcement-edit-id')?.value;
    const title = document.getElementById('announcement-title')?.value.trim();
    const desc = document.getElementById('announcement-desc')?.value.trim();
    let categorySelect = document.getElementById('announcement-category')?.value;
    const customCategory = document.getElementById('announcement-custom-category')?.value.trim();
    const link = document.getElementById('announcement-link')?.value.trim() || "";
    const buttonText = document.getElementById('announcement-button-text')?.value.trim() || "Detayları İncele →";

    if (!title || !desc) {
        alert("Lütfen başlık ve açıklama alanlarını doldurun.");
        return;
    }

    let finalCategory = categorySelect;
    if (categorySelect === 'Diğer') {
        finalCategory = customCategory || "Duyuru";
    }

    const icon = getIconForCategory(finalCategory);

    const announcementData = {
        title: title,
        description: desc,
        category: finalCategory,
        badge: finalCategory,
        icon: icon,
        link: link,
        targetUrl: link,
        buttonText: buttonText,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (typeof db !== 'undefined' && db && db.collection) {
        if (editId) {
            // UPDATE EXISTING ANNOUNCEMENT IN FIRESTORE
            db.collection("announcements").doc(editId).update(announcementData).then(() => {
                alert("✨ Duyuru başarıyla güncellendi!");
                closeAnnouncementModal();
            }).catch(err => {
                console.error("Duyuru güncelleme hatası:", err);
                alert("❌ Duyuru güncellenirken bir hata oluştu.");
            });
        } else {
            // CREATE NEW ANNOUNCEMENT IN FIRESTORE
            announcementData.createdAt = firebase.firestore.FieldValue.serverTimestamp();

            db.collection("announcements").add(announcementData).then(() => {
                alert("✅ Yeni duyuru başarıyla yayınlandı!");
                closeAnnouncementModal();
            }).catch(err => {
                console.error("Duyuru ekleme hatası:", err);
                alert("❌ Duyuru eklenirken bir hata oluştu.");
            });
        }
    } else {
        alert("❌ Veritabanı bağlantısı kurulamadı.");
    }
}

function editAnnouncement(id) {
    if (typeof isAdmin === 'function' && !isAdmin()) return;

    const target = allSlides.find(item => item.id === id);
    if (!target) return;

    const editIdInput = document.getElementById('announcement-edit-id');
    const titleInput = document.getElementById('announcement-title');
    const descInput = document.getElementById('announcement-desc');
    const categorySelect = document.getElementById('announcement-category');
    const customCategoryInput = document.getElementById('announcement-custom-category');
    const customContainer = document.getElementById('custom-category-container');
    const linkInput = document.getElementById('announcement-link');
    const buttonTextInput = document.getElementById('announcement-button-text');
    const modalTitle = document.getElementById('announcement-modal-title');
    const submitBtn = document.getElementById('announcement-submit-btn');

    if (editIdInput) editIdInput.value = target.id;
    if (titleInput) titleInput.value = target.title || "";
    if (descInput) descInput.value = target.description || "";
    if (linkInput) linkInput.value = target.link || target.targetUrl || "";
    if (buttonTextInput) buttonTextInput.value = target.buttonText || "Detayları İncele →";

    const cat = target.category || target.badge || "Duyuru";
    const standardCategories = ["Duyuru", "Sınav Takvimi", "Yeni İçerik", "Yarışma"];

    if (categorySelect) {
        if (standardCategories.includes(cat)) {
            categorySelect.value = cat;
            if (customContainer) customContainer.classList.add('hidden');
        } else {
            categorySelect.value = "Diğer";
            if (customCategoryInput) customCategoryInput.value = cat;
            if (customContainer) customContainer.classList.remove('hidden');
        }
    }

    if (modalTitle) modalTitle.innerHTML = "<span>✏️</span> Duyuruyu Düzenle";
    if (submitBtn) submitBtn.innerHTML = "<span>✨</span> Değişiklikleri Güncelle";

    const modal = document.getElementById('announcement-admin-modal');
    if (modal) modal.classList.remove('hidden');
}

function deleteAnnouncement(id) {
    if (typeof isAdmin === 'function' && !isAdmin()) return;

    if (!confirm("Bu duyuruyu silmek istediğinize emin misiniz?")) return;

    if (typeof db !== 'undefined' && db && db.collection) {
        db.collection("announcements").doc(id).delete().then(() => {
            alert("🗑️ Duyuru başarıyla silindi.");
        }).catch(err => {
            console.error("Duyuru silme hatası:", err);
            alert("❌ Duyuru silinirken bir hata oluştu.");
        });
    }
}
