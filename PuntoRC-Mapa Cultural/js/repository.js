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

  /**
   * CalendarRepository: Persistencia desacoplada para sincronización con Google Calendar
   * Almacena:
   * - Tokens y estado de sesión en localStorage ('puntorc_google_session')
   * - Mapeo de IDs de PuntoRC a IDs de Google Calendar ('puntorc_google_calendar_events')
   */
  const CalendarRepository = {
    _syncKey: ns.STORAGE_CALENDAR_KEY || 'puntorc_google_calendar_events',
    _sessionKey: ns.STORAGE_SESSION_KEY || 'puntorc_google_session',
    _syncedMap: null,
    _session: null,

    _init() {
      if (this._syncedMap === null) {
        try {
          const stored = localStorage.getItem(this._syncKey);
          this._syncedMap = stored ? JSON.parse(stored) : {};
          if (typeof this._syncedMap !== 'object' || Array.isArray(this._syncedMap) || this._syncedMap === null) {
            this._syncedMap = {};
          }
        } catch (e) {
          this._syncedMap = {};
        }
      }

      if (this._session === null) {
        try {
          const sessStored = localStorage.getItem(this._sessionKey);
          this._session = sessStored ? JSON.parse(sessStored) : null;
        } catch (e) {
          this._session = null;
        }
      }
    },

    getSession() {
      this._init();
      return this._session ? { ...this._session } : null;
    },

    saveSession(sessionData) {
      this._init();
      this._session = { ...sessionData };
      try {
        localStorage.setItem(this._sessionKey, JSON.stringify(this._session));
      } catch (e) {
        console.error('Error al persistir sesión de Google en localStorage:', e);
      }
      return this._session;
    },

    clearSession() {
      this._init();
      this._session = null;
      try {
        localStorage.removeItem(this._sessionKey);
      } catch (e) {
        console.error('Error al eliminar sesión de Google en localStorage:', e);
      }
    },

    isLoggedIn() {
      this._init();
      return Boolean(this._session && this._session.access_token);
    },

    getAccessToken() {
      this._init();
      return this._session ? this._session.access_token : null;
    },

    getGoogleEventId(eventId) {
      this._init();
      return this._syncedMap[String(eventId)] || null;
    },

    isEventSynced(eventId) {
      this._init();
      return Boolean(this._syncedMap[String(eventId)]);
    },

    setGoogleEventId(eventId, googleId) {
      this._init();
      this._syncedMap[String(eventId)] = String(googleId);
      this._persistSync();
    },

    removeGoogleEventId(eventId) {
      this._init();
      delete this._syncedMap[String(eventId)];
      this._persistSync();
    },

    getAllSyncedIds() {
      this._init();
      return Object.keys(this._syncedMap);
    },

    getSyncedMap() {
      this._init();
      return { ...this._syncedMap };
    },

    _persistSync() {
      try {
        localStorage.setItem(this._syncKey, JSON.stringify(this._syncedMap));
      } catch (e) {
        console.error('Error al persistir sincronizaciones de calendar en localStorage:', e);
      }
    }
  };

  ns.EventRepository = EventRepository;
  ns.FavoritesRepository = FavoritesRepository;
  ns.CalendarRepository = CalendarRepository;
  window.EventRepository = EventRepository;
  window.FavoritesRepository = FavoritesRepository;
  window.CalendarRepository = CalendarRepository;
})(typeof window !== 'undefined' ? window : global);
