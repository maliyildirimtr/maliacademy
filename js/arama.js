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

    if (typeof runCoreGlobalSearch === 'function') {
        _allSearchResults = await runCoreGlobalSearch(query);
    } else {
        _allSearchResults = { courses: [], exams: [], openSource: [], groups: [], ads: [] };
    }

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
