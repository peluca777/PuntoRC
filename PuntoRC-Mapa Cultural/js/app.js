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
  const getCatKey = (cat) => (ns.getCategoryKey || window.getCategoryKey ? (ns.getCategoryKey || window.getCategoryKey)(cat) : 'musica');
  const getCatIcon = (key) => (ns.getCategoryIcon || window.getCategoryIcon ? (ns.getCategoryIcon || window.getCategoryIcon)(key) : '');
  const getStatus = (st) => (ns.getStatusBadge || window.getStatusBadge ? (ns.getStatusBadge || window.getStatusBadge)(st) : '');
  const getIsAdminMode = () => (typeof ns.isAdminMode !== 'undefined' ? ns.isAdminMode : (typeof window.isAdminMode !== 'undefined' ? window.isAdminMode : false));

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

  // Inicializar CalendarRepository si aún no fue definido por repository.js
  if (!ns.CalendarRepository && !window.CalendarRepository) {
    const CalendarRepository = {
      _syncKey: 'puntorc_google_calendar_events',
      _sessionKey: 'puntorc_google_session',
      _syncedMap: null,
      _session: null,
      _init() {
        if (this._syncedMap === null) {
          try {
            const s = localStorage.getItem(this._syncKey);
            this._syncedMap = s ? JSON.parse(s) : {};
            if (typeof this._syncedMap !== 'object' || Array.isArray(this._syncedMap) || this._syncedMap === null) this._syncedMap = {};
          } catch(e) { this._syncedMap = {}; }
        }
        if (this._session === null) {
          try {
            const s = localStorage.getItem(this._sessionKey);
            this._session = s ? JSON.parse(s) : null;
          } catch(e) { this._session = null; }
        }
      },
      getSession() { this._init(); return this._session ? { ...this._session } : null; },
      saveSession(d) { this._init(); this._session = { ...d }; try { localStorage.setItem(this._sessionKey, JSON.stringify(this._session)); } catch(e){} return this._session; },
      clearSession() { this._init(); this._session = null; try { localStorage.removeItem(this._sessionKey); } catch(e){} },
      isLoggedIn() { this._init(); return Boolean(this._session && this._session.access_token); },
      getAccessToken() { this._init(); return this._session ? this._session.access_token : null; },
      getGoogleEventId(id) { this._init(); return this._syncedMap[String(id)] || null; },
      isEventSynced(id) { this._init(); return Boolean(this._syncedMap[String(id)]); },
      setGoogleEventId(id, gid) { this._init(); this._syncedMap[String(id)] = String(gid); try { localStorage.setItem(this._syncKey, JSON.stringify(this._syncedMap)); } catch(e){} },
      removeGoogleEventId(id) { this._init(); delete this._syncedMap[String(id)]; try { localStorage.setItem(this._syncKey, JSON.stringify(this._syncedMap)); } catch(e){} },
      getAllSyncedIds() { this._init(); return Object.keys(this._syncedMap); }
    };
    ns.CalendarRepository = CalendarRepository;
    window.CalendarRepository = CalendarRepository;
  }

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
     3. PANELES MÓVILES (BÚSQUEDA Y NOTIFICACIONES)
     ------------------------------------------------------------ */
  const btnSearchMobile   = document.getElementById('btn-search-mobile');
  const mobileSearchPanel = document.getElementById('mobile-search-panel');
  const searchInputMobile = document.getElementById('search-events-mobile');
  const searchInputDesktop = document.getElementById('search-events');
  const btnNotifMobile    = document.getElementById('btn-notifications-mobile');
  const mobileNotifPanel  = document.getElementById('mobile-notif-panel');
  const bottomNavExplore  = document.getElementById('bottom-nav-explore');
  const bottomNavHome     = document.getElementById('bottom-nav-home');

  function toggleMobileNotifications(forceOpen) {
    if (!mobileNotifPanel) return;
    const isOpening = (typeof forceOpen === 'boolean') ? forceOpen : mobileNotifPanel.classList.contains('hidden');
    if (isOpening) {
      toggleMobileSearch(false);
      mobileNotifPanel.classList.remove('hidden');
      btnNotifMobile?.setAttribute('aria-expanded', 'true');
    } else {
      mobileNotifPanel.classList.add('hidden');
      btnNotifMobile?.setAttribute('aria-expanded', 'false');
    }
  }

  function toggleMobileSearch(forceOpen) {
    if (!mobileSearchPanel) return;
    const isOpening = (typeof forceOpen === 'boolean') ? forceOpen : mobileSearchPanel.classList.contains('hidden');
    if (isOpening) {
      toggleMobileNotifications(false);
      mobileSearchPanel.classList.remove('hidden');
      btnSearchMobile?.setAttribute('aria-expanded', 'true');
      searchInputMobile?.focus();
    } else {
      mobileSearchPanel.classList.add('hidden');
      btnSearchMobile?.setAttribute('aria-expanded', 'false');
      // Si el tab Explorar estaba activo al cerrar el panel, regresar a Inicio
      if (bottomNavExplore?.getAttribute('aria-current') === 'page' && bottomNavHome) {
        setActiveTab(bottomNavHome);
      }
    }
  }

  btnSearchMobile?.addEventListener('click', () => {
    toggleMobileSearch();
  });

  btnNotifMobile?.addEventListener('click', () => {
    toggleMobileNotifications();
  });

  document.addEventListener('click', (e) => {
    const header = document.querySelector('header');
    const inHeader = header && header.contains(e.target);
    const inExploreTab = bottomNavExplore && bottomNavExplore.contains(e.target);

    // Evitar cierre accidental si el click proviene del header o del tab Explorar
    if (!inHeader && !inExploreTab) {
      if (mobileSearchPanel && !mobileSearchPanel.classList.contains('hidden')) {
        toggleMobileSearch(false);
      }
      if (mobileNotifPanel && !mobileNotifPanel.classList.contains('hidden')) {
        toggleMobileNotifications(false);
      }
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

      // Reemplazar resolución en URLs de Unsplash a 1920px para máxima nitidez en el render
      const heroImg = (ev.image || '').replace(/(images\.unsplash\.com\/[^\s]+)w=\d+/, '$1w=1920');

      // Formatear fecha para la pill superior derecha
      const parsed = splitEventDate(ev.date);
      const heroDateText = parsed
        ? `${parsed.dayOfWeek ? parsed.dayOfWeek + ' ' : ''}${parsed.dayNumber} ${parsed.month}${parsed.time ? ' · ' + parsed.time : ''}`
        : ev.date;

      const slide = document.createElement('article');
      slide.id = `hero-slide-${ev.id}`;
      slide.className = `hero-slide absolute inset-0 bg-zinc-950 rounded-3xl overflow-hidden ${isFirst ? '' : 'opacity-0 pointer-events-none'} transition-opacity duration-700 ease-in-out`;
      slide.setAttribute('aria-label', ev.title);
      if (!isFirst) {
        slide.setAttribute('aria-hidden', 'true');
        slide.setAttribute('inert', '');
      }

      slide.innerHTML = `
        <!-- Imagen nítida limpia sin overlays ni blur -->
        <img
          src="${heroImg}"
          alt="${ev.title}"
          class="absolute inset-0 w-full h-full object-cover"
        />

        <!-- Pills superiores flotantes -->
        <div class="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 flex items-center justify-between gap-2 pointer-events-none z-[2]">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-montserrat font-bold bg-purple-600 text-white rounded-full shadow-md shadow-purple-500/40">
            ${catIcon}
            <span>${ev.category}</span>
          </span>
          <div class="flex items-center gap-1.5">
            ${ev.discount ? `<span class="inline-flex items-center px-2 py-0.5 text-xs font-montserrat font-bold bg-emerald-600 text-white rounded-full shadow-sm">${ev.discount}</span>` : ''}
            <span class="inline-flex items-center px-3 py-1 text-xs font-montserrat font-semibold bg-black/65 backdrop-blur-sm text-white rounded-full border border-white/10 shadow-md">
              ${heroDateText}
            </span>
          </div>
        </div>

        <!-- Todo el slide clickeable -->
        <button
          type="button"
          data-event-id="${ev.id}"
          aria-label="Ver detalles de ${ev.title}"
          class="btn-event-details absolute inset-0 z-[1] cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        ></button>
      `;

      const arrowsContainer = document.getElementById('slider-arrows');
      if (arrowsContainer && arrowsContainer.parentNode === sliderContainer) {
        sliderContainer.insertBefore(slide, arrowsContainer);
      } else {
        sliderContainer.appendChild(slide);
      }

      const dot = document.createElement('button');
      dot.type = 'button';
      dot.role = 'tab';
      dot.setAttribute('aria-selected', isFirst ? 'true' : 'false');
      dot.setAttribute('aria-label', `Ir al slide ${idx + 1}`);
      dot.className = `slider-dot h-2.5 rounded-full transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/70 ${isFirst ? 'w-6 bg-purple-600 dark:bg-purple-500' : 'w-2.5 bg-zinc-300 dark:bg-zinc-700'}`;
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
    const prevSlide = heroSlidesElements[currentSlide];
    const prevDot = heroDotsElements[currentSlide];

    if (prevSlide) {
      prevSlide.classList.add('opacity-0', 'pointer-events-none');
      prevSlide.setAttribute('aria-hidden', 'true');
      prevSlide.setAttribute('inert', '');
    }
    if (prevDot) {
      prevDot.classList.remove('w-6', 'bg-purple-600', 'dark:bg-purple-500');
      prevDot.classList.add('w-2.5', 'bg-zinc-300', 'dark:bg-zinc-700');
      prevDot.setAttribute('aria-selected', 'false');
    }

    currentSlide = (index + heroSlidesElements.length) % heroSlidesElements.length;

    const nextSlide = heroSlidesElements[currentSlide];
    const nextDot = heroDotsElements[currentSlide];

    if (nextSlide) {
      nextSlide.classList.remove('opacity-0', 'pointer-events-none');
      nextSlide.removeAttribute('aria-hidden');
      nextSlide.removeAttribute('inert');
    }
    if (nextDot) {
      nextDot.classList.remove('w-2.5', 'bg-zinc-300', 'dark:bg-zinc-700');
      nextDot.classList.add('w-6', 'bg-purple-600', 'dark:bg-purple-500');
      nextDot.setAttribute('aria-selected', 'true');
    }
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
  const INACTIVE_FILTER_CLASSES = ['bg-white/5', 'border-white/10', 'text-zinc-400', 'font-medium'];
  const ACTIVE_FILTER_CLASSES   = ['bg-purple-900/40', 'border-purple-500', 'text-white', 'shadow-[0_0_15px_rgba(168,85,247,0.2)]', 'font-bold'];

  let currentCategoryFilter = 'todos';
  let searchQuery = '';
  let currentSort = 'date-asc';

  function splitEventDate(str) {
    if (!str || typeof str !== 'string') return null;
    const s = str.trim();

    // Extraer día de semana (3 letras)
    const dowMatch = s.match(/(lunes|martes|mi[ée]rcoles|jueves|viernes|s[aá]bado|domingo|lun|mar|mi[ée]|jue|vie|s[aá]b|dom)/i);
    let dayOfWeek = '';
    if (dowMatch) {
      const d = dowMatch[1].toLowerCase();
      if (d.startsWith('lun')) dayOfWeek = 'LUN';
      else if (d.startsWith('mar')) dayOfWeek = 'MAR';
      else if (d.startsWith('mi')) dayOfWeek = 'MIÉ';
      else if (d.startsWith('jue')) dayOfWeek = 'JUE';
      else if (d.startsWith('vie')) dayOfWeek = 'VIE';
      else if (d.startsWith('s')) dayOfWeek = 'SÁB';
      else if (d.startsWith('dom')) dayOfWeek = 'DOM';
    }

    // Extraer día numérico y mes vinculados (ej. "20 Sep", "20 de Septiembre", "Sep 20")
    const dmRegex = /\b([1-9]|[12]\d|3[01])\s*(?:de\s*)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre|ene|feb|mar|abr|may|jun|jul|ago|sep|set|oct|nov|dic)\b/i;
    const mdRegex = /\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre|ene|feb|mar|abr|may|jun|jul|ago|sep|set|oct|nov|dic)\s+([1-9]|[12]\d|3[01])\b/i;

    let dayNumber = '';
    let monthRaw = '';

    const dmMatch = s.match(dmRegex);
    const mdMatch = s.match(mdRegex);

    if (dmMatch) {
      dayNumber = dmMatch[1];
      monthRaw = dmMatch[2].toLowerCase();
    } else if (mdMatch) {
      monthRaw = mdMatch[1].toLowerCase();
      dayNumber = mdMatch[2];
    } else {
      // Fallback si día y mes están separados
      const dayNumMatch = s.match(/\b([1-9]|[12]\d|3[01])\b(?!\s*:\s*\d{2})/);
      const isolatedMonthMatch = s.match(/\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre|ene|feb|abr|may|jun|jul|ago|sep|set|oct|nov|dic)\b/i);
      if (dayNumMatch && isolatedMonthMatch) {
        dayNumber = dayNumMatch[1];
        monthRaw = isolatedMonthMatch[1].toLowerCase();
      }
    }

    if (!dayNumber || !monthRaw) return null;

    const monthMap = {
      enero: 'ENE', ene: 'ENE',
      febrero: 'FEB', feb: 'FEB',
      marzo: 'MAR', mar: 'MAR',
      abril: 'ABR', abr: 'ABR',
      mayo: 'MAY', may: 'MAY',
      junio: 'JUN', jun: 'JUN',
      julio: 'JUL', jul: 'JUL',
      agosto: 'AGO', ago: 'AGO',
      septiembre: 'SEP', setiembre: 'SEP', sep: 'SEP', set: 'SEP',
      octubre: 'OCT', oct: 'OCT',
      noviembre: 'NOV', nov: 'NOV',
      diciembre: 'DIC', dic: 'DIC'
    };
    const month = monthMap[monthRaw] || monthRaw.substring(0, 3).toUpperCase();

    // Extraer hora "22:00"
    const timeMatch = s.match(/\b(\d{1,2}:\d{2})\b/);
    const time = timeMatch ? timeMatch[1] : '';

    return {
      dayOfWeek,
      dayNumber,
      month,
      time
    };
  }

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
      if (isAll) {
        b.classList.remove(...INACTIVE_FILTER_CLASSES);
        b.classList.add(...ACTIVE_FILTER_CLASSES);
      } else {
        b.classList.remove(...ACTIVE_FILTER_CLASSES);
        b.classList.add(...INACTIVE_FILTER_CLASSES);
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
          icon.classList.remove('text-purple-400');
          icon.classList.add('text-zinc-400');
        }
      });

      btn.classList.remove(...INACTIVE_FILTER_CLASSES);
      btn.classList.add(...ACTIVE_FILTER_CLASSES);
      btn.setAttribute('aria-pressed', 'true');
      const activeIcon = btn.querySelector('svg');
      if (activeIcon) {
        activeIcon.classList.remove('text-zinc-400');
        activeIcon.classList.add('text-purple-400');
      }

      currentCategoryFilter = btn.getAttribute('data-filter') || 'todos';
      renderEventsGrid();
    });
  });

  function getEventSortKey(ev) {
    const parsed = splitEventDate(ev.date);
    if (!parsed || !parsed.dayNumber || !parsed.month) {
      return 999999999999;
    }
    const monthMap = {
      ENE: 0, FEB: 1, MAR: 2, ABR: 3, MAY: 4, JUN: 5,
      JUL: 6, AGO: 7, SEP: 8, OCT: 9, NOV: 10, DIC: 11
    };
    const m = monthMap[parsed.month] ?? 12;
    const yearMatch = (ev.date || '').match(/\b(20\d\d)\b/);
    const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
    const day = parseInt(parsed.dayNumber, 10) || 1;

    let hour = 0;
    let minute = 0;
    if (parsed.time) {
      const parts = parsed.time.split(':');
      hour = parseInt(parts[0], 10) || 0;
      minute = parseInt(parts[1], 10) || 0;
    }

    return new Date(year, m, day, hour, minute).getTime();
  }

  function renderSingleEventCard(ev) {
    const isFav = getFavRepo().isFavorite(ev.id);
    const catKey = ev.categoryKey || getCatKey(ev.category);
    // Reemplazo de color y tamaño en el SVG original
    const iconSvg = getCatIcon(catKey)
      .replace('text-white', 'text-purple-500 dark:text-purple-400')
      .replace('w-3.5 h-3.5', 'w-4 h-4');

    // Precio: gratis o primer token en violeta bold
    const isFree = /gratuit|libre/i.test(ev.price || '');
    const priceHtml = isFree
      ? '<span class="px-2 py-0.5 text-[10px] font-montserrat font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Gratis</span>'
      : `<span class="text-xs font-montserrat font-bold text-purple-600 dark:text-purple-400">${ev.price ? ev.price.split(' ')[0] : ''}</span>`;

    // Estado: solo si es 'Últimas entradas' se muestra en fila mini
    const statusHtml = (ev.status === 'Últimas entradas') ? getStatus(ev.status) : '';

    // Cinta AGOTADO sobre la miniatura
    const soldOutRibbon = (ev.status === 'Agotado') ? `
      <div class="absolute inset-x-0 bottom-0 py-0.5 bg-rose-600/90 text-white font-montserrat font-extrabold text-[9px] uppercase text-center tracking-wider shadow-sm z-10">
        AGOTADO
      </div>
    ` : '';

    // Bloque fecha a la derecha con borde izquierdo
    const parsedDate = splitEventDate(ev.date);
    const dateHtml = parsedDate ? `
      <div class="shrink-0 w-12 sm:w-16 border-l border-zinc-200 dark:border-zinc-800 pl-2 text-center flex flex-col justify-center items-center">
        ${parsedDate.dayOfWeek ? `<span class="text-[10px] uppercase font-montserrat font-medium text-zinc-500 dark:text-zinc-400 leading-tight">${parsedDate.dayOfWeek}</span>` : ''}
        <span class="font-montserrat font-extrabold text-2xl text-purple-600 dark:text-purple-400 leading-none my-0.5">${parsedDate.dayNumber}</span>
        <span class="text-[11px] font-montserrat font-bold text-purple-600 dark:text-purple-400 uppercase leading-tight">${parsedDate.month}</span>
        ${parsedDate.time ? `<span class="text-[10px] font-inter text-zinc-400 dark:text-zinc-500 hidden sm:block mt-0.5">${parsedDate.time}</span>` : ''}
      </div>
    ` : `
      <div class="shrink-0 w-14 sm:w-16 border-l border-zinc-200 dark:border-zinc-800 pl-2 text-center flex flex-col justify-center items-center">
        <span class="text-[11px] font-montserrat font-semibold text-purple-600 dark:text-purple-400 leading-tight break-words">${ev.date}</span>
      </div>
    `;

    return `
    <article
      data-event-id="${ev.id}"
      class="event-card group relative flex items-stretch gap-2.5 sm:gap-3 p-2 rounded-2xl min-h-[120px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-900/20 hover:border-purple-500/40 transition-all duration-300 cursor-pointer"
      role="listitem"
      aria-label="Evento: ${ev.title}"
    >
      <!-- [MINIATURA AMPLIA CON MARGEN CONCÉNTRICO] -->
      <div class="self-stretch w-24 sm:w-40 min-h-[104px] shrink-0 rounded-lg overflow-hidden relative">
        <img
          src="${ev.image}"
          alt="${ev.title}"
          loading="lazy"
          class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        ${soldOutRibbon}
        ${getIsAdminMode() ? `
          <button
            type="button"
            data-admin-edit-id="${ev.id}"
            aria-label="Editar evento ${ev.title}"
            class="btn-admin-edit-card absolute top-1.5 left-1.5 px-2 py-0.5 text-[10px] font-montserrat font-bold rounded-md bg-amber-500 hover:bg-amber-400 text-white shadow-md shadow-amber-500/30 active:scale-95 transition-all cursor-pointer z-20"
          >
            ✏️ Editar
          </button>
        ` : ''}
      </div>

      <!-- [INFO] -->
      <div class="flex-1 min-w-0 flex flex-col justify-center gap-0.5 sm:gap-1">
        <h3 class="font-montserrat font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-snug line-clamp-2">
          ${ev.title}
        </h3>
        <div class="flex items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-400">
          ${iconSvg}
          <span class="truncate">${ev.category}</span>
        </div>
        <div class="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
          <svg class="w-3.5 h-3.5 text-purple-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span class="truncate">${ev.location}</span>
        </div>
        <div class="flex items-center gap-2 mt-0.5">
          ${priceHtml}
          ${statusHtml}
        </div>
      </div>

      <!-- [FECHA] -->
      ${dateHtml}

      <!-- [ACCIONES] -->
      <div class="shrink-0 flex flex-col items-center justify-between py-0.5">
        <!-- ARRIBA: botón guardar .favorite-btn[data-fav-id] con ícono BOOKMARK -->
        <button
          type="button"
          data-fav-id="${ev.id}"
          aria-label="${isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}"
          aria-pressed="${isFav ? 'true' : 'false'}"
          class="favorite-btn p-1.5 rounded-lg text-slate-400 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer"
        >
          <svg class="w-4 h-4 sm:w-5 sm:h-5 ${isFav ? 'fill-current text-purple-600 dark:text-purple-400' : 'fill-none'}" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>

        <!-- ABAJO: chevron ">" -->
        <button
          type="button"
          class="btn-event-details p-1.5 rounded-lg text-slate-400 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer"
          data-event-id="${ev.id}"
          aria-label="Ver detalles de ${ev.title}"
        >
          <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </article>
    `;
  }

  function renderEventsGrid() {
    const grid = document.getElementById('events-grid');
    const emptyState = document.getElementById('empty-state');
    const endMsg = document.getElementById('events-end-message');
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
    } else if (currentSort === 'date-asc') {
      filtered.sort((a, b) => getEventSortKey(a) - getEventSortKey(b));
    } else if (currentSort === 'date-desc') {
      filtered.sort((a, b) => getEventSortKey(b) - getEventSortKey(a));
    }

    if (filtered.length === 0) {
      grid.innerHTML = '';
      emptyState?.classList.remove('hidden');
      emptyState?.classList.add('flex');
      endMsg?.classList.add('hidden');
      return;
    }

    emptyState?.classList.remove('flex');
    emptyState?.classList.add('hidden');
    endMsg?.classList.remove('hidden');

    if (currentSort === 'name-asc') {
      // Lista plana alfabética sin encabezados de fecha
      grid.innerHTML = `
        <div role="list" class="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          ${filtered.map(renderSingleEventCard).join('')}
        </div>
      `;
    } else {
      // Modos por fecha: agrupar por día+mes con encabezados sticky
      const groups = [];
      let currentGroupKey = null;
      let currentGroupCards = [];

      filtered.forEach((ev) => {
        const parsed = splitEventDate(ev.date);
        const groupKey = parsed
          ? `${parsed.dayOfWeek ? parsed.dayOfWeek + ' ' : ''}${parsed.dayNumber} ${parsed.month}`
          : 'Fecha a confirmar';

        if (groupKey !== currentGroupKey) {
          if (currentGroupCards.length > 0) {
            groups.push({ title: currentGroupKey, cards: currentGroupCards });
          }
          currentGroupKey = groupKey;
          currentGroupCards = [ev];
        } else {
          currentGroupCards.push(ev);
        }
      });
      if (currentGroupCards.length > 0) {
        groups.push({ title: currentGroupKey, cards: currentGroupCards });
      }

      grid.innerHTML = groups.map((g) => `
        <section aria-label="Eventos del ${g.title}">
          <h3 class="sticky top-[7.5rem] z-20 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-2 bg-slate-50/90 dark:bg-zinc-950/90 backdrop-blur-md font-montserrat font-bold text-sm uppercase tracking-wide text-purple-600 dark:text-purple-400">
            ${g.title}
          </h3>
          <div role="list" class="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mt-2">
            ${g.cards.map(renderSingleEventCard).join('')}
          </div>
        </section>
      `).join('');
    }

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

    if (!calRepo.isLoggedIn()) {
      try {
        showToast('Iniciando sesión con Google...', 'info');
        await calService.login();
        showToast('¡Sesión iniciada con éxito!', 'success');
      } catch (authErr) {
        if (authErr?.error === 'popup_closed_by_user') {
          showToast('Inicio de sesión cancelado', 'info');
        } else {
          showToast('No se pudo autenticar con Google. Verificá tu conexión.', 'error');
        }
        return;
      }
    }

    const isSynced = calRepo.isEventSynced(currentModalEventId);
    isCalendarSyncing = true;
    updateModalCalendarButton(currentModalEventId);

    if (!isSynced) {
      try {
        await calService.addEvent(event);
        showToast('Evento añadido a tu Google Calendar', 'success');
      } catch (err) {
        if (err.code === 'SESSION_EXPIRED') {
          showToast('Tu sesión de Google expiró. Por favor volvé a conectarte.', 'error');
        } else {
          showToast(err.message || 'Error al agendar en Google Calendar', 'error');
        }
      } finally {
        isCalendarSyncing = false;
        updateModalCalendarButton(currentModalEventId);
      }
    } else {
      try {
        await calService.removeEvent(currentModalEventId);
        showToast('Evento eliminado de tu Google Calendar', 'info');
      } catch (err) {
        if (err.code === 'SESSION_EXPIRED') {
          showToast('Tu sesión de Google expiró. Por favor volvé a conectarte.', 'error');
        } else {
          showToast(err.message || 'Error al quitar de Google Calendar', 'error');
        }
      } finally {
        isCalendarSyncing = false;
        updateModalCalendarButton(currentModalEventId);
      }
    }
  });

  window.addEventListener('puntorc:calendar-sync-changed', () => {
    updateModalCalendarButton();
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

  document.getElementById('btn-favorites')?.addEventListener('click', openProfileModal);
  document.getElementById('btn-login')?.addEventListener('click', openProfileModal);
  document.getElementById('btn-register')?.addEventListener('click', openProfileModal);

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
      <div class="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 hover:border-purple-500/40 transition-colors">
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
      } else if (mobileSearchPanel && !mobileSearchPanel.classList.contains('hidden')) {
        toggleMobileSearch(false);
      } else if (mobileNotifPanel && !mobileNotifPanel.classList.contains('hidden')) {
        toggleMobileNotifications(false);
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
    if (mobileSearchPanel && !mobileSearchPanel.classList.contains('hidden')) toggleMobileSearch(false);
    if (mobileNotifPanel && !mobileNotifPanel.classList.contains('hidden')) toggleMobileNotifications(false);
    document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('bottom-nav-explore')?.addEventListener('click', (e) => {
    setActiveTab(e.currentTarget);
    toggleMobileSearch(true);
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

    const calService = getCalService();
    if (calService && typeof calService.init === 'function') {
      calService.init();
    }

    renderHeroSlider();
    initHeroArrowAutoHide();
    updateFavoritesBadges();

    const updateAdmin = ns.updateAdminUI || window.updateAdminUI;
    if (typeof updateAdmin === 'function') updateAdmin();

    renderEventsGrid();
  }

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
  ns.updateModalCalendarButton = updateModalCalendarButton;
  ns.showToast = showToast;
  ns.applyTheme = applyTheme;
  ns.toggleTheme = toggleTheme;
  ns.updateFavoritesBadges = updateFavoritesBadges;
  ns.initHeroArrowAutoHide = initHeroArrowAutoHide;
  ns.toggleMobileSearch = toggleMobileSearch;
  ns.toggleMobileNotifications = toggleMobileNotifications;
  ns.splitEventDate = splitEventDate;

  window.hideLoader = hideLoader;
  window.renderHeroSlider = renderHeroSlider;
  window.renderEventsGrid = renderEventsGrid;
  window.openEventModal = openEventModal;
  window.closeEventModal = closeEventModal;
  window.openProfileModal = openProfileModal;
  window.closeProfileModal = closeProfileModal;
  window.renderFavoritesList = renderFavoritesList;
  window.updateModalCalendarButton = updateModalCalendarButton;
  window.showToast = showToast;
  window.applyTheme = applyTheme;
  window.toggleTheme = toggleTheme;
  window.updateFavoritesBadges = updateFavoritesBadges;
  window.initHeroArrowAutoHide = initHeroArrowAutoHide;
  window.toggleMobileSearch = toggleMobileSearch;
  window.toggleMobileNotifications = toggleMobileNotifications;
  window.splitEventDate = splitEventDate;
})(typeof window !== 'undefined' ? window : global);
