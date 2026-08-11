// Akademi Panelini Sağ Taraf için Çiz
function renderAcademyUserPanel() {
    const panel = document.getElementById('academy-user-panel');
    if (!panel) return;

    const user = typeof auth !== 'undefined' ? auth.currentUser : null;
    const adminState = typeof isAdmin === 'function' && isAdmin();

    if (user || adminState) {
        const displayName = adminState ? '👑 Admin' : (user ? (user.displayName || (user.email ? user.email.split('@')[0] : 'Kullanıcı')) : 'Kullanıcı');
        const avatarHTML = adminState ? '' : (typeof getUserAvatarHTML === 'function' ? getUserAvatarHTML(user, "w-6 h-6 text-[10px]") : '');

        panel.innerHTML = `
            <div class="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <button onclick="handleAddCourseClick()" class="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-tsBordo to-tsMavi text-white font-semibold text-xs shadow-md hover:opacity-90 transition-opacity flex items-center gap-1">
                    <span>＋</span> Ders Ekle
                </button>

                <!-- KULLANICI ADI & PROFİL RESMİ BUTONU -->
                <button type="button" onclick="${adminState ? '' : 'openProfileModal()'}" title="${adminState ? '' : 'Kullanıcı Adını / Profil Fotoğrafını Değiştir'}" class="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all flex items-center gap-2 ${adminState ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 cursor-default' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-tsMavi hover:text-tsMavi cursor-pointer'}">
                    ${avatarHTML}
                    <span>${displayName}</span>
                </button>

                <button type="button" onclick="logoutUser()" title="Çıkış Yap" class="text-xs px-2.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-semibold transition-colors">
                    🚪 Çıkış
                </button>
            </div>
        `;
    } else {
        panel.innerHTML = `
            <button type="button" onclick="openAuthModal()" class="px-4 py-2 rounded-2xl bg-gradient-to-r from-tsBordo to-tsMavi text-white font-semibold text-xs shadow-md hover:opacity-95 transition-all flex items-center gap-2">
                🔑 Öğrenci Girişi / Kayıt
            </button>
        `;
    }
}

// Dersleri Yükleme Fonksiyonu
function handleAddCourseClick(e) {
    if (e) e.preventDefault();
    const user = (typeof auth !== 'undefined' && auth) ? auth.currentUser : null;
    if (!user) {
        if (typeof showToast === 'function') {
            showToast("Ders & Not eklemek için lütfen önce giriş yapın!", "info");
        } else {
            alert("Ders & Not eklemek için lütfen önce giriş yapın!");
        }
        if (typeof openAuthModal === 'function') openAuthModal();
        return;
    }
    openAddCourseModal();
}

