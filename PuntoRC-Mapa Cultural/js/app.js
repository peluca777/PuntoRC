/**
 * PuntoRC - Mapa Cultural
 * Orquestador Principal de UI y Experiencia de Usuario
 * Controla: Loader, Tema, Hero Dinámico, Flechas Auto-hide, Cartelera, Modales y Navegación
 */
(function(window) {
  'use strict';
  window.PuntoRC = window.PuntoRC || {};
  const ns = window.PuntoRC;

  const getEventRepo = () => (ns.EventRepository || window.EventRepository || { getAll: () => [], getFeatured: () => [], getById: () => null });
  const getFavRepo = () => (ns.FavoritesRepository || window.FavoritesRepository || { getAll: () => [], isFavorite: () => false, toggle: () => false, remove: () => {} });
  const getCalRepo = () => (ns.CalendarRepository || window.CalendarRepository || {
    getSession: () => null,
    saveSession: () => {},
    clearSession: () => {},
    isLoggedIn: () => false,
    getAccessToken: () => null,
    getGoogleEventId: () => null,
    isEventSynced: () => false,
    setGoogleEventId: () => {},
    removeGoogleEventId: () => {},
    getAllSyncedIds: () => []
  });
  const getCalService = () => (ns.GoogleCalendarService || window.GoogleCalendarService);
  const getCatKey = (cat) => (ns.getCategoryKey || window.getCategoryKey ? (ns.getCategoryKey || window.getCategoryKey)(cat) : 'musica');
  const getCatIcon = (key) => (ns.getCategoryIcon || window.getCategoryIcon ? (ns.getCategoryIcon || window.getCategoryIcon)(key) : '');
  const getStatus = (st) => (ns.getStatusBadge || window.getStatusBadge ? (ns.getStatusBadge || window.getStatusBadge)(st) : '');
  const getIsAdminMode = () => (typeof ns.isAdminMode !== 'undefined' ? ns.isAdminMode : (typeof window.isAdminMode !== 'undefined' ? window.isAdminMode : false));

  /* ------------------------------------------------------------
     1. PANTALLA DE CARGA (LOADER)
     ------------------------------------------------------------ */
  function hideLoader() {
    const loader = document.getElementById('app-loader');
    if (!loader) return;
    loader.classList.add('opacity-0', 'pointer-events-none');
    setTimeout(() => {
      loader.remove();
    }, 500);
  }

  if (document.readyState === 'complete') {
    setTimeout(hideLoader, 200);
  } else {
    window.addEventListener('load', hideLoader);
  }
  // Fallback de seguridad infalible (máximo 2 segundos)
  setTimeout(hideLoader, 2000);


  /* ------------------------------------------------------------
     2. GESTIÓN DE TEMA CLARO / OSCURO (CON PERSISTENCIA)
     ------------------------------------------------------------ */
  const storageThemeKey = ns.STORAGE_THEME_KEY || 'puntorc_theme';
  const htmlEl = document.documentElement;

  function applyTheme(isDark) {
    if (isDark) {
      htmlEl.classList.add('dark');
      try { localStorage.setItem(storageThemeKey, 'dark'); } catch (e) {}
    } else {
      htmlEl.classList.remove('dark');
      try { localStorage.setItem(storageThemeKey, 'light'); } catch (e) {}
    }
  }

  function toggleTheme() {
    const isDark = htmlEl.classList.contains('dark');
    applyTheme(!isDark);
    showToast(!isDark ? 'Modo Oscuro activado' : 'Modo Claro activado', 'info');
  }

  let savedTheme = 'dark';
  try {
    savedTheme = localStorage.getItem(storageThemeKey);
  } catch (e) {
    savedTheme = 'dark';
  }
  if (savedTheme === 'light') {
    applyTheme(false);
  } else {
    applyTheme(true);
  }

  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
  document.getElementById('theme-toggle-mobile')?.addEventListener('click', toggleTheme);


  /* ------------------------------------------------------------
     3. PANEL DE BÚSQUEDA EXPANDIBLE (MÓVIL)
     ------------------------------------------------------------ */
  const btnSearchMobile   = document.getElementById('btn-search-mobile');
  const mobileSearchPanel = document.getElementById('mobile-search-panel');
  const searchInputMobile = document.getElementById('search-events-mobile');
  const searchInputDesktop = document.getElementById('search-events');

  btnSearchMobile?.addEventListener('click', () => {
    const isHidden = mobileSearchPanel.classList.contains('hidden');
    mobileSearchPanel.classList.toggle('hidden');
    if (isHidden) {
      searchInputMobile?.focus();
    }
  });

  document.addEventListener('click', (e) => {
    const header = document.querySelector('header');
    if (header && !header.contains(e.target) && mobileSearchPanel && !mobileSearchPanel.classList.contains('hidden')) {
      mobileSearchPanel.classList.add('hidden');
    }
  });


  /* ------------------------------------------------------------
     4. SISTEMA DE TOAST NOTIFICATIONS (FEEDBACK VISUAL)
     ------------------------------------------------------------ */
  const toastEl = document.getElementById('toast-notification');
  const toastMsg = document.getElementById('toast-message');
  const toastIconBox = document.getElementById('toast-icon-box');
  let toastTimeout = null;

  function showToast(message, type = 'success') {
    if (!toastEl || !toastMsg) return;
    if (toastTimeout) clearTimeout(toastTimeout);

    toastMsg.textContent = message;

    if (type === 'error') {
      toastIconBox.className = 'w-7 h-7 rounded-lg bg-rose-600/30 text-rose-400 flex items-center justify-center shrink-0';
      toastIconBox.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>';
    } else if (type === 'info') {
      toastIconBox.className = 'w-7 h-7 rounded-lg bg-purple-600/30 text-purple-400 flex items-center justify-center shrink-0';
      toastIconBox.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
    } else {
      toastIconBox.className = 'w-7 h-7 rounded-lg bg-emerald-600/30 text-emerald-400 flex items-center justify-center shrink-0';
      toastIconBox.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>';
    }

    toastEl.classList.remove('opacity-0', 'translate-y-6', 'pointer-events-none');
    toastEl.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto');

    toastTimeout = setTimeout(() => {
      toastEl.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto');
      toastEl.classList.add('opacity-0', 'translate-y-6', 'pointer-events-none');
    }, 3000);
  }


  /* ------------------------------------------------------------
     5. HERO SECTION DINÁMICO & CARRUSEL (isFeatured: true)
     ------------------------------------------------------------ */
  let currentSlide = 0;
  let sliderInterval = null;
  let heroSlidesElements = [];
  let heroDotsElements = [];

  function renderHeroSlider() {
    const sliderContainer = document.getElementById('hero-slider');
    const dotsContainer = document.getElementById('slider-dots');
    if (!sliderContainer || !dotsContainer) return;

    stopAutoSlider();

    const featuredEvents = getEventRepo().getFeatured();

    sliderContainer.querySelectorAll('.hero-slide').forEach((s) => s.remove());
    dotsContainer.innerHTML = '';
    currentSlide = 0;

    if (featuredEvents.length === 0) {
      const emptySlide = document.createElement('article');
      emptySlide.className = 'hero-slide absolute inset-0 flex items-center justify-center bg-zinc-900 text-center p-6 rounded-3xl lg:rounded-none overflow-hidden';
      emptySlide.innerHTML = `
        <div class="max-w-md">
          <span class="text-3xl mb-3 block">✨</span>
          <h3 class="font-montserrat font-bold text-xl text-white mb-2">Próximamente más destacados</h3>
          <p class="font-inter text-xs text-zinc-400">Activá el Modo Administrador para seleccionar qué eventos destacar en este carrusel principal.</p>
        </div>
      `;
      sliderContainer.prepend(emptySlide);
      heroSlidesElements = [emptySlide];
      return;
    }

    featuredEvents.forEach((ev, idx) => {
      const isFirst = idx === 0;
      const catKey = ev.categoryKey || getCatKey(ev.category);
      const catIcon = getCatIcon(catKey);

      const slide = document.createElement('article');
      slide.id = `hero-slide-${ev.id}`;
      slide.className = `hero-slide absolute inset-0 flex items-end bg-zinc-950 rounded-3xl lg:rounded-none overflow-hidden ${isFirst ? '' : 'opacity-0'} transition-opacity duration-700 ease-in-out`;
      slide.setAttribute('aria-label', ev.title);
      if (!isFirst) slide.setAttribute('aria-hidden', 'true');

      slide.innerHTML = `
        <img
          src="${ev.image}"
          alt="${ev.title}"
          class="absolute inset-0 w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent" aria-hidden="true"></div>
        <div class="relative z-10 w-full max-w-7xl mx-auto p-6 sm:p-10 lg:p-12 pb-10 sm:pb-12 lg:px-8">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-montserrat font-bold bg-purple-600 text-white rounded-full mb-3 shadow-md shadow-purple-500/40">
            ${catIcon}
            <span>${ev.category}</span>
          </span>
          <h2 class="font-montserrat font-extrabold text-2xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight mb-2">
            ${ev.title}
          </h2>
          <p class="font-inter text-zinc-200 text-sm sm:text-base mb-5">
            ${ev.date} · ${ev.location}
          </p>
          <button
            type="button"
            data-event-id="${ev.id}"
            class="btn-event-details px-6 py-3 font-montserrat font-extrabold text-sm rounded-xl bg-purple-600 hover:bg-purple-500 text-white border-b-4 border-purple-900 shadow-lg shadow-purple-500/40 active:border-b-0 active:translate-y-1 transition-all duration-150 cursor-pointer"
          >
            Ver detalles
          </button>
        </div>
      `;

      const arrowsContainer = document.getElementById('slider-arrows');
      if (arrowsContainer && arrowsContainer.parentNode === sliderContainer) {
        sliderContainer.insertBefore(slide, arrowsContainer);
      } else {
        sliderContainer.insertBefore(slide, dotsContainer);
      }

      const dot = document.createElement('button');
      dot.type = 'button';
      dot.role = 'tab';
      dot.setAttribute('aria-selected', isFirst ? 'true' : 'false');
      dot.setAttribute('aria-label', `Ir al slide ${idx + 1}`);
      dot.className = `slider-dot w-2.5 h-2.5 rounded-full bg-white transition-all duration-200 ${isFirst ? 'opacity-100' : 'opacity-40'} focus:outline-none focus:ring-2 focus:ring-purple-500/70 cursor-pointer`;
      dot.addEventListener('click', () => handleManualSlideNav(idx));
      dotsContainer.appendChild(dot);
    });

    heroSlidesElements = sliderContainer.querySelectorAll('.hero-slide');
    heroDotsElements = dotsContainer.querySelectorAll('.slider-dot');

    sliderContainer.querySelectorAll('.btn-event-details').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-event-id');
        if (id) openEventModal(id);
      });
    });

    startAutoSlider();
  }

  function goToSlide(index) {
    if (!heroSlidesElements.length) return;
    heroSlidesElements[currentSlide].classList.add('opacity-0');
    heroSlidesElements[currentSlide].setAttribute('aria-hidden', 'true');
    heroDotsElements[currentSlide]?.classList.replace('opacity-100', 'opacity-40');
    heroDotsElements[currentSlide]?.setAttribute('aria-selected', 'false');

    currentSlide = (index + heroSlidesElements.length) % heroSlidesElements.length;

    heroSlidesElements[currentSlide].classList.remove('opacity-0');
    heroSlidesElements[currentSlide].removeAttribute('aria-hidden');
    heroDotsElements[currentSlide]?.classList.replace('opacity-40', 'opacity-100');
    heroDotsElements[currentSlide]?.setAttribute('aria-selected', 'true');
  }

  function startAutoSlider() {
    stopAutoSlider();
    if (heroSlidesElements.length <= 1) return;
    sliderInterval = setInterval(() => {
      goToSlide(currentSlide + 1);
    }, 5000);
  }

  function stopAutoSlider() {
    if (sliderInterval) {
      clearInterval(sliderInterval);
      sliderInterval = null;
    }
  }

  function handleManualSlideNav(newIndex) {
    goToSlide(newIndex);
    startAutoSlider();
    resetArrowFadeTimer();
  }

  document.getElementById('slider-next')?.addEventListener('click', () => {
    handleManualSlideNav(currentSlide + 1);
  });

  document.getElementById('slider-prev')?.addEventListener('click', () => {
    handleManualSlideNav(currentSlide - 1);
  });

  const heroSection = document.getElementById('hero');
  let touchStartX = 0;
  let touchEndX = 0;

  heroSection?.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    resetArrowFadeTimer();
  }, { passive: true });

  heroSection?.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diffX = touchEndX - touchStartX;
    if (Math.abs(diffX) > 45) {
      if (diffX < 0) {
        handleManualSlideNav(currentSlide + 1);
      } else {
        handleManualSlideNav(currentSlide - 1);
      }
    }
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAutoSlider();
    } else {
      startAutoSlider();
    }
  });


  /* ------------------------------------------------------------
     6. AUTO-OCULTAMIENTO DE FLECHAS EN MÓVIL (FADE-OUT 2.5s)
     ------------------------------------------------------------ */
  let arrowFadeTimeout = null;

  function isMobileViewport() {
    return window.innerWidth < 768;
  }

  function resetArrowFadeTimer() {
    if (!isMobileViewport()) return;

    const prevBtn = document.getElementById('slider-prev');
    const nextBtn = document.getElementById('slider-next');
    if (!prevBtn || !nextBtn) return;

    prevBtn.classList.remove('opacity-0');
    prevBtn.classList.add('opacity-20');
    nextBtn.classList.remove('opacity-0');
    nextBtn.classList.add('opacity-20');

    if (arrowFadeTimeout) clearTimeout(arrowFadeTimeout);

    arrowFadeTimeout = setTimeout(() => {
      if (isMobileViewport()) {
        prevBtn.classList.remove('opacity-20');
        prevBtn.classList.add('opacity-0');
        nextBtn.classList.remove('opacity-20');
        nextBtn.classList.add('opacity-0');
      }
    }, 2500);
  }

  function initHeroArrowAutoHide() {
    const prevBtn = document.getElementById('slider-prev');
    const nextBtn = document.getElementById('slider-next');
    if (!prevBtn || !nextBtn) return;

    [prevBtn, nextBtn].forEach((btn) => {
      btn.classList.add('transition-opacity', 'duration-700', 'ease-in-out');
    });

    if (isMobileViewport()) {
      resetArrowFadeTimer();
    }

    const heroEl = document.getElementById('hero');
    heroEl?.addEventListener('touchstart', resetArrowFadeTimer, { passive: true });
    heroEl?.addEventListener('touchmove', resetArrowFadeTimer, { passive: true });

    window.addEventListener('resize', () => {
      if (!isMobileViewport()) {
        if (arrowFadeTimeout) clearTimeout(arrowFadeTimeout);
        prevBtn.classList.remove('opacity-0', 'opacity-20');
        nextBtn.classList.remove('opacity-0', 'opacity-20');
      } else {
        resetArrowFadeTimer();
      }
    });
  }


  /* ------------------------------------------------------------
     7. FILTROS, ORDENAMIENTO Y GRILLA DINÁMICA DE EVENTOS
     ------------------------------------------------------------ */
  const categoryFilters = document.querySelectorAll('.category-filter');
  const INACTIVE_FILTER_CLASSES = [
    'bg-white', 'dark:bg-zinc-900',
    'border-zinc-200', 'dark:border-zinc-800',
    'text-zinc-700', 'dark:text-zinc-300',
    'hover:border-purple-400', 'dark:hover:border-purple-500/50',
    'hover:text-purple-600', 'dark:hover:text-purple-300',
    'hover:bg-purple-50/60', 'dark:hover:bg-purple-950/30',
    'font-medium'
  ];
  const ACTIVE_FILTER_CLASSES = [
    'bg-purple-600', 'hover:bg-purple-500',
    'border-purple-600',
    'text-white',
    'shadow-md', 'shadow-purple-500/25',
    'font-bold'
  ];

  let currentCategoryFilter = 'todos';
  let searchQuery = '';
  let currentSort = 'date-asc';

  function handleSearchInput(e) {
    searchQuery = e.target.value;
    if (searchInputDesktop && searchInputDesktop !== e.target) searchInputDesktop.value = searchQuery;
    if (searchInputMobile && searchInputMobile !== e.target) searchInputMobile.value = searchQuery;
    renderEventsGrid();
  }

  searchInputDesktop?.addEventListener('input', handleSearchInput);
  searchInputMobile?.addEventListener('input', handleSearchInput);

  document.getElementById('sort-events')?.addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderEventsGrid();
  });

  document.getElementById('btn-reset-filters')?.addEventListener('click', () => {
    currentCategoryFilter = 'todos';
    searchQuery = '';
    if (searchInputDesktop) searchInputDesktop.value = '';
    if (searchInputMobile) searchInputMobile.value = '';
    categoryFilters.forEach((b) => {
      const isAll = b.getAttribute('data-filter') === 'todos';
      b.setAttribute('aria-pressed', isAll ? 'true' : 'false');
      const icon = b.querySelector('svg');
      if (isAll) {
        b.classList.remove(...INACTIVE_FILTER_CLASSES);
        b.classList.add(...ACTIVE_FILTER_CLASSES);
        if (icon) {
          icon.classList.remove('text-zinc-500', 'dark:text-zinc-400');
          icon.classList.add('text-white');
        }
      } else {
        b.classList.remove(...ACTIVE_FILTER_CLASSES);
        b.classList.add(...INACTIVE_FILTER_CLASSES);
        if (icon) {
          icon.classList.remove('text-white');
          icon.classList.add('text-zinc-500', 'dark:text-zinc-400');
        }
      }
    });
    renderEventsGrid();
  });

  categoryFilters.forEach((btn) => {
    btn.addEventListener('click', () => {
      categoryFilters.forEach((b) => {
        b.classList.remove(...ACTIVE_FILTER_CLASSES);
        b.classList.add(...INACTIVE_FILTER_CLASSES);
        b.setAttribute('aria-pressed', 'false');
        const icon = b.querySelector('svg');
        if (icon) {
          icon.classList.remove('text-white');
          icon.classList.add('text-zinc-500', 'dark:text-zinc-400');
        }
      });

      btn.classList.remove(...INACTIVE_FILTER_CLASSES);
      btn.classList.add(...ACTIVE_FILTER_CLASSES);
      btn.setAttribute('aria-pressed', 'true');
      const activeIcon = btn.querySelector('svg');
      if (activeIcon) {
        activeIcon.classList.remove('text-zinc-500', 'dark:text-zinc-400');
        activeIcon.classList.add('text-white');
      }

      currentCategoryFilter = btn.getAttribute('data-filter') || 'todos';
      renderEventsGrid();
    });
  });

  function renderEventsGrid() {
    const grid = document.getElementById('events-grid');
    const emptyState = document.getElementById('empty-state');
    if (!grid) return;

    const allEvents = getEventRepo().getAll();

    let filtered = allEvents.filter((e) => {
      const catKey = e.categoryKey || getCatKey(e.category);
      const matchesCategory = (currentCategoryFilter === 'todos') || (catKey === currentCategoryFilter);
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        e.title.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });

    if (currentSort === 'name-asc') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (currentSort === 'date-desc') {
      filtered.reverse();
    }

    if (filtered.length === 0) {
      grid.innerHTML = '';
      emptyState?.classList.remove('hidden');
      emptyState?.classList.add('flex');
      return;
    }

    emptyState?.classList.remove('flex');
    emptyState?.classList.add('hidden');

    grid.innerHTML = filtered.map((ev) => {
      const isFav = getFavRepo().isFavorite(ev.id);
      const catKey = ev.categoryKey || getCatKey(ev.category);
      const iconSvg = getCatIcon(catKey);
      const statusBadge = getStatus(ev.status || 'Cupos disponibles');

      return `
      <article
        data-event-id="${ev.id}"
        class="event-card group flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:-translate-y-1.5 hover:shadow-xl hover:shadow-purple-900/20 hover:border-purple-500/40 transition-all duration-300 cursor-pointer"
        role="listitem"
        aria-label="Evento: ${ev.title}"
      >
        <div class="relative overflow-hidden aspect-video">
          <img
            src="${ev.image}"
            alt="${ev.title}"
            loading="lazy"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <span class="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-montserrat font-bold bg-purple-600 text-white rounded-full shadow-md shadow-purple-500/30">
            ${iconSvg}
            <span>${ev.category}</span>
          </span>

          <div class="absolute top-3 right-3 flex items-center gap-1.5">
            ${getIsAdminMode() ? `
              <button
                type="button"
                data-admin-edit-id="${ev.id}"
                aria-label="Editar evento ${ev.title}"
                class="btn-admin-edit-card px-2.5 py-1 text-xs font-montserrat font-bold rounded-full bg-amber-500 hover:bg-amber-400 text-white shadow-md shadow-amber-500/30 active:scale-95 transition-all cursor-pointer"
              >
                ✏️ Editar
              </button>
            ` : ''}
            <button
              type="button"
              data-fav-id="${ev.id}"
              aria-label="${isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}"
              aria-pressed="${isFav ? 'true' : 'false'}"
              class="favorite-btn w-8 h-8 rounded-full ${isFav ? 'bg-white/95 dark:bg-zinc-900/95 text-purple-600 dark:text-purple-400 shadow-md' : 'bg-black/40 backdrop-blur-sm text-white hover:text-purple-400'} flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer"
            >
              <svg class="w-4 h-4 ${isFav ? 'fill-current' : 'fill-none'}" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>
        </div>

        <div class="flex flex-col flex-1 p-4 gap-3">
          <div class="flex items-center justify-between gap-2">
            ${statusBadge}
            <span class="text-xs font-montserrat font-bold text-purple-600 dark:text-purple-400">${ev.price ? ev.price.split(' ')[0] : ''}</span>
          </div>

          <div class="flex-1">
            <h3 class="font-montserrat font-bold text-base text-slate-900 dark:text-white leading-snug mb-1">
              ${ev.title}
            </h3>
            <p class="font-inter text-xs text-slate-500 dark:text-zinc-400 line-clamp-2">
              ${ev.description}
            </p>
          </div>

          <div class="space-y-1.5">
            <div class="flex items-center gap-2 text-xs font-inter text-slate-500 dark:text-zinc-400">
              <svg class="w-3.5 h-3.5 text-purple-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <time>${ev.date}</time>
            </div>
            <div class="flex items-center gap-2 text-xs font-inter text-slate-500 dark:text-zinc-400">
              <svg class="w-3.5 h-3.5 text-purple-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span class="truncate">${ev.location}</span>
            </div>
          </div>

          <button
            type="button"
            data-event-id="${ev.id}"
            class="btn-event-details w-full py-2.5 text-sm font-montserrat font-bold rounded-xl bg-purple-600 hover:bg-purple-500 text-white border-b-4 border-purple-900 shadow-lg shadow-purple-500/40 active:border-b-0 active:translate-y-1 transition-all duration-150 cursor-pointer"
          >
            Ver detalles
          </button>
        </div>
      </article>
      `;
    }).join('');

    grid.querySelectorAll('.event-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.favorite-btn') || e.target.closest('.btn-admin-edit-card')) return;
        const id = card.getAttribute('data-event-id');
        if (id) openEventModal(id);
      });
    });

    grid.querySelectorAll('.btn-event-details').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-event-id');
        if (id) openEventModal(id);
      });
    });

    grid.querySelectorAll('.favorite-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-fav-id');
        if (id) {
          e.stopPropagation();
          const added = getFavRepo().toggle(id);
          showToast(added ? 'Guardado en tus favoritos' : 'Eliminado de tus favoritos', added ? 'success' : 'info');
          updateFavoritesBadges();
          renderEventsGrid();
          renderFavoritesList();
        }
      });
    });

    grid.querySelectorAll('.btn-admin-edit-card').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-admin-edit-id');
        if (id) {
          const openModal = ns.openCrudModal || window.openCrudModal;
          if (typeof openModal === 'function') openModal(id);
        }
      });
    });
  }


  /* ------------------------------------------------------------
     8. VISTA DE EVENTOS SPA (MODAL OVERLAY DETALLES)
     ------------------------------------------------------------ */
  const modalOverlay   = document.getElementById('event-modal-overlay');
  const modalContent   = document.getElementById('event-modal-card');
  const modalImg       = document.getElementById('modal-event-img');
  const modalCategory  = document.getElementById('modal-event-category');
  const modalTitle     = document.getElementById('modal-event-title');
  const modalDate      = document.getElementById('modal-event-date');
  const modalLocation  = document.getElementById('modal-event-location');
  const modalPrice     = document.getElementById('modal-event-price');
  const modalDesc      = document.getElementById('modal-event-description');
  const modalCloseBtn  = document.getElementById('modal-close-btn');
  const modalShareBtn  = document.getElementById('modal-btn-share');
  const modalShareLbl  = document.getElementById('modal-share-label');
  const modalAdminEdit = document.getElementById('modal-admin-edit-btn');
  const modalCalendarBtn     = document.getElementById('modal-btn-calendar');
  const modalCalendarText    = document.getElementById('modal-calendar-text');
  const modalCalendarIconBox = document.getElementById('modal-calendar-icon-box');

  let currentModalEventId = null;
  let isCalendarSyncing = false;

  function updateModalCalendarButton(eventId = currentModalEventId) {
    if (!modalCalendarBtn || !eventId) return;
    const isSynced = getCalRepo().isEventSynced(eventId);

    if (isCalendarSyncing) {
      modalCalendarBtn.disabled = true;
      modalCalendarBtn.className = 'py-3 px-4 font-montserrat font-bold text-xs sm:text-sm rounded-xl bg-purple-900/30 text-purple-300 border border-purple-500/50 flex items-center justify-center gap-2 cursor-wait opacity-80 shrink-0';
      if (modalCalendarIconBox) {
        modalCalendarIconBox.innerHTML = '<svg class="w-4 h-4 animate-spin text-purple-400" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>';
      }
      if (modalCalendarText) modalCalendarText.textContent = isSynced ? 'Quitando...' : 'Agendando...';
      return;
    }

    modalCalendarBtn.disabled = false;
    if (isSynced) {
      modalCalendarBtn.className = 'py-3 px-4 font-montserrat font-bold text-xs sm:text-sm rounded-xl bg-purple-950/60 hover:bg-rose-950/50 text-purple-300 hover:text-rose-300 border border-purple-500/60 hover:border-rose-500/60 active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shrink-0';
      modalCalendarBtn.setAttribute('aria-label', 'Evento agendado en Google Calendar. Clic para quitar');
      if (modalCalendarIconBox) {
        modalCalendarIconBox.innerHTML = '<svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>';
      }
      if (modalCalendarText) modalCalendarText.textContent = 'Agendado (Quitar)';
    } else {
      modalCalendarBtn.className = 'py-3 px-4 font-montserrat font-bold text-xs sm:text-sm rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 hover:border-purple-500/50 active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shrink-0';
      modalCalendarBtn.setAttribute('aria-label', 'Añadir evento a Google Calendar');
      if (modalCalendarIconBox) {
        modalCalendarIconBox.innerHTML = '<svg class="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
      }
      if (modalCalendarText) modalCalendarText.textContent = 'Añadir a Google Calendar';
    }
  }

  function openEventModal(eventId) {
    currentModalEventId = String(eventId);
    const repo = getEventRepo();
    const event = repo.getById(eventId) || repo.getAll()[0];
    if (!modalOverlay || !event) return;

    modalImg.src = event.image;
    modalImg.alt = event.title;
    const catKey = event.categoryKey || getCatKey(event.category);
    modalCategory.innerHTML = `${getCatIcon(catKey)}<span>${event.category}</span>`;
    modalTitle.textContent = event.title;
    modalDate.textContent = event.date;
    modalLocation.textContent = event.location;
    modalPrice.textContent = event.price;
    modalDesc.textContent = event.description;

    const modalStatus = document.getElementById('modal-event-status');
    if (modalStatus) {
      modalStatus.textContent = event.status || 'Confirmado · Cupos disponibles';
      if (event.status === 'Agotado') {
        modalStatus.className = 'text-xs sm:text-sm font-inter font-semibold text-rose-600 dark:text-rose-400';
      } else if (event.status === 'Últimas entradas') {
        modalStatus.className = 'text-xs sm:text-sm font-inter font-semibold text-amber-600 dark:text-amber-400';
      } else {
        modalStatus.className = 'text-xs sm:text-sm font-inter font-semibold text-emerald-600 dark:text-emerald-400';
      }
    }

    const updateAdmin = ns.updateAdminUI || window.updateAdminUI;
    if (typeof updateAdmin === 'function') updateAdmin();

    updateModalCalendarButton(currentModalEventId);

    modalOverlay.classList.remove('opacity-0', 'pointer-events-none');
    modalOverlay.classList.add('opacity-100', 'pointer-events-auto');
    modalContent?.classList.remove('scale-95');
    modalContent?.classList.add('scale-100');
    modalOverlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('overflow-hidden');
  }

  function closeEventModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('opacity-100', 'pointer-events-auto');
    modalOverlay.classList.add('opacity-0', 'pointer-events-none');
    modalContent?.classList.remove('scale-100');
    modalContent?.classList.add('scale-95');
    modalOverlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('overflow-hidden');
  }

  modalCloseBtn?.addEventListener('click', closeEventModal);
  modalOverlay?.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeEventModal();
  });

  modalAdminEdit?.addEventListener('click', () => {
    if (currentModalEventId) {
      const openModal = ns.openCrudModal || window.openCrudModal;
      if (typeof openModal === 'function') openModal(currentModalEventId);
    }
  });

  modalCalendarBtn?.addEventListener('click', async () => {
    if (!currentModalEventId || isCalendarSyncing) return;
    const calService = getCalService();
    const calRepo = getCalRepo();
    const event = getEventRepo().getById(currentModalEventId);
    if (!event) return;

    // 1. Si el usuario NO está logueado al hacer clic, dispara la autenticación de Google
    if (!calRepo.isLoggedIn()) {
      try {
        showToast('Iniciando sesión con Google...', 'info');
        await calService.login();
        showToast('¡Sesión iniciada con éxito!', 'success');
        updateAuthUI();
      } catch (authErr) {
        if (authErr?.error === 'popup_closed_by_user') {
          showToast('Inicio de sesión cancelado', 'info');
        } else {
          showToast('No se pudo autenticar con Google. Verificá tu conexión.', 'error');
        }
        return;
      }
    }

    // 2. Si está logueado, verifica en localStorage si ya tiene un googleEventId asociado
    const isSynced = calRepo.isEventSynced(currentModalEventId);
    isCalendarSyncing = true;
    updateModalCalendarButton(currentModalEventId);

    if (!isSynced) {
      // POST (Añadir)
      try {
        await calService.addEvent(event);
        showToast('Evento añadido a tu Google Calendar', 'success');
      } catch (err) {
        if (err.code === 'SESSION_EXPIRED') {
          showToast('Tu sesión de Google expiró. Por favor volvé a conectarte.', 'error');
          updateAuthUI();
        } else {
          showToast(err.message || 'Error al agendar en Google Calendar', 'error');
        }
      } finally {
        isCalendarSyncing = false;
        updateModalCalendarButton(currentModalEventId);
        updateCalendarSectionInProfile();
      }
    } else {
      // DELETE (Quitar)
      try {
        await calService.removeEvent(currentModalEventId);
        showToast('Evento eliminado de tu Google Calendar', 'info');
      } catch (err) {
        if (err.code === 'SESSION_EXPIRED') {
          showToast('Tu sesión de Google expiró. Por favor volvé a conectarte.', 'error');
          updateAuthUI();
        } else {
          showToast(err.message || 'Error al quitar de Google Calendar', 'error');
        }
      } finally {
        isCalendarSyncing = false;
        updateModalCalendarButton(currentModalEventId);
        updateCalendarSectionInProfile();
      }
    }
  });

  modalShareBtn?.addEventListener('click', async () => {
    const shareData = {
      title: modalTitle.textContent,
      text: `Mirá este evento en PuntoRC: ${modalTitle.textContent}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {}
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        if (modalShareLbl) {
          const original = modalShareLbl.textContent;
          modalShareLbl.textContent = '¡Enlace copiado!';
          setTimeout(() => { modalShareLbl.textContent = original; }, 2000);
        }
      } catch (err) {}
    }
  });


  /* ------------------------------------------------------------
     9. MODAL DE PERFIL Y FAVORITOS
     ------------------------------------------------------------ */
  const profileOverlay = document.getElementById('profile-modal-overlay');
  const profileCard    = document.getElementById('profile-modal-card');
  const profileCloseBtn = document.getElementById('profile-close-btn');

  function openProfileModal() {
    if (!profileOverlay) return;
    const updateAdmin = ns.updateAdminUI || window.updateAdminUI;
    if (typeof updateAdmin === 'function') updateAdmin();
    updateFavoritesBadges();
    renderFavoritesList();
    updateCalendarSectionInProfile();
    updateAuthUI();

    profileOverlay.classList.remove('opacity-0', 'pointer-events-none');
    profileOverlay.classList.add('opacity-100', 'pointer-events-auto');
    profileCard?.classList.remove('scale-95');
    profileCard?.classList.add('scale-100');
    profileOverlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('overflow-hidden');
  }

  function closeProfileModal() {
    if (!profileOverlay) return;
    profileOverlay.classList.remove('opacity-100', 'pointer-events-auto');
    profileOverlay.classList.add('opacity-0', 'pointer-events-none');
    profileCard?.classList.remove('scale-100');
    profileCard?.classList.add('scale-95');
    profileOverlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('overflow-hidden');
  }

  profileCloseBtn?.addEventListener('click', closeProfileModal);
  profileOverlay?.addEventListener('click', (e) => {
    if (e.target === profileOverlay) closeProfileModal();
  });

  document.getElementById('btn-explore-from-profile')?.addEventListener('click', () => {
    closeProfileModal();
    document.getElementById('cartelera')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('btn-explore-from-calendar')?.addEventListener('click', () => {
    closeProfileModal();
    document.getElementById('cartelera')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('btn-favorites')?.addEventListener('click', openProfileModal);
  document.getElementById('btn-login')?.addEventListener('click', openProfileModal);

  // Botón Registrarse / Mi Perfil (Autenticación Google OAuth 2.0)
  document.getElementById('btn-register')?.addEventListener('click', async () => {
    if (!getCalRepo().isLoggedIn()) {
      try {
        showToast('Abriendo inicio de sesión con Google...', 'info');
        await getCalService().login();
        showToast('¡Sesión iniciada con éxito!', 'success');
        updateAuthUI();
        updateCalendarSectionInProfile();
        updateModalCalendarButton();
      } catch (err) {
        if (err?.error === 'popup_closed_by_user') {
          showToast('Inicio de sesión cancelado', 'info');
        } else {
          showToast('No se pudo autenticar con Google. Verificá tu conexión.', 'error');
        }
      }
    } else {
      openProfileModal();
    }
  });

  document.getElementById('profile-logout-btn')?.addEventListener('click', () => {
    getCalService().logout();
    updateAuthUI();
    updateCalendarSectionInProfile();
    updateModalCalendarButton();
    showToast('Sesión de Google cerrada', 'info');
  });

  function updateFavoritesBadges() {
    const count = getFavRepo().getAll().length;
    const countNav = document.getElementById('favorites-count');
    const countProfile = document.getElementById('profile-favorites-count-badge');
    if (countNav) countNav.textContent = String(count);
    if (countProfile) countProfile.textContent = String(count);
  }

  function renderFavoritesList() {
    const container = document.getElementById('profile-favorites-container');
    const emptyState = document.getElementById('profile-favorites-empty');
    if (!container || !emptyState) return;

    const favIds = getFavRepo().getAll();
    const allEvents = getEventRepo().getAll();
    const favEvents = allEvents.filter((e) => favIds.includes(String(e.id)));

    if (favEvents.length === 0) {
      container.innerHTML = '';
      emptyState.classList.remove('hidden');
      emptyState.classList.add('flex');
      return;
    }

    emptyState.classList.remove('flex');
    emptyState.classList.add('hidden');

    container.innerHTML = favEvents.map((ev) => {
      return `
      <div class="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-purple-500/40 transition-colors">
        <img
          src="${ev.image}"
          alt="${ev.title}"
          class="w-20 h-20 rounded-xl object-cover shrink-0"
        />
        <div class="flex-1 min-w-0">
          <span class="inline-flex items-center gap-1 text-[10px] font-montserrat font-bold text-purple-600 dark:text-purple-400 uppercase">
            ${ev.category}
          </span>
          <h4 class="font-montserrat font-bold text-sm text-slate-900 dark:text-white truncate">
            ${ev.title}
          </h4>
          <p class="font-inter text-xs text-slate-500 dark:text-zinc-400 truncate mt-0.5">
            ${ev.date}
          </p>
          <div class="flex items-center gap-2 mt-2">
            <button
              type="button"
              data-fav-view-id="${ev.id}"
              class="px-3 py-1 text-[11px] font-montserrat font-bold rounded-lg bg-purple-600 text-white shadow-sm hover:bg-purple-500 transition-colors cursor-pointer"
            >
              Ver
            </button>
            <button
              type="button"
              data-fav-remove-id="${ev.id}"
              class="px-2 py-1 text-[11px] font-inter text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
            >
              Quitar
            </button>
          </div>
        </div>
      </div>
      `;
    }).join('');

    container.querySelectorAll('[data-fav-view-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        closeProfileModal();
        openEventModal(btn.getAttribute('data-fav-view-id'));
      });
    });

    container.querySelectorAll('[data-fav-remove-id]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-fav-remove-id');
        getFavRepo().remove(id);
        updateFavoritesBadges();
        renderFavoritesList();
        renderEventsGrid();
        showToast('Eliminado de tus favoritos', 'info');
      });
    });
  }

  /* ------------------------------------------------------------
     9B. AUTENTICACIÓN GOOGLE Y EVENTOS AGENDADOS EN GOOGLE CALENDAR
     ------------------------------------------------------------ */
  function updateAuthUI() {
    const calRepo = getCalRepo();
    const isLoggedIn = calRepo.isLoggedIn();
    const session = calRepo.getSession();
    const user = session?.user || {};

    // 1. Botones del Header
    const btnRegister = document.getElementById('btn-register');
    const btnRegisterText = document.getElementById('btn-register-text');
    const btnRegisterIcon = document.getElementById('btn-register-icon');
    const btnRegisterAvatar = document.getElementById('btn-register-avatar');
    const btnLogin = document.getElementById('btn-login');

    if (btnRegister && btnRegisterText) {
      if (isLoggedIn) {
        btnRegisterText.textContent = user.name ? 'Mi Perfil' : 'Mi Perfil';
        btnRegister.setAttribute('aria-label', `Mi Perfil (${user.name || 'Conectado'})`);
        if (user.picture && btnRegisterAvatar) {
          btnRegisterAvatar.innerHTML = `<img src="${user.picture}" alt="${user.name || 'Avatar'}" class="w-full h-full object-cover rounded-full" />`;
          btnRegisterAvatar.classList.remove('hidden');
          btnRegisterIcon?.classList.add('hidden');
        } else {
          btnRegisterAvatar?.classList.add('hidden');
          if (btnRegisterIcon) {
            btnRegisterIcon.classList.remove('hidden');
            btnRegisterIcon.innerHTML = `
              <svg class="w-4 h-4 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            `;
          }
        }
      } else {
        btnRegisterText.textContent = 'Registrarse';
        btnRegister.setAttribute('aria-label', 'Registrarse con Google');
        btnRegisterAvatar?.classList.add('hidden');
        if (btnRegisterIcon) {
          btnRegisterIcon.classList.remove('hidden');
          btnRegisterIcon.innerHTML = `
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.545 10.239v3.821h5.445c-0.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866 0.549 3.921 1.453l2.814-2.814c-1.79-1.677-4.184-2.702-6.735-2.702-5.522 0-10 4.478-10 10s4.478 10 10 10c8.396 0 10.249-7.85 9.426-11.748l-9.426 0.050z"/>
            </svg>
          `;
        }
      }
    }

    if (btnLogin) {
      btnLogin.classList.add('hidden');
    }

    // 2. Cabecera del Modal de Perfil
    const profileTitle = document.getElementById('profile-modal-title');
    const profileBadge = document.getElementById('profile-user-badge');
    const profileSub   = document.getElementById('profile-user-subtitle');
    const profileImg   = document.getElementById('profile-avatar-img');
    const profileFbk   = document.getElementById('profile-avatar-fallback');
    const profileLogout = document.getElementById('profile-logout-btn');

    if (profileTitle && profileBadge && profileSub) {
      if (isLoggedIn) {
        profileTitle.textContent = user.name || 'Mi Perfil';
        profileBadge.textContent = 'Google Conectado';
        profileBadge.className = 'px-2 py-0.5 text-[10px] font-montserrat font-bold uppercase rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40';
        profileSub.textContent = user.email || 'Río Cuarto, Córdoba · Cuenta vinculada a Google Calendar';

        if (user.picture && profileImg && profileFbk) {
          profileImg.src = user.picture;
          profileImg.classList.remove('hidden');
          profileFbk.classList.add('hidden');
        } else if (profileImg && profileFbk) {
          profileImg.classList.add('hidden');
          profileFbk.classList.remove('hidden');
          profileFbk.textContent = user.name ? user.name.charAt(0).toUpperCase() : 'G';
        }

        profileLogout?.classList.remove('hidden');
        profileLogout?.classList.add('flex');
      } else {
        profileTitle.textContent = 'Mi Perfil';
        profileBadge.textContent = 'Explorador';
        profileBadge.className = 'px-2 py-0.5 text-[10px] font-montserrat font-bold uppercase rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/40';
        profileSub.textContent = 'Río Cuarto, Córdoba · Cartelera Cultural';

        if (profileImg && profileFbk) {
          profileImg.classList.add('hidden');
          profileFbk.classList.remove('hidden');
          profileFbk.textContent = 'RC';
        }

        profileLogout?.classList.remove('flex');
        profileLogout?.classList.add('hidden');
      }
    }
  }

  function updateCalendarSectionInProfile() {
    const countBadge = document.getElementById('profile-calendar-count-badge');
    const container  = document.getElementById('profile-calendar-container');
    const emptyState = document.getElementById('profile-calendar-empty');
    const authStatus = document.getElementById('profile-calendar-auth-status');
    const emptyTitle = document.getElementById('profile-calendar-empty-title');
    const emptyDesc  = document.getElementById('profile-calendar-empty-desc');

    const calRepo = getCalRepo();
    const syncedIds = calRepo.getAllSyncedIds();

    if (countBadge) {
      countBadge.textContent = String(syncedIds.length);
    }

    const isLoggedIn = calRepo.isLoggedIn();

    // Actualizar estado de autenticación en la cabecera de la sección
    if (authStatus) {
      if (isLoggedIn) {
        authStatus.innerHTML = `
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-inter font-medium text-emerald-700 bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Sincronización Activa
          </span>
        `;
      } else {
        authStatus.innerHTML = `
          <button
            type="button"
            id="btn-calendar-connect-status"
            class="px-3 py-1.5 text-xs font-montserrat font-bold rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.545 10.239v3.821h5.445c-0.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866 0.549 3.921 1.453l2.814-2.814c-1.79-1.677-4.184-2.702-6.735-2.702-5.522 0-10 4.478-10 10s4.478 10 10 10c8.396 0 10.249-7.85 9.426-11.748l-9.426 0.050z"/>
            </svg>
            Conectar Google
          </button>
        `;
        document.getElementById('btn-calendar-connect-status')?.addEventListener('click', async () => {
          try {
            showToast('Iniciando sesión con Google...', 'info');
            await getCalService().login();
            showToast('¡Sesión iniciada con éxito!', 'success');
            updateAuthUI();
            updateCalendarSectionInProfile();
          } catch (e) {
            showToast('No se pudo conectar con Google', 'error');
          }
        });
      }
    }

    if (!container || !emptyState) return;

    // Cruzar eventos de Punto RC con los IDs guardados en localStorage
    const allEvents = getEventRepo().getAll();
    const scheduledEvents = allEvents.filter((e) => syncedIds.includes(String(e.id)));

    if (scheduledEvents.length === 0) {
      container.innerHTML = '';
      emptyState.classList.remove('hidden');
      emptyState.classList.add('flex');
      if (emptyTitle) {
        emptyTitle.textContent = isLoggedIn
          ? 'No tenés eventos agendados en Google Calendar'
          : 'Conectá tu cuenta de Google Calendar';
      }
      if (emptyDesc) {
        emptyDesc.textContent = isLoggedIn
          ? 'Abrí cualquier evento cultural en la cartelera y tocá en "Añadir a Google Calendar" para sincronizarlo directamente con tu cuenta.'
          : 'Iniciá sesión para sincronizar automáticamente los eventos culturales de Río Cuarto con tu calendario personal de Google.';
      }
      return;
    }

    emptyState.classList.remove('flex');
    emptyState.classList.add('hidden');

    container.innerHTML = scheduledEvents.map((ev) => {
      return `
      <div class="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-purple-500/40 transition-colors">
        <img
          src="${ev.image}"
          alt="${ev.title}"
          class="w-20 h-20 rounded-xl object-cover shrink-0"
        />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 mb-0.5">
            <span class="inline-flex items-center gap-1 text-[10px] font-montserrat font-bold text-purple-600 dark:text-purple-400 uppercase">
              ${ev.category}
            </span>
            <span class="text-[10px] font-inter text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
              Sincronizado
            </span>
          </div>
          <h4 class="font-montserrat font-bold text-sm text-slate-900 dark:text-white truncate">
            ${ev.title}
          </h4>
          <p class="font-inter text-xs text-slate-500 dark:text-zinc-400 truncate mt-0.5">
            ${ev.date}
          </p>
          <div class="flex items-center gap-2 mt-2">
            <button
              type="button"
              data-cal-view-id="${ev.id}"
              class="px-3 py-1 text-[11px] font-montserrat font-bold rounded-lg bg-purple-600 text-white shadow-sm hover:bg-purple-500 transition-colors cursor-pointer"
            >
              Ver
            </button>
            <button
              type="button"
              data-cal-remove-id="${ev.id}"
              class="px-2 py-1 text-[11px] font-inter text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer flex items-center gap-1"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Quitar
            </button>
          </div>
        </div>
      </div>
      `;
    }).join('');

    container.querySelectorAll('[data-cal-view-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        closeProfileModal();
        openEventModal(btn.getAttribute('data-cal-view-id'));
      });
    });

    container.querySelectorAll('[data-cal-remove-id]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-cal-remove-id');
        btn.disabled = true;
        const originalContent = btn.innerHTML;
        btn.textContent = 'Quitando...';
        try {
          await getCalService().removeEvent(id);
          showToast('Evento eliminado de tu Google Calendar', 'info');
        } catch (err) {
          if (err.code === 'SESSION_EXPIRED') {
            showToast('Tu sesión de Google expiró. Por favor volvé a conectarte.', 'error');
            updateAuthUI();
          } else {
            showToast(err.message || 'Error al quitar de Google Calendar', 'error');
          }
          btn.disabled = false;
          btn.innerHTML = originalContent;
        } finally {
          updateCalendarSectionInProfile();
          updateModalCalendarButton();
        }
      });
    });
  }


  /* ------------------------------------------------------------
     10. TECLADO ACCESIBLE (ESCAPE GLOBAL)
     ------------------------------------------------------------ */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const crudOverlay = document.getElementById('crud-edit-modal');
      if (crudOverlay && !crudOverlay.classList.contains('opacity-0')) {
        const closeModal = ns.closeCrudModal || window.closeCrudModal;
        if (typeof closeModal === 'function') closeModal();
      } else if (profileOverlay && !profileOverlay.classList.contains('opacity-0')) {
        closeProfileModal();
      } else if (modalOverlay && !modalOverlay.classList.contains('opacity-0')) {
        closeEventModal();
      }
    }
  });


  /* ------------------------------------------------------------
     11. BOTTOM NAVIGATION BAR (MÓVIL)
     ------------------------------------------------------------ */
  const bottomTabs = document.querySelectorAll('.bottom-nav-tab');

  function setActiveTab(activeBtn) {
    bottomTabs.forEach((tab) => {
      tab.classList.remove('text-purple-600', 'dark:text-purple-400');
      tab.classList.add('text-slate-500', 'dark:text-zinc-500');
      tab.removeAttribute('aria-current');
    });
    activeBtn.classList.remove('text-slate-500', 'dark:text-zinc-500');
    activeBtn.classList.add('text-purple-600', 'dark:text-purple-400');
    activeBtn.setAttribute('aria-current', 'page');
  }

  document.getElementById('bottom-nav-home')?.addEventListener('click', (e) => {
    setActiveTab(e.currentTarget);
    document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('bottom-nav-explore')?.addEventListener('click', (e) => {
    setActiveTab(e.currentTarget);
    document.getElementById('cartelera')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('bottom-nav-map')?.addEventListener('click', () => {
    showToast('🗺️ Mapa interactivo geolocalizado en desarrollo (Fase 2)', 'info');
  });

  document.getElementById('btn-open-map-desktop')?.addEventListener('click', () => {
    showToast('🗺️ Mapa interactivo geolocalizado en desarrollo (Fase 2)', 'info');
  });

  document.getElementById('bottom-nav-profile')?.addEventListener('click', (e) => {
    setActiveTab(e.currentTarget);
    openProfileModal();
  });


  /* ------------------------------------------------------------
     12. BOTÓN FLOTANTE VOLVER ARRIBA
     ------------------------------------------------------------ */
  const scrollTopBtn = document.getElementById('scroll-to-top');
  const SCROLL_THRESHOLD = 300;

  function toggleScrollTopBtn() {
    if (!scrollTopBtn) return;
    if (window.scrollY > SCROLL_THRESHOLD) {
      scrollTopBtn.classList.remove('opacity-0', 'translate-y-10', 'pointer-events-none');
      scrollTopBtn.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto');
    } else {
      scrollTopBtn.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto');
      scrollTopBtn.classList.add('opacity-0', 'translate-y-10', 'pointer-events-none');
    }
  }

  window.addEventListener('scroll', toggleScrollTopBtn, { passive: true });

  scrollTopBtn?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });


  /* ------------------------------------------------------------
     13. FORMULARIO DE SUGERENCIA Y LOGO NAVBAR
     ------------------------------------------------------------ */
  document.getElementById('suggestion-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    showToast('¡Gracias! Tu sugerencia fue enviada para revisión.', 'success');
    e.target.reset();
  });

  document.getElementById('navbar-brand-logo')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });


  /* ------------------------------------------------------------
     14. INICIALIZACIÓN GENERAL DE LA APLICACIÓN
     ------------------------------------------------------------ */
  function initializeApp() {
    const initAdmin = ns.initAdminModule || window.initAdminModule;
    if (typeof initAdmin === 'function') initAdmin();

    // Intentar inicializar cliente OAuth 2.0 si GIS ya cargó
    const calService = getCalService();
    if (calService && typeof calService.init === 'function') {
      calService.init();
    }

    renderHeroSlider();
    initHeroArrowAutoHide();
    updateFavoritesBadges();
    updateAuthUI();
    updateCalendarSectionInProfile();

    const updateAdmin = ns.updateAdminUI || window.updateAdminUI;
    if (typeof updateAdmin === 'function') updateAdmin();

    renderEventsGrid();
  }

  // Reactividad ante eventos de sesión o sincronización de Google Calendar
  window.addEventListener('puntorc:auth-changed', () => {
    updateAuthUI();
    updateCalendarSectionInProfile();
    updateModalCalendarButton();
  });

  window.addEventListener('puntorc:calendar-sync-changed', () => {
    updateCalendarSectionInProfile();
    updateModalCalendarButton();
  });

  document.addEventListener('DOMContentLoaded', initializeApp);

  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    initializeApp();
  }

  // Exportar al namespace y al objeto window
  ns.hideLoader = hideLoader;
  ns.renderHeroSlider = renderHeroSlider;
  ns.renderEventsGrid = renderEventsGrid;
  ns.openEventModal = openEventModal;
  ns.closeEventModal = closeEventModal;
  ns.openProfileModal = openProfileModal;
  ns.closeProfileModal = closeProfileModal;
  ns.renderFavoritesList = renderFavoritesList;
  ns.updateCalendarSectionInProfile = updateCalendarSectionInProfile;
  ns.updateModalCalendarButton = updateModalCalendarButton;
  ns.updateAuthUI = updateAuthUI;
  ns.showToast = showToast;
  ns.applyTheme = applyTheme;
  ns.toggleTheme = toggleTheme;
  ns.updateFavoritesBadges = updateFavoritesBadges;
  ns.initHeroArrowAutoHide = initHeroArrowAutoHide;

  window.hideLoader = hideLoader;
  window.renderHeroSlider = renderHeroSlider;
  window.renderEventsGrid = renderEventsGrid;
  window.openEventModal = openEventModal;
  window.closeEventModal = closeEventModal;
  window.openProfileModal = openProfileModal;
  window.closeProfileModal = closeProfileModal;
  window.renderFavoritesList = renderFavoritesList;
  window.updateCalendarSectionInProfile = updateCalendarSectionInProfile;
  window.updateModalCalendarButton = updateModalCalendarButton;
  window.updateAuthUI = updateAuthUI;
  window.showToast = showToast;
  window.applyTheme = applyTheme;
  window.toggleTheme = toggleTheme;
  window.updateFavoritesBadges = updateFavoritesBadges;
  window.initHeroArrowAutoHide = initHeroArrowAutoHide;
})(typeof window !== 'undefined' ? window : global);
