/**
 * PuntoRC - Mapa Cultural
 * Módulo de Integración con Google Calendar API v3 y Google Identity Services (OAuth 2.0)
 *
 * Responsabilidades:
 * 1. Inicializar el cliente OAuth 2.0 con Client ID oficial mediante GIS.
 * 2. Gestionar el ciclo de vida del token de acceso (login, persistencia, logout).
 * 3. Parser robusto de fechas de la cartelera cultural de Río Cuarto hacia RFC3339.
 * 4. Operaciones bidireccionales con la API de Google Calendar:
 *    - POST /calendar/v3/calendars/primary/events (Añadir evento)
 *    - DELETE /calendar/v3/calendars/primary/events/{id} (Quitar evento)
 */
(function(window) {
  'use strict';
  window.PuntoRC = window.PuntoRC || {};
  const ns = window.PuntoRC;

  const GOOGLE_CLIENT_ID = '17830521576-k28ndr4fjurid8p4fhq5ldah5fafro4o.apps.googleusercontent.com';
  const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
  const USERINFO_API_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
  const SCOPES = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';

  let tokenClient = null;
  let activeAuthPromiseResolver = null;
  let activeAuthPromiseRejecter = null;

  /**
   * Parser inteligente de fechas para la cartelera de Río Cuarto.
   * Transforma textos como "Sábado 20 Sep · 22:00 hs" o formatos ISO en marcas RFC3339
   * con huso horario argentino (UTC-3).
   */
  function parseEventDates(dateStr) {
    const now = new Date();
    // Valor por defecto: mañana a las 20:00 hs
    let start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 20, 0, 0);

    if (typeof dateStr === 'string' && dateStr.trim()) {
      const text = dateStr.trim();
      const directDate = new Date(text);

      if (!isNaN(directDate.getTime()) && directDate.getFullYear() > 2000) {
        start = directDate;
      } else {
        const monthMap = {
          ene: 0, enero: 0,
          feb: 1, febrero: 1,
          mar: 2, marzo: 2,
          abr: 3, abril: 3,
          may: 4, mayo: 4,
          jun: 5, junio: 5,
          jul: 6, julio: 6,
          ago: 7, agosto: 7,
          sep: 8, set: 8, septiembre: 8,
          oct: 9, octubre: 9,
          nov: 10, noviembre: 10,
          dic: 11, diciembre: 11
        };

        // Eliminar nombres de días de la semana para evitar que "Martes" coincida erróneamente con "Mar" (Marzo)
        const cleanText = text.toLowerCase().replace(/\b(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\b/gi, ' ');
        const dayMatch = cleanText.match(/\b([1-9]|[12][0-9]|3[01])\b/);
        const monthMatch = cleanText.match(/(ene|feb|mar|abr|may|jun|jul|ago|sep|set|oct|nov|dic)[a-z]*/);
        const timeMatch = text.match(/(\d{1,2}):(\d{2})/);
        const hourOnlyMatch = !timeMatch && text.match(/(\d{1,2})\s*hs?/i);
        const yearMatch = text.match(/\b(20\d\d)\b/);

        const year = yearMatch ? parseInt(yearMatch[1], 10) : now.getFullYear();
        let month = now.getMonth();
        if (monthMatch && monthMap[monthMatch[1]] !== undefined) {
          month = monthMap[monthMatch[1]];
        }
        const day = dayMatch ? parseInt(dayMatch[1], 10) : now.getDate();
        let hours = 20;
        let minutes = 0;

        if (timeMatch) {
          hours = parseInt(timeMatch[1], 10);
          minutes = parseInt(timeMatch[2], 10);
        } else if (hourOnlyMatch) {
          hours = parseInt(hourOnlyMatch[1], 10);
        }

        const candidate = new Date(year, month, day, hours, minutes, 0);
        if (!isNaN(candidate.getTime())) {
          start = candidate;
        }
      }
    }

    // Duración estimada de 2 horas para eventos culturales
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

    const pad = (n) => String(n).padStart(2, '0');
    const toRfc3339 = (d) => {
      const y = d.getFullYear();
      const m = pad(d.getMonth() + 1);
      const day = pad(d.getDate());
      const h = pad(d.getHours());
      const min = pad(d.getMinutes());
      const s = pad(d.getSeconds());
      return `${y}-${m}-${day}T${h}:${min}:${s}-03:00`;
    };

    return {
      startIso: toRfc3339(start),
      endIso: toRfc3339(end),
      timeZone: 'America/Argentina/Cordoba'
    };
  }

  const GoogleCalendarService = {
    clientId: GOOGLE_CLIENT_ID,

    /**
     * Inicializa Google Identity Services Token Client
     */
    init() {
      if (typeof window.google === 'undefined' || !window.google.accounts || !window.google.accounts.oauth2) {
        return false;
      }

      if (!tokenClient) {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: SCOPES,
          callback: (response) => this._handleTokenResponse(response)
        });
      }
      return true;
    },

    /**
     * Dispara el flujo interactivo de OAuth 2.0 (popup de Google)
     */
    login() {
      return new Promise((resolve, reject) => {
        const initialized = this.init();
        if (!initialized || !tokenClient) {
          const err = new Error('Google Identity Services no está disponible aún. Por favor verificá tu conexión a internet.');
          reject(err);
          return;
        }

        activeAuthPromiseResolver = resolve;
        activeAuthPromiseRejecter = reject;

        try {
          // Solicitar token de acceso con prompt dinámico
          tokenClient.requestAccessToken({ prompt: '' });
        } catch (error) {
          activeAuthPromiseRejecter = null;
          activeAuthPromiseResolver = null;
          reject(error);
        }
      });
    },

    /**
     * Procesa la respuesta de Google Identity Services
     */
    async _handleTokenResponse(response) {
      if (response.error) {
        if (activeAuthPromiseRejecter) {
          activeAuthPromiseRejecter(response);
          activeAuthPromiseRejecter = null;
          activeAuthPromiseResolver = null;
        }
        return;
      }

      const accessToken = response.access_token;
      const expiresIn = Number(response.expires_in) || 3600;
      const expiresAt = Date.now() + expiresIn * 1000;

      // Obtener información de perfil del usuario (best-effort)
      let userData = {
        name: 'Usuario de Google',
        email: '',
        picture: ''
      };

      try {
        const userRes = await fetch(USERINFO_API_URL, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (userRes.ok) {
          const info = await userRes.json();
          userData = {
            name: info.name || info.given_name || 'Usuario de Google',
            email: info.email || '',
            picture: info.picture || ''
          };
        }
      } catch (err) {
        console.warn('No se pudo recuperar el perfil de Google UserInfo, usando datos básicos:', err);
      }

      const session = {
        access_token: accessToken,
        expires_at: expiresAt,
        token_type: response.token_type || 'Bearer',
        scope: response.scope || SCOPES,
        user: userData
      };

      const repo = ns.CalendarRepository || window.CalendarRepository;
      if (repo) {
        repo.saveSession(session);
      }

      // Notificar a la aplicación que el estado de sesión cambió
      window.dispatchEvent(new CustomEvent('puntorc:auth-changed', { detail: { session } }));

      if (activeAuthPromiseResolver) {
        activeAuthPromiseResolver(session);
        activeAuthPromiseResolver = null;
        activeAuthPromiseRejecter = null;
      }
    },

    /**
     * Cierra la sesión activa de Google y limpia localStorage
     */
    logout() {
      const repo = ns.CalendarRepository || window.CalendarRepository;
      const token = repo ? repo.getAccessToken() : null;

      if (token && window.google?.accounts?.oauth2?.revoke) {
        try {
          window.google.accounts.oauth2.revoke(token, () => {});
        } catch (e) {
          // Ignorar fallas silenciosas en la revocación remota
        }
      }

      if (repo) {
        repo.clearSession();
      }

      window.dispatchEvent(new CustomEvent('puntorc:auth-changed', { detail: { session: null } }));
    },

    /**
     * Verifica si hay una sesión válida activa
     */
    isAuthenticated() {
      const repo = ns.CalendarRepository || window.CalendarRepository;
      return repo ? repo.isLoggedIn() : false;
    },

    /**
     * Retorna la sesión actual
     */
    getSession() {
      const repo = ns.CalendarRepository || window.CalendarRepository;
      return repo ? repo.getSession() : null;
    },

    /**
     * Añade un evento a Google Calendar (POST)
     */
    async addEvent(event) {
      const repo = ns.CalendarRepository || window.CalendarRepository;
      if (!repo || !repo.isLoggedIn()) {
        const error = new Error('NOT_LOGGED_IN');
        error.code = 'NOT_LOGGED_IN';
        throw error;
      }

      const token = repo.getAccessToken();
      const { startIso, endIso, timeZone } = parseEventDates(event.date);

      const descriptionText = [
        event.description || '',
        '',
        `📍 Lugar: ${event.location || 'Río Cuarto, Córdoba'}`,
        `🏷️ Categoría: ${event.category || 'Cultura'}`,
        `🎟️ Entrada: ${event.price || 'Consultar'}`,
        '---',
        'Organizado vía PuntoRC · Mapa Cultural de Río Cuarto'
      ].filter(Boolean).join('\n');

      const payload = {
        summary: event.title,
        description: descriptionText,
        location: event.location || 'Río Cuarto, Córdoba',
        start: {
          dateTime: startIso,
          timeZone: timeZone
        },
        end: {
          dateTime: endIso,
          timeZone: timeZone
        },
        source: {
          title: 'PuntoRC - Cartelera Cultural',
          url: window.location.href
        }
      };

      const response = await fetch(CALENDAR_API_BASE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 401) {
        this.logout();
        const err = new Error('SESSION_EXPIRED');
        err.code = 'SESSION_EXPIRED';
        throw err;
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const message = errData.error?.message || `Error del servidor de Google (${response.status})`;
        const err = new Error(message);
        err.status = response.status;
        throw err;
      }

      const createdEvent = await response.json();
      const googleId = createdEvent.id;

      // Guardar el googleEventId en localStorage asociado al evento
      repo.setGoogleEventId(event.id, googleId);

      window.dispatchEvent(new CustomEvent('puntorc:calendar-sync-changed', {
        detail: { eventId: event.id, googleEventId: googleId, action: 'added' }
      }));

      return createdEvent;
    },

    /**
     * Elimina un evento de Google Calendar (DELETE)
     */
    async removeEvent(eventId) {
      const repo = ns.CalendarRepository || window.CalendarRepository;
      if (!repo || !repo.isLoggedIn()) {
        const error = new Error('NOT_LOGGED_IN');
        error.code = 'NOT_LOGGED_IN';
        throw error;
      }

      const googleEventId = repo.getGoogleEventId(eventId);
      if (!googleEventId) {
        return true;
      }

      const token = repo.getAccessToken();
      const url = `${CALENDAR_API_BASE}/${encodeURIComponent(googleEventId)}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        this.logout();
        const err = new Error('SESSION_EXPIRED');
        err.code = 'SESSION_EXPIRED';
        throw err;
      }

      // Si es 200, 204 o ya fue borrado en el calendario remoto (404/410), procedemos a desvincular localmente
      if (response.ok || response.status === 404 || response.status === 410) {
        repo.removeGoogleEventId(eventId);

        window.dispatchEvent(new CustomEvent('puntorc:calendar-sync-changed', {
          detail: { eventId, action: 'removed' }
        }));

        return true;
      }

      const errData = await response.json().catch(() => ({}));
      const message = errData.error?.message || `Error al eliminar de Google Calendar (${response.status})`;
      const err = new Error(message);
      err.status = response.status;
      throw err;
    },

    parseEventDates
  };

  ns.GoogleCalendarService = GoogleCalendarService;
  window.GoogleCalendarService = GoogleCalendarService;
})(typeof window !== 'undefined' ? window : global);