function loadCourses() {
    const grid = document.getElementById('courses-grid');
    if (!grid) return;

    const renderCourseList = (coursesList) => {
        const user = (typeof auth !== 'undefined' && auth) ? auth.currentUser : null;
        const adminState = typeof isAdmin === 'function' && isAdmin();
        let html = "";

        coursesList.forEach((course) => {
            const courseId = course.id;
            const iconContent = typeof renderIcon === 'function' ? renderIcon(course.icon) : (course.icon || '⚡');
            const canEdit = adminState || (user && course.authorUid === user.uid);
            const targetUrl = course.contentUrl ? course.contentUrl : `ders-detay.html?id=${courseId}`;
            const isExternal = course.contentUrl && (course.contentUrl.startsWith('http://') || course.contentUrl.startsWith('https://'));

            html += `
                <div onclick="window.open('${targetUrl}', '${isExternal ? '_blank' : '_self'}')" class="group relative rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 hover:border-tsMavi transition-all shadow-sm flex flex-col justify-between cursor-pointer overflow-hidden backdrop-blur-md">
                    
                    <!-- Sol Kenar Bordo-Mavi Geçiş Çizgisi -->
                    <div class="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-tsBordo to-tsMavi opacity-80 group-hover:opacity-100 transition-opacity"></div>

                    ${canEdit ? `
                        <div class="absolute top-3 right-3 z-10 flex items-center gap-1 bg-black/70 backdrop-blur-md px-2 py-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" onclick="event.stopPropagation()">
                            <button onclick="openEditCourseModal('${courseId}', '${(course.title||'').replace(/'/g, "\\'")}', '${(course.code||'').replace(/'/g, "\\'")}', '${(course.icon||'').replace(/'/g, "\\'")}', '${(course.description||'').replace(/'/g, "\\'")}', '${(course.contentUrl||'').replace(/'/g, "\\'")}', '${course.collectionName||'academy_courses'}')" class="text-xs text-yellow-400 hover:text-yellow-300 px-1">✏️</button>
                            <button onclick="deleteCourse('${courseId}', '${(course.title||'').replace(/'/g, "\\'")}', '${course.collectionName||'academy_courses'}')" class="text-xs text-red-400 hover:text-red-300 px-1">🗑️</button>
                        </div>
                    ` : ''}

                    <div>
                        <div class="w-12 h-12 rounded-2xl bg-tsMavi/10 text-tsMavi flex items-center justify-center text-2xl font-bold mb-4 overflow-hidden">
                            ${iconContent}
                        </div>
                        <h3 class="font-bold text-lg group-hover:text-tsMavi transition-colors">${course.title}</h3>
                        <p class="text-xs font-mono text-slate-400 mt-1">${course.code || 'Genel Notlar'}</p>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-3 line-clamp-2 leading-relaxed">${course.description || ''}</p>
                    </div>

                    <div class="pt-5 mt-auto border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-2">
                        <div class="flex flex-col gap-1">
                            <span class="text-xs text-tsMavi font-bold flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                                ${course.contentUrl ? 'İçeriği Aç / İndir' : 'İçeriği İncele'} 
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                            </span>
                            ${!course.contentUrl ? `<span class="text-[10px] text-slate-400 font-medium" id="topic-count-${courseId}">...</span>` : ''}
                        </div>
                        <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-500 dark:text-slate-400 max-w-[110px]" title="${course.authorName || 'Mali Academy'}">
                            <span>👤</span>
                            <span class="truncate">${course.authorName || 'Mali Academy'}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        grid.innerHTML = html;

        // Her ders için konu ve video sayısını canlı takip et
        coursesList.forEach((course) => {
            if (course.contentUrl) return;
            const courseId = course.id;
            const countEl = document.getElementById(`topic-count-${courseId}`);

            if (typeof db !== 'undefined') {
                const targetColl = course.collectionName || "courses";
                db.collection(targetColl).doc(courseId).collection("topics").onSnapshot((topicsSnap) => {
                    let count = topicsSnap.size;
                    if (count === 0 && courseId === 'systemverilog-kursu' && typeof SYSTEMVERILOG_TOPICS !== 'undefined') {
                        count = SYSTEMVERILOG_TOPICS.length;
                    }
                    if (countEl) {
                        countEl.innerText = `${count} Konu & Video`;
                    }
                }, () => {
                    let fallbackCount = (courseId === 'systemverilog-kursu' && typeof SYSTEMVERILOG_TOPICS !== 'undefined') ? SYSTEMVERILOG_TOPICS.length : 0;
                    if (countEl) {
                        countEl.innerText = `${fallbackCount} Konu & Video`;
                    }
                });
            } else {
                let fallbackCount = (courseId === 'systemverilog-kursu' && typeof SYSTEMVERILOG_TOPICS !== 'undefined') ? SYSTEMVERILOG_TOPICS.length : 0;
                if (countEl) {
                    countEl.innerText = `${fallbackCount} Konu & Video`;
                }
            }
        });
    };

    if (typeof db !== 'undefined') {
        const fetchCourses = () => {
            Promise.all([
                db.collection("academy_courses").get().catch(() => ({ docs: [] })),
                db.collection("courses").get().catch(() => ({ docs: [] }))
            ]).then(([academySnap, coursesSnap]) => {
                let courses = [];
                const courseIds = new Set();

                academySnap.docs.forEach(doc => {
                    courses.push({ id: doc.id, collectionName: 'academy_courses', ...doc.data() });
                    courseIds.add(doc.id);
                });

                coursesSnap.docs.forEach(doc => {
                    if (!courseIds.has(doc.id)) {
                        courses.push({ id: doc.id, collectionName: 'courses', ...doc.data() });
                    }
                });

                if (courses.length === 0 && typeof SYSTEMVERILOG_COURSE_DATA !== 'undefined') {
                    courses = [SYSTEMVERILOG_COURSE_DATA];
                }

                renderCourseList(courses);
            });
        };

        db.collection("academy_courses").onSnapshot(() => fetchCourses(), () => fetchCourses());
        db.collection("courses").onSnapshot(() => fetchCourses(), () => fetchCourses());
    } else if (typeof SYSTEMVERILOG_COURSE_DATA !== 'undefined') {
        renderCourseList([SYSTEMVERILOG_COURSE_DATA]);
    }
}

// Modal Yönetimi
function openAddCourseModal() {
    const user = (typeof auth !== 'undefined' && auth) ? auth.currentUser : null;
    if (!user) {
        if (typeof showToast === 'function') showToast("Ders eklemek için lütfen giriş yapın!", "info");
        if (typeof openAuthModal === 'function') openAuthModal();
        return;
    }
    const editInput = document.getElementById('edit-course-id');
    if (editInput) editInput.value = '';
    const form = document.getElementById('add-course-form');
    if (form) form.reset();
    const modalTitle = document.getElementById('course-modal-title');
    if (modalTitle) modalTitle.innerHTML = "<span>➕</span> Yeni Ders & Not Ekle";
    const modal = document.getElementById('add-course-modal');
    if (modal) modal.classList.remove('hidden');
}

function openEditCourseModal(id, title, code, icon, description, contentUrl = '', collectionName = 'academy_courses') {
    const editInput = document.getElementById('edit-course-id');
    if (editInput) editInput.value = id;

    let collInput = document.getElementById('edit-course-collection');
    if (!collInput) {
        collInput = document.createElement('input');
        collInput.type = 'hidden';
        collInput.id = 'edit-course-collection';
        document.getElementById('add-course-form').appendChild(collInput);
    }
    collInput.value = collectionName;

    document.getElementById('course-title').value = title;
    document.getElementById('course-code').value = code;
    document.getElementById('course-icon').value = icon;
    document.getElementById('course-description').value = description;

    const contentUrlInput = document.getElementById('course-content-url');
    if (contentUrlInput) contentUrlInput.value = contentUrl;

    const modalTitle = document.getElementById('course-modal-title');
    if (modalTitle) modalTitle.innerHTML = "<span>✏️</span> Dersi Düzenle";
    document.getElementById('add-course-modal').classList.remove('hidden');
}

function closeCourseModal() {
    const modal = document.getElementById('add-course-modal');
    if (modal) modal.classList.add('hidden');
    const form = document.getElementById('add-course-form');
    if (form) form.reset();
    const editInput = document.getElementById('edit-course-id');
    if (editInput) editInput.value = '';
}

function deleteCourse(id, title, collectionName = 'academy_courses') {
    const user = (typeof auth !== 'undefined' && auth) ? auth.currentUser : null;
    const adminState = typeof isAdmin === 'function' && isAdmin();
    if (!user && !adminState) return;

    if (confirm(`"${title}" ders notunu silmek istediğinize emin misiniz?`)) {
        if (typeof db !== 'undefined') {
            db.collection(collectionName).doc(id).delete().then(() => {
                if (typeof showToast === 'function') showToast("🗑️ Ders silindi.", "info");
            }).catch(() => {
                db.collection("courses").doc(id).delete();
            });
        }
    }
}

function initDerslerPage() {
    renderAcademyUserPanel();
    loadCourses();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDerslerPage);
} else {
    initDerslerPage();
}

document.addEventListener('DOMContentLoaded', () => {
    initDerslerPage();

    const courseForm = document.getElementById('add-course-form');
    if (courseForm) {
        courseForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const user = (typeof auth !== 'undefined' && auth) ? auth.currentUser : null;
            const adminState = typeof isAdmin === 'function' && isAdmin();

            if (!user && !adminState) {
                if (typeof showToast === 'function') showToast("Ders eklemek için lütfen giriş yapın!", "warning");
                return;
            }

            const editId = document.getElementById('edit-course-id').value;
            const collName = document.getElementById('edit-course-collection')?.value || "academy_courses";
            const title = document.getElementById('course-title').value.trim();
            const code = document.getElementById('course-code').value.trim();
            const icon = document.getElementById('course-icon').value.trim() || '📚';
            const description = document.getElementById('course-description').value.trim();
            const contentUrlInput = document.getElementById('course-content-url');
            const contentUrl = contentUrlInput ? contentUrlInput.value.trim() : '';

            const authorName = user ? (user.displayName || (user.email ? user.email.split('@')[0] : 'Kullanıcı')) : 'Yönetici';
            const authorUid = user ? user.uid : 'admin';

            const saveBtn = document.getElementById('save-course-btn');
            if (saveBtn) saveBtn.innerText = "Kaydediliyor...";

            const coursePayload = {
                title,
                code,
                icon,
                description,
                contentUrl,
                authorName,
                authorUid,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (editId) {
                db.collection(collName).doc(editId).update(coursePayload).then(() => {
                    if (typeof showToast === 'function') showToast("✅ Ders başarıyla güncellendi!", "success");
                    closeCourseModal();
                }).catch(() => {
                    db.collection("courses").doc(editId).update(coursePayload).then(() => {
                        if (typeof showToast === 'function') showToast("✅ Ders başarıyla güncellendi!", "success");
                        closeCourseModal();
                    });
                }).finally(() => {
                    if (saveBtn) saveBtn.innerText = "Kaydet & Yayınla";
                });
            } else {
                coursePayload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                db.collection("academy_courses").add(coursePayload).then(() => {
                    if (typeof showToast === 'function') showToast("✅ Ders & Not başarıyla eklendi!", "success");
                    closeCourseModal();
                }).catch(err => {
                    console.warn("academy_courses yazma uyarısı, courses deneniyor:", err);
                    db.collection("courses").add(coursePayload).then(() => {
                        if (typeof showToast === 'function') showToast("✅ Ders & Not başarıyla eklendi!", "success");
                        closeCourseModal();
                    });
                }).finally(() => {
                    if (saveBtn) saveBtn.innerText = "Kaydet & Yayınla";
                });
            }
        });
    }

    if (typeof auth !== 'undefined' && auth) {
        auth.onAuthStateChanged(() => {
            renderAcademyUserPanel();
        });
    }
});
