// ========================================================
// MALI ACADEMY - KÜRESEL ARAMA SONUÇLARI MOTORU (ARAMA.JS)
// ========================================================

let _searchPageQuery = "";
let _activeSearchTab = "all";
let _allSearchResults = {
    courses: [],
    exams: [],
    openSource: [],
    groups: [],
    ads: []
};

document.addEventListener('DOMContentLoaded', () => {
    initSearchPage();
});

function initSearchPage() {
    const params = new URLSearchParams(window.location.search);
    _searchPageQuery = (params.get('q') || '').trim();

    const heroInput = document.getElementById('search-page-input');
    if (heroInput) {
        heroInput.value = _searchPageQuery;
    }

    updateSearchHeaderTitle(_searchPageQuery);

    if (_searchPageQuery.length > 0) {
        performSearchPageQuery(_searchPageQuery);
    } else {
        renderEmptySearchState("Lütfen aramak istediğiniz bir kelime veya konu giriniz.");
    }
}

function updateSearchHeaderTitle(query) {
    const termDisplay = document.getElementById('search-term-display');
    if (termDisplay) {
        termDisplay.textContent = query ? `"${query}"` : "Tüm İçerikler";
    }
}

function handleSearchPageSubmit(e) {
    if (e) e.preventDefault();
    const heroInput = document.getElementById('search-page-input');
    if (!heroInput) return;
    const newQuery = heroInput.value.trim();
    if (newQuery) {
        window.history.pushState({}, '', `arama.html?q=${encodeURIComponent(newQuery)}`);
        _searchPageQuery = newQuery;
        updateSearchHeaderTitle(newQuery);
        performSearchPageQuery(newQuery);
    }
}

