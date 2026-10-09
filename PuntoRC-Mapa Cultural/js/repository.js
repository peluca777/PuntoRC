/**
 * PuntoRC - Mapa Cultural
 * Capa de Persistencia: Patrón Repository (EventRepository y FavoritesRepository)
 * Aísla completamente la lógica de almacenamiento de la interfaz de usuario.
 */
(function(window) {
  'use strict';
  window.PuntoRC = window.PuntoRC || {};
  const ns = window.PuntoRC;

  const EventRepository = {
    _storageKey: ns.STORAGE_EVENTS_KEY || 'puntorc_events_data',
    _events: null,

    _init() {
      if (this._events !== null) return;
      const defaults = ns.DEFAULT_EVENTS || [];
      try {
        const stored = localStorage.getItem(this._storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this._events = parsed.map((e) => {
              if (typeof e.isFeatured === 'undefined') {
                const seed = defaults.find((s) => s.id === String(e.id));
                return { ...e, isFeatured: seed ? Boolean(seed.isFeatured) : false };
              }
              return e;
            });
            return;
          }
        }
        this._events = JSON.parse(JSON.stringify(defaults));
        this._persist();
      } catch (e) {
        console.warn('Error al leer de localStorage, usando semillas:', e);
        this._events = JSON.parse(JSON.stringify(defaults));
      }
    },

    getAll() {
      this._init();
      return [...this._events];
    },

    getFeatured() {
      this._init();
      return this._events.filter((e) => e.isFeatured === true);
    },

    getById(id) {
      this._init();
      return this._events.find((e) => String(e.id) === String(id)) || null;
    },

    save(eventData) {
      this._init();
      const getCatKey = ns.getCategoryKey || ((c) => 'musica');
      const cleanData = {
        ...eventData,
        categoryKey: getCatKey(eventData.category),
        isFeatured: Boolean(eventData.isFeatured)
      };

      if (cleanData.id) {
        const index = this._events.findIndex((e) => String(e.id) === String(cleanData.id));
        if (index !== -1) {
          this._events[index] = { ...this._events[index], ...cleanData };
        } else {
          this._events.unshift(cleanData);
        }
      } else {
        const newEvent = {
          ...cleanData,
          id: String(Date.now())
        };
        this._events.unshift(newEvent);
      }
      this._persist();
      return true;
    },

    delete(id) {
      this._init();
      this._events = this._events.filter((e) => String(e.id) !== String(id));
      this._persist();
      return true;
    },

    _persist() {
      try {
        localStorage.setItem(this._storageKey, JSON.stringify(this._events));
      } catch (e) {
        console.error('Error al persistir eventos en localStorage:', e);
      }
    }
  };

  const FavoritesRepository = {
    _storageKey: ns.STORAGE_FAV_KEY || 'puntorc_favorites',
    _favorites: null,

    _init() {
      if (this._favorites !== null) return;
      try {
        const stored = localStorage.getItem(this._storageKey);
        this._favorites = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(this._favorites)) this._favorites = [];
      } catch (e) {
        this._favorites = [];
      }
    },

    getAll() {
      this._init();
      return [...this._favorites];
    },

    isFavorite(id) {
      this._init();
      return this._favorites.includes(String(id));
    },

    toggle(id) {
      this._init();
      const strId = String(id);
      const index = this._favorites.indexOf(strId);
      let isAdded = false;
      if (index > -1) {
        this._favorites.splice(index, 1);
        isAdded = false;
      } else {
        this._favorites.push(strId);
        isAdded = true;
      }
      this._persist();
      return isAdded;
    },

    remove(id) {
      this._init();
      this._favorites = this._favorites.filter((favId) => String(favId) !== String(id));
      this._persist();
    },

    _persist() {
      try {
        localStorage.setItem(this._storageKey, JSON.stringify(this._favorites));
      } catch (e) {
        console.error('Error al persistir favoritos en localStorage:', e);
      }
    }
  };

  ns.EventRepository = EventRepository;
  ns.FavoritesRepository = FavoritesRepository;
  window.EventRepository = EventRepository;
  window.FavoritesRepository = FavoritesRepository;
})(typeof window !== 'undefined' ? window : global);
