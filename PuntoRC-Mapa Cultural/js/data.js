/**
 * PuntoRC - Mapa Cultural
 * Dominio de Datos: Semillas de Río Cuarto, Mapeo de Categorías e Iconografía
 */
(function(window) {
  'use strict';
  window.PuntoRC = window.PuntoRC || {};
  const ns = window.PuntoRC;

  ns.STORAGE_EVENTS_KEY = 'puntorc_events_data';
  ns.STORAGE_FAV_KEY = 'puntorc_favorites';
  ns.STORAGE_ADMIN_KEY = 'puntorc_admin_mode';
  ns.STORAGE_THEME_KEY = 'puntorc_theme';

  ns.DEFAULT_EVENTS = [
    {
      id: '1',
      title: 'Recital de Rock en Elvis',
      category: 'Música',
      categoryKey: 'musica',
      image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1000&q=80',
      date: 'Sábado 20 Sep · 22:00 hs',
      location: 'Elvis Live, Río Cuarto (Alvear y Colón)',
      price: '$4.500 (Anticipadas en puerta y online)',
      status: 'Cupos disponibles',
      description: 'Una noche a puro rock nacional con las bandas más representativas del circuito independiente de Río Cuarto y la región. Disfrutá de sonido de alta fidelidad, barra de tragos y ambientación especial en el mítico Elvis Live.',
      isFeatured: true
    },
    {
      id: '2',
      title: 'Obra de Comedia en el Teatro Municipal',
      category: 'Teatro',
      categoryKey: 'teatro',
      image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=1000&q=80',
      date: 'Domingo 21 Sep · 20:30 hs',
      location: 'Teatro Municipal, Río Cuarto (Constitución 945)',
      price: '$3.000 (Platea general)',
      status: 'Últimas entradas',
      description: 'Una divertida comedia costumbrista que promete carcajadas de principio a fin. El elenco de actores de Río Cuarto presenta una puesta en escena ágil sobre los enredos familiares en la era digital.',
      isFeatured: false
    },
    {
      id: '3',
      title: 'Feria de Diseño — C.C. El Andino',
      category: 'Feria',
      categoryKey: 'feria',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1000&q=80',
      date: 'Domingo 21 Sep · 16:00 hs',
      location: 'Centro Cultural El Andino (Bv. Ameghino)',
      price: 'Entrada Libre y Gratuita',
      status: 'Cupos disponibles',
      description: 'Más de 40 diseñadores, artesanos e ilustradores independientes de Río Cuarto se reúnen en el predio del Andino. Habrá indumentaria, objetos de diseño, cerámica, serigrafía y foodtrucks con delicias gastronómicas locales.',
      isFeatured: true
    },
    {
      id: '4',
      title: 'Cine al Aire Libre — Parque del Centro',
      category: 'Cine',
      categoryKey: 'cine',
      image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1000&q=80',
      date: 'Viernes 19 Sep · 21:00 hs',
      location: 'Parque del Centro Cívico, Río Cuarto',
      price: 'Entrada Libre y Gratuita',
      status: 'Cupos disponibles',
      description: 'Proyección en pantalla gigante bajo las estrellas de clásicos del cine contemporáneo. Llevá tu reposera o manta para disfrutar en familia de una propuesta cultural y comunitaria inolvidable.',
      isFeatured: true
    },
    {
      id: '5',
      title: 'Show de Jazz',
      category: 'Jazz',
      categoryKey: 'jazz',
      image: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=1000&q=80',
      date: 'Lunes 22 Sep · 21:00 hs',
      location: 'Elvis Live, Río Cuarto (Alvear y Colón)',
      price: '$2.500 (Boletería en puerta)',
      status: 'Agotado',
      description: 'Una velada íntima y sofisticada con los mejores exponentes del jazz de la región. Repertorio exclusivo que recorre swing, bossa nova y bebop acústico con iluminación tenue y coctelería de autor.',
      isFeatured: false
    },
    {
      id: '6',
      title: 'Taller de Arte — Cerámica y Mixta',
      category: 'Taller',
      categoryKey: 'taller',
      image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1000&q=80',
      date: 'Martes 23 Sep · 17:00 hs',
      location: 'Centro Cultural El Andino (Sala Taller)',
      price: '$5.000 (Materiales y horneado incluidos)',
      status: 'Cupos disponibles',
      description: 'Taller participativo para adultos con técnicas de modelado en arcilla, esmaltes al agua y técnica mixta sobre lienzo. Una experiencia creativa sin requerimiento de experiencia previa.',
      isFeatured: false
    }
  ];

  ns.CATEGORY_ICONS = {
    musica: '<svg class="w-3.5 h-3.5 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12 0c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>',
    teatro: '<svg class="w-3.5 h-3.5 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 21c-4.97 0-9-3.582-9-8 0-2.478 1.258-4.7 3.25-6.14.73-.528 1.643-.86 2.593-.86h6.314c.95 0 1.863.332 2.593.86C19.742 8.3 21 10.522 21 13c0 4.418-4.03 8-9 8zM9 11h.01M15 11h.01M9 15c.83 1.196 1.83 1.5 3 1.5s2.17-.304 3-1.5" /></svg>',
    feria:  '<svg class="w-3.5 h-3.5 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>',
    cine:   '<svg class="w-3.5 h-3.5 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>',
    taller: '<svg class="w-3.5 h-3.5 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>',
    jazz:   '<svg class="w-3.5 h-3.5 text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" /></svg>'
  };

  ns.getCategoryIcon = function(catKey) {
    const key = (catKey || '').toLowerCase();
    return ns.CATEGORY_ICONS[key] || ns.CATEGORY_ICONS.musica;
  };

  ns.getCategoryKey = function(catName) {
    const n = (catName || '').toLowerCase();
    if (n.includes('músic') || n.includes('music')) return 'musica';
    if (n.includes('teatr')) return 'teatro';
    if (n.includes('feri')) return 'feria';
    if (n.includes('cine')) return 'cine';
    if (n.includes('jazz')) return 'jazz';
    if (n.includes('taller')) return 'taller';
    return 'musica';
  };

  ns.getStatusBadge = function(status) {
    if (status === 'Agotado') {
      return '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-montserrat font-bold rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-300 dark:border-rose-800">🔴 Agotado</span>';
    }
    if (status === 'Últimas entradas') {
      return '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-montserrat font-bold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300 dark:border-amber-800">🟡 Últimas entradas</span>';
    }
    return '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-montserrat font-bold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">🟢 Cupos disponibles</span>';
  };

  // Exposición en window para retrocompatibilidad con scripts directos
  window.DEFAULT_EVENTS = ns.DEFAULT_EVENTS;
  window.CATEGORY_ICONS = ns.CATEGORY_ICONS;
  window.getCategoryIcon = ns.getCategoryIcon;
  window.getCategoryKey = ns.getCategoryKey;
  window.getStatusBadge = ns.getStatusBadge;
  window.STORAGE_EVENTS_KEY = ns.STORAGE_EVENTS_KEY;
  window.STORAGE_FAV_KEY = ns.STORAGE_FAV_KEY;
  window.STORAGE_ADMIN_KEY = ns.STORAGE_ADMIN_KEY;
  window.STORAGE_THEME_KEY = ns.STORAGE_THEME_KEY;
})(typeof window !== 'undefined' ? window : global);