async function performSearchPageQuery(query) {
    const grid = document.getElementById('search-results-grid');
    if (grid) {
        grid.innerHTML = `
            <div class="col-span-full py-16 text-center space-y-3">
                <div class="inline-block w-8 h-8 border-4 border-tsMavi border-t-transparent rounded-full animate-spin"></div>
                <p class="text-xs font-semibold text-slate-400 animate-pulse">Sonuçlar aranıyor ve hazırlanıyor...</p>
            </div>
        `;
    }

    const termLower = query.toLowerCase();

    _allSearchResults = {
        courses: [],
        exams: [],
        openSource: [],
        groups: [],
        ads: []
    };

    const targetDb = (typeof db !== 'undefined' && db && db.collection) ? db : (window.db || null);

    // 1. DERSLER & NOTLAR ARAMASI
    try {
        if (targetDb) {
            const snaps = await Promise.all([
                targetDb.collection("academy_courses").get().catch(() => null),
                targetDb.collection("courses").get().catch(() => null)
            ]);
            snaps.forEach(snap => {
                if (snap && !snap.empty) {
                    snap.forEach(doc => {
                        const data = doc.data();
                        const title = (data.title || '').toLowerCase();
                        const code = (data.code || '').toLowerCase();
                        const desc = (data.description || '').toLowerCase();
                        if ((title.includes(termLower) || code.includes(termLower) || desc.includes(termLower)) && !_allSearchResults.courses.some(x => x.id === doc.id)) {
                            _allSearchResults.courses.push({
                                type: 'courses',
                                typeLabel: 'Ders & Not',
                                typeBadgeClass: 'bg-tsMavi/10 text-tsMavi border-tsMavi/20',
                                id: doc.id,
                                title: data.title || "Akademik Ders Notu",
                                code: data.code || "Ders",
                                description: data.description || "Ders içeriği ve notları.",
                                url: `dersler.html?highlight=${doc.id}`,
                                iconSvg: `<svg class="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`
                            });
                        }
                    });
                }
            });
        }
    } catch (e) {}

    // SystemVerilog Fallback Course
    if (typeof SYSTEMVERILOG_COURSE_DATA !== 'undefined') {
        const title = (SYSTEMVERILOG_COURSE_DATA.title || '').toLowerCase();
        const desc = (SYSTEMVERILOG_COURSE_DATA.description || '').toLowerCase();
        const code = (SYSTEMVERILOG_COURSE_DATA.code || '').toLowerCase();
        if ((title.includes(termLower) || desc.includes(termLower) || code.includes(termLower)) && !_allSearchResults.courses.some(x => x.id === SYSTEMVERILOG_COURSE_DATA.id)) {
            _allSearchResults.courses.push({
                type: 'courses',
                typeLabel: 'Ders & Not',
                typeBadgeClass: 'bg-tsMavi/10 text-tsMavi border-tsMavi/20',
                id: SYSTEMVERILOG_COURSE_DATA.id || 'systemverilog-kursu',
                title: SYSTEMVERILOG_COURSE_DATA.title,
                code: SYSTEMVERILOG_COURSE_DATA.code || 'FPGA & Verilog',
                description: SYSTEMVERILOG_COURSE_DATA.description,
                url: `dersler.html?highlight=${SYSTEMVERILOG_COURSE_DATA.id || 'systemverilog-kursu'}`,
                iconSvg: `<svg class="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`
            });
        }
    }

    // 2. SINAV BELGELERİ ARAMASI
    try {
        if (targetDb) {
            const snap = await targetDb.collection("exam_prep_resources").get().catch(() => null);
            if (snap && !snap.empty) {
                snap.forEach(doc => {
                    const data = doc.data();
                    const title = (data.title || '').toLowerCase();
                    const cat = (data.category || data.documentType || '').toLowerCase();
                    const desc = (data.description || '').toLowerCase();
                    if ((title.includes(termLower) || cat.includes(termLower) || desc.includes(termLower)) && !_allSearchResults.exams.some(x => x.id === doc.id)) {
                        _allSearchResults.exams.push({
                            type: 'exams',
                            typeLabel: 'Sınav Belgesi',
                            typeBadgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                            id: doc.id,
                            title: data.title || "Sınav Belgesi",
                            code: data.category || data.documentType || "Vize & Final Notu",
                            description: data.description || "Çözümlü çalışma kağıdı veya vize/final hazırlık notu.",
                            url: `sinav-hazirlik.html?highlight=${doc.id}`,
                            iconSvg: `<svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>`
                        });
                    }
                });
            }
        }
    } catch (e) {}

    // 3. AÇIK KAYNAK KİTLER ARAMASI
    try {
        if (targetDb) {
            const snap = await targetDb.collection("open_source_resources").get().catch(() => null);
            if (snap && !snap.empty) {
                snap.forEach(doc => {
                    const data = doc.data();
                    const title = (data.title || '').toLowerCase();
                    const cat = (data.category || data.sourceType || '').toLowerCase();
                    const desc = (data.description || '').toLowerCase();
                    if ((title.includes(termLower) || cat.includes(termLower) || desc.includes(termLower)) && !_allSearchResults.openSource.some(x => x.id === doc.id)) {
                        _allSearchResults.openSource.push({
                            type: 'openSource',
                            typeLabel: 'Açık Kaynak Kit',
                            typeBadgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                            id: doc.id,
                            title: data.title || "Açık Kaynak Kod & Kit",
                            code: data.category || data.sourceType || "GitHub Repo",
                            description: data.description || "Tasarım dosyaları, Verilog/FPGA kitleri ve kod kütüphaneleri.",
                            url: `acik-kaynak.html?highlight=${doc.id}`,
                            iconSvg: `<svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/></svg>`
                        });
                    }
                });
            }
        }
    } catch (e) {}

    // 4. PROJE GRUPLARI ARAMASI
    try {
        if (targetDb) {
            const snap = await targetDb.collection("groups").get().catch(() => null);
            if (snap && !snap.empty) {
                snap.forEach(doc => {
                    const data = doc.data();
                    const name = (data.name || '').toLowerCase();
                    const cat = (data.category || '').toLowerCase();
                    const desc = (data.description || '').toLowerCase();
                    const roles = (typeof data.lookingRoles === 'string' ? data.lookingRoles : '').toLowerCase();
                    if ((name.includes(termLower) || cat.includes(termLower) || desc.includes(termLower) || roles.includes(termLower)) && !_allSearchResults.groups.some(x => x.id === doc.id)) {
                        _allSearchResults.groups.push({
                            type: 'groups',
                            typeLabel: 'Proje Grubu',
                            typeBadgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                            id: doc.id,
                            title: data.name || "Proje Ekibi",
                            code: data.category || "Takım",
                            description: data.description || "Mühendislik ve yarışma projesi takımı.",
                            url: `grup-detay.html?id=${doc.id}`,
                            iconSvg: `<svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
                        });
                    }
                });
            }
        }
    } catch (e) {}

    // Local / Demo Groups Fallback
    let localGroups = [];
    try {
        const stored = localStorage.getItem('mali_created_groups');
        if (stored) localGroups = JSON.parse(stored);
    } catch (e) {}
    if (typeof DEMO_GROUPS !== 'undefined' && Array.isArray(DEMO_GROUPS)) {
        DEMO_GROUPS.forEach(g => { if (!localGroups.some(x => x.id === g.id)) localGroups.push(g); });
    }
    localGroups.forEach(g => {
        const name = (g.name || '').toLowerCase();
        const cat = (g.category || '').toLowerCase();
        const desc = (g.description || '').toLowerCase();
        if ((name.includes(termLower) || cat.includes(termLower) || desc.includes(termLower)) && !_allSearchResults.groups.some(x => x.id === g.id)) {
            _allSearchResults.groups.push({
                type: 'groups',
                typeLabel: 'Proje Grubu',
                typeBadgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                id: g.id,
                title: g.name || "Proje Ekibi",
                code: g.category || "Takım",
                description: g.description || "Mühendislik ve çalışma takımı.",
                url: `grup-detay.html?id=${g.id}`,
                iconSvg: `<svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
            });
        }
    });

    // 5. İLANLAR ARAMASI
    try {
        if (targetDb) {
            const snap = await targetDb.collection("ads").get().catch(() => null);
            if (snap && !snap.empty) {
                snap.forEach(doc => {
                    const data = doc.data();
                    const title = (data.title || '').toLowerCase();
                    const cat = (data.category || '').toLowerCase();
                    const desc = (data.description || '').toLowerCase();
                    if ((title.includes(termLower) || cat.includes(termLower) || desc.includes(termLower)) && !_allSearchResults.ads.some(x => x.id === doc.id)) {
                        _allSearchResults.ads.push({
                            type: 'ads',
                            typeLabel: 'Akademik İlan',
                            typeBadgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                            id: doc.id,
                            title: data.title || "İlan / Duyuru",
                            code: data.category || "İlan Panosu",
                            description: data.description || "Ekip arkadaşı ve bitirme projesi ilanı.",
                            url: `ilan-panosu.html?highlight=${doc.id}`,
                            iconSvg: `<svg class="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>`
                        });
                    }
                });
            }
        }
    } catch (e) {}

    updateTabCountsAndRender();
}

function filterSearchTab(tabKey) {
    _activeSearchTab = tabKey;

    // Update active tab buttons styling
    const tabs = ['all', 'courses', 'exams', 'openSource', 'groups', 'ads'];
    tabs.forEach(t => {
        const btn = document.getElementById(`tab-btn-${t}`);
        if (btn) {
            if (t === tabKey) {
                btn.className = "px-4 py-2 rounded-xl bg-tsMavi text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer";
            } else {
                btn.className = "px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer";
            }
        }
    });

    renderFilteredResults();
}

function updateTabCountsAndRender() {
    const cCount = _allSearchResults.courses.length;
    const eCount = _allSearchResults.exams.length;
    const oCount = _allSearchResults.openSource.length;
    const gCount = _allSearchResults.groups.length;
    const aCount = _allSearchResults.ads.length;
    const total = cCount + eCount + oCount + gCount + aCount;

    const totalDisplay = document.getElementById('total-matches-count');
    if (totalDisplay) totalDisplay.textContent = total;

    // Update Tab Count Badges
    const countAll = document.getElementById('count-all');
    if (countAll) countAll.textContent = total;

    const countCourses = document.getElementById('count-courses');
    if (countCourses) countCourses.textContent = cCount;

    const countExams = document.getElementById('count-exams');
    if (countExams) countExams.textContent = eCount;

    const countOpenSource = document.getElementById('count-openSource');
    if (countOpenSource) countOpenSource.textContent = oCount;

    const countGroups = document.getElementById('count-groups');
    if (countGroups) countGroups.textContent = gCount;

    const countAds = document.getElementById('count-ads');
    if (countAds) countAds.textContent = aCount;

    renderFilteredResults();
}

function renderFilteredResults() {
    const grid = document.getElementById('search-results-grid');
    if (!grid) return;

    let itemsToRender = [];

    if (_activeSearchTab === 'all') {
        itemsToRender = [
            ..._allSearchResults.courses,
            ..._allSearchResults.exams,
            ..._allSearchResults.openSource,
            ..._allSearchResults.groups,
            ..._allSearchResults.ads
        ];
    } else {
        itemsToRender = _allSearchResults[_activeSearchTab] || [];
    }

    if (itemsToRender.length === 0) {
        renderEmptySearchState("Aramanızla eşleşen hiçbir içerik bulunamadı. Farklı kelimelerle tekrar deneyebilirsiniz.");
        return;
    }

    grid.innerHTML = itemsToRender.map(item => `
        <a href="${item.url}" class="group relative overflow-hidden rounded-2xl bg-white dark:bg-[#111b21] border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between space-y-4">
            
            <!-- LEFT BORDO-MAVI GRADIENT STRIP -->
            <div class="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-tsBordo to-tsMavi opacity-80 group-hover:opacity-100 transition-opacity"></div>
            
            <div class="pl-2 space-y-3">
                <div class="flex items-center justify-between gap-2">
                    <span class="px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${item.typeBadgeClass}">
                        ${item.typeLabel}
                    </span>
                    <span class="text-[11px] font-mono text-slate-400 font-semibold truncate max-w-[120px]">
                        ${item.code}
                    </span>
                </div>

                <div class="flex items-start gap-3">
                    <div class="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700/60 group-hover:scale-105 transition-transform">
                        ${item.iconSvg}
                    </div>
                    <div class="min-w-0 flex-1">
                        <h3 class="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-tsMavi transition-colors line-clamp-2 leading-snug">
                            ${item.title}
                        </h3>
                    </div>
                </div>

                <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-normal">
                    ${item.description}
                </p>
            </div>

            <div class="pl-2 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-tsMavi group-hover:text-sky-400 transition-colors">
                <span>İçeriği İncele</span>
                <span class="group-hover:translate-x-1 transition-transform">→</span>
            </div>
        </a>
    `).join('');
}

function renderEmptySearchState(message) {
    const grid = document.getElementById('search-results-grid');
    if (!grid) return;

    grid.innerHTML = `
        <div class="col-span-full p-10 md:p-14 rounded-3xl bg-white dark:bg-[#111b21] border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-xl">
            <div class="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto border border-slate-200 dark:border-slate-700">
                <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <div class="space-y-1 max-w-md mx-auto">
                <h3 class="text-base font-bold text-slate-800 dark:text-slate-100">Sonuç Bulunamadı</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    ${message}
                </p>
            </div>
            <div class="pt-2">
                <a href="index.html" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    Ana Sayfaya Dön
                </a>
            </div>
        </div>
    `;
}
