/**
 * PuntoRC - Mapa Cultural
 * Dominio de Administración: Modo Administrador, Switch iOS y Modal CRUD
 */
(function(window) {
  'use strict';
  window.PuntoRC = window.PuntoRC || {};
  const ns = window.PuntoRC;

  const storageAdminKey = ns.STORAGE_ADMIN_KEY || 'puntorc_admin_mode';

  let isAdminMode = false;
  try {
    isAdminMode = localStorage.getItem(storageAdminKey) === 'true';
  } catch (e) {
    isAdminMode = false;
  }
  ns.isAdminMode = isAdminMode;
  let currentCrudEventId = null;

  function showToastSafe(msg, type) {
    if (typeof window.showToast === 'function') return window.showToast(msg, type);
    if (ns.showToast) return ns.showToast(msg, type);
    console.log(`[Toast ${type}] ${msg}`);
  }

  function setAdminMode(active) {
    isAdminMode = active;
    ns.isAdminMode = active;
    try {
      localStorage.setItem(storageAdminKey, active ? 'true' : 'false');
    } catch (e) {}
    updateAdminUI();
    if (typeof window.renderEventsGrid === 'function') {
      window.renderEventsGrid();
    } else if (ns.renderEventsGrid) {
      ns.renderEventsGrid();
    }
    showToastSafe(
      active ? 'Modo Administrador activado' : 'Modo Administrador desactivado',
      active ? 'success' : 'info'
    );
  }

  function updateAdminUI() {
    const toggleBtn = document.getElementById('admin-mode-toggle');
    const toggleThumb = document.getElementById('admin-toggle-thumb');
    const statusPill = document.getElementById('admin-status-pill');
    const floatingBanner = document.getElementById('admin-floating-banner');
    const modalAdminBtn = document.getElementById('modal-admin-edit-btn');

    if (toggleBtn && toggleThumb && statusPill) {
      toggleBtn.setAttribute('aria-checked', isAdminMode ? 'true' : 'false');
      if (isAdminMode) {
        toggleBtn.classList.remove('bg-slate-300', 'dark:bg-zinc-700');
        toggleBtn.classList.add('bg-purple-600');
        toggleThumb.classList.remove('translate-x-0');
        toggleThumb.classList.add('translate-x-7');
        statusPill.textContent = 'Activo';
        statusPill.className =
          'px-2 py-0.5 text-[10px] font-montserrat font-bold uppercase rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300';
      } else {
        toggleBtn.classList.remove('bg-purple-600');
        toggleBtn.classList.add('bg-slate-300', 'dark:bg-zinc-700');
        toggleThumb.classList.remove('translate-x-7');
        toggleThumb.classList.add('translate-x-0');
        statusPill.textContent = 'Inactivo';
        statusPill.className =
          'px-2 py-0.5 text-[10px] font-montserrat font-bold uppercase rounded-md bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400';
      }
    }

    if (floatingBanner) {
      if (isAdminMode) {
        floatingBanner.classList.remove('hidden');
      } else {
        floatingBanner.classList.add('hidden');
      }
    }

    if (modalAdminBtn) {
      if (isAdminMode) {
        modalAdminBtn.classList.remove('hidden');
      } else {
        modalAdminBtn.classList.add('hidden');
      }
    }
  }

  function setCrudFeaturedState(isFeatured) {
    const toggleBtn = document.getElementById('crud-featured-toggle');
    const toggleThumb = document.getElementById('crud-featured-thumb');
    const labelEl = document.getElementById('crud-featured-status-label');

    if (!toggleBtn || !toggleThumb) return;
    toggleBtn.setAttribute('aria-checked', isFeatured ? 'true' : 'false');

    if (isFeatured) {
      toggleBtn.classList.remove('bg-slate-300', 'dark:bg-zinc-700');
      toggleBtn.classList.add('bg-purple-600');
      toggleThumb.classList.remove('translate-x-0');
      toggleThumb.classList.add('translate-x-6');
      if (labelEl) {
        labelEl.textContent = 'Destacado en Hero';
        labelEl.className = 'text-xs font-montserrat font-bold text-purple-600 dark:text-purple-400';
      }
    } else {
      toggleBtn.classList.remove('bg-purple-600');
      toggleBtn.classList.add('bg-slate-300', 'dark:bg-zinc-700');
      toggleThumb.classList.remove('translate-x-6');
      toggleThumb.classList.add('translate-x-0');
      if (labelEl) {
        labelEl.textContent = 'Normal (No destacado)';
        labelEl.className = 'text-xs font-montserrat font-medium text-slate-500 dark:text-zinc-400';
      }
    }
  }

  function openCrudModal(eventId = null) {
    currentCrudEventId = eventId;
    const crudOverlay = document.getElementById('crud-edit-modal');
    const crudCard = document.getElementById('crud-modal-card');
    const crudForm = document.getElementById('crud-form');
    const crudTitleHeading = document.getElementById('crud-modal-title');
    const crudDeleteBtn = document.getElementById('crud-delete-btn');

    if (!crudOverlay || !crudForm) return;

    const repo = ns.EventRepository || window.EventRepository;

    if (eventId) {
      const ev = repo ? repo.getById(eventId) : null;
      if (!ev) return;
      if (crudTitleHeading) crudTitleHeading.textContent = 'Editar Evento';
      crudDeleteBtn?.classList.remove('hidden');

      document.getElementById('crud-event-id').value = ev.id;
      document.getElementById('crud-title').value = ev.title;
      document.getElementById('crud-category').value = ev.category;
      document.getElementById('crud-status').value = ev.status || 'Cupos disponibles';
      document.getElementById('crud-date').value = ev.date;
      document.getElementById('crud-price').value = ev.price;
      document.getElementById('crud-location').value = ev.location;
      document.getElementById('crud-image').value = ev.image;
      document.getElementById('crud-description').value = ev.description;
      setCrudFeaturedState(Boolean(ev.isFeatured));

      // Sincronizar el editor de imagen con el valor existente
      const imgEditor = ns.ImageEditor || window.ImageEditor;
      if (imgEditor) {
        imgEditor.loadPreview(ev.image);
        // Si es URL, también llenar el input visible
        const urlInput = document.getElementById('crud-image-url-input');
        if (urlInput && ev.image && !ev.image.startsWith('data:')) {
          urlInput.value = ev.image;
        }
      }
    } else {
      if (crudTitleHeading) crudTitleHeading.textContent = 'Crear Nuevo Evento';
      crudDeleteBtn?.classList.add('hidden');
      crudForm.reset();
      document.getElementById('crud-event-id').value = '';
      document.getElementById('crud-status').value = 'Cupos disponibles';
      document.getElementById('crud-category').value = 'Música';
      setCrudFeaturedState(false);

      // Resetear el editor de imagen
      const imgEditor = ns.ImageEditor || window.ImageEditor;
      if (imgEditor) imgEditor.reset();
      const urlInput = document.getElementById('crud-image-url-input');
      if (urlInput) urlInput.value = '';
    }

    crudOverlay.classList.remove('opacity-0', 'pointer-events-none');
    crudOverlay.classList.add('opacity-100', 'pointer-events-auto');
    crudCard?.classList.remove('scale-95');
    crudCard?.classList.add('scale-100');
    crudOverlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('overflow-hidden');
  }

  function closeCrudModal() {
    const crudOverlay = document.getElementById('crud-edit-modal');
    const crudCard = document.getElementById('crud-modal-card');
    if (!crudOverlay) return;

    crudOverlay.classList.remove('opacity-100', 'pointer-events-auto');
    crudOverlay.classList.add('opacity-0', 'pointer-events-none');
    crudCard?.classList.remove('scale-100');
    crudCard?.classList.add('scale-95');
    crudOverlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('overflow-hidden');
  }

  function initAdminModule() {
    // Inicializar el editor de imagen (subida + recorte)
    const imgEditor = ns.ImageEditor || window.ImageEditor;
    if (imgEditor) imgEditor.init();

    document.getElementById('admin-mode-toggle')?.addEventListener('click', () => {
      setAdminMode(!isAdminMode);
    });

    document.getElementById('btn-admin-exit')?.addEventListener('click', () => {
      setAdminMode(false);
    });

    document.getElementById('btn-admin-create-event')?.addEventListener('click', () => {
      openCrudModal(null);
    });

    document.getElementById('crud-close-btn')?.addEventListener('click', closeCrudModal);
    document.getElementById('crud-cancel-btn')?.addEventListener('click', closeCrudModal);

    const crudOverlay = document.getElementById('crud-edit-modal');
    crudOverlay?.addEventListener('click', (e) => {
      if (e.target === crudOverlay) closeCrudModal();
    });

    const featuredToggle = document.getElementById('crud-featured-toggle');
    featuredToggle?.addEventListener('click', () => {
      const isCurrentlyChecked = featuredToggle.getAttribute('aria-checked') === 'true';
      setCrudFeaturedState(!isCurrentlyChecked);
    });

    const crudForm = document.getElementById('crud-form');
    crudForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const idVal = document.getElementById('crud-event-id').value;
      const title = document.getElementById('crud-title').value.trim();
      const category = document.getElementById('crud-category').value;
      const status = document.getElementById('crud-status').value;
      const date = document.getElementById('crud-date').value.trim();
      const price = document.getElementById('crud-price').value.trim();
      const location = document.getElementById('crud-location').value.trim();
      const description = document.getElementById('crud-description').value.trim();
      const isFeatured = document.getElementById('crud-featured-toggle')?.getAttribute('aria-checked') === 'true';

      // Imagen: resolución inteligente según pestaña activa (URL o Archivo subido/recortado)
      let image = '';
      const imgEditor = ns.ImageEditor || window.ImageEditor;
      const currentMode = imgEditor?.getMode ? imgEditor.getMode() : 'url';
      const hiddenImgVal = document.getElementById('crud-image')?.value.trim() || '';
      const urlInputVal = document.getElementById('crud-image-url-input')?.value.trim() || '';

      if (currentMode === 'url') {
        if (hiddenImgVal.startsWith('data:')) {
          image = hiddenImgVal;
        } else {
          image = urlInputVal || hiddenImgVal;
        }
      } else {
        image = hiddenImgVal;
      }

      if (!title || !date || !location) {
        showToastSafe('Por favor completá los campos obligatorios (*)', 'error');
        return;
      }

      const eventPayload = {
        id: idVal || undefined,
        title,
        category,
        status,
        date,
        price,
        location,
        image: image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1000&q=80',
        description,
        isFeatured
      };

      const repo = ns.EventRepository || window.EventRepository;
      if (repo) repo.save(eventPayload);
      showToastSafe(idVal ? 'Evento actualizado con éxito' : 'Nuevo evento creado con éxito', 'success');

      closeCrudModal();

      window.dispatchEvent(new CustomEvent('puntorc:events-updated', { detail: { eventId: idVal } }));
      const renderGrid = ns.renderEventsGrid || window.renderEventsGrid;
      if (typeof renderGrid === 'function') renderGrid();

      const renderHero = ns.renderHeroSlider || window.renderHeroSlider;
      if (typeof renderHero === 'function') renderHero();

      const renderFavs = ns.renderFavoritesList || window.renderFavoritesList;
      if (typeof renderFavs === 'function') renderFavs();

      const modalOverlay = document.getElementById('event-modal-overlay');
      if (modalOverlay && !modalOverlay.classList.contains('opacity-0')) {
        const openModal = ns.openEventModal || window.openEventModal;
        if (typeof openModal === 'function') openModal(idVal || eventPayload.id);
      }
    });

    document.getElementById('crud-delete-btn')?.addEventListener('click', () => {
      if (!currentCrudEventId) return;
      if (confirm('¿Estás seguro de que deseás eliminar este evento de la cartelera?')) {
        const repo = ns.EventRepository || window.EventRepository;
        const favRepo = ns.FavoritesRepository || window.FavoritesRepository;
        if (repo) repo.delete(currentCrudEventId);
        if (favRepo) favRepo.remove(currentCrudEventId);

        closeCrudModal();
        const closeModal = ns.closeEventModal || window.closeEventModal;
        if (typeof closeModal === 'function') closeModal();

        window.dispatchEvent(new CustomEvent('puntorc:events-updated'));
        const renderGrid = ns.renderEventsGrid || window.renderEventsGrid;
        if (typeof renderGrid === 'function') renderGrid();

        const renderHero = ns.renderHeroSlider || window.renderHeroSlider;
        if (typeof renderHero === 'function') renderHero();

        const renderFavs = ns.renderFavoritesList || window.renderFavoritesList;
        if (typeof renderFavs === 'function') renderFavs();

        const updateBadges = ns.updateFavoritesBadges || window.updateFavoritesBadges;
        if (typeof updateBadges === 'function') updateBadges();

        showToastSafe('Evento eliminado de la cartelera', 'info');
      }
    });
  }

  ns.isAdminMode = isAdminMode;
  ns.setAdminMode = setAdminMode;
  ns.updateAdminUI = updateAdminUI;
  ns.openCrudModal = openCrudModal;
  ns.closeCrudModal = closeCrudModal;
  ns.setCrudFeaturedState = setCrudFeaturedState;
  ns.initAdminModule = initAdminModule;

  window.isAdminMode = isAdminMode;
  window.setAdminMode = setAdminMode;
  window.updateAdminUI = updateAdminUI;
  window.openCrudModal = openCrudModal;
  window.closeCrudModal = closeCrudModal;
  window.setCrudFeaturedState = setCrudFeaturedState;
  window.initAdminModule = initAdminModule;
})(typeof window !== 'undefined' ? window : global);
