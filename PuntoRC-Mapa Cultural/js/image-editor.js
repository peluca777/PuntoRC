/**
 * PuntoRC - Mapa Cultural
 * Dominio de Administración: Editor de Imagen (Subida Local + Recorte Canvas)
 * ADR-009/ADR-011: Canvas nativo, compresión obligatoria max 1920x1080px / JPEG 0.8
 */
(function(window) {
  'use strict';
  window.PuntoRC = window.PuntoRC || {};
  const ns = window.PuntoRC;

  /* ────────────────────────────────────────────────────────
     CONSTANTES
     ──────────────────────────────────────────────────────── */
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
  const CROP_ASPECT   = 16 / 9;
  const MAX_OUTPUT_W  = 1920;
  const JPEG_QUALITY  = 0.8;
  const HANDLE_SIZE   = 12;
  const URL_DEBOUNCE  = 500;

  /* ────────────────────────────────────────────────────────
     UTILIDADES
     ──────────────────────────────────────────────────────── */
  function toast(msg, type) {
    if (typeof window.showToast === 'function') return window.showToast(msg, type);
    if (ns.showToast) return ns.showToast(msg, type);
  }

  function $(id) { return document.getElementById(id); }

  function debounce(fn, ms) {
    let t;
    return function(...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  /**
   * Comprime cualquier imagen (dataURL o Image) a un canvas de máx. maxW y exporta JPEG con quality
   */
  function compressImageSource(imgElement, maxW, quality) {
    const origW = imgElement.naturalWidth || imgElement.width;
    const origH = imgElement.naturalHeight || imgElement.height;
    const scale = origW > maxW ? maxW / origW : 1;
    const targetW = Math.max(1, Math.round(origW * scale));
    const targetH = Math.max(1, Math.round(origH * scale));

    const c = document.createElement('canvas');
    c.width = targetW;
    c.height = targetH;
    const ctx = c.getContext('2d');
    ctx.drawImage(imgElement, 0, 0, targetW, targetH);
    return c.toDataURL('image/jpeg', quality);
  }

  /* ────────────────────────────────────────────────────────
     ESTADO INTERNO
     ──────────────────────────────────────────────────────── */
  let currentMode  = 'url';   // 'url' | 'file'
  let loadedImgSrc = null;    // dataURL o URL cargada para preview/crop

  /* ────────────────────────────────────────────────────────
     CROP STATE
     ──────────────────────────────────────────────────────── */
  const crop = {
    img: null,            // HTMLImageElement cargada
    canvas: null,
    ctx: null,
    // Escala para dibujar la imagen completa en el canvas
    drawW: 0,
    drawH: 0,
    // Región de recorte (coordenadas en el canvas)
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    // Drag / Resize state
    isDragging: false,
    isResizing: false,
    activeHandle: null,   // 'tl' | 'tr' | 'bl' | 'br'
    startMX: 0,
    startMY: 0,
    startX: 0,
    startY: 0,
    startW: 0,
    startH: 0
  };

  /* ────────────────────────────────────────────────────────
     1. TABS URL / ARCHIVO
     ──────────────────────────────────────────────────────── */
  function initTabs() {
    const tabUrl  = $('tab-image-url');
    const tabFile = $('tab-image-file');
    if (!tabUrl || !tabFile) return;

    tabUrl.addEventListener('click',  () => setMode('url'));
    tabFile.addEventListener('click', () => setMode('file'));
  }

  function setMode(mode) {
    currentMode = mode;
    const tabUrl   = $('tab-image-url');
    const tabFile  = $('tab-image-file');
    const panelUrl = $('panel-image-url');
    const panelFile = $('panel-image-file');

    if (!tabUrl || !tabFile || !panelUrl || !panelFile) return;

    const activeClasses   = ['bg-purple-600', 'text-white'];
    const inactiveClasses = ['bg-slate-50', 'dark:bg-zinc-900', 'text-slate-600', 'dark:text-zinc-400'];

    if (mode === 'url') {
      tabUrl.setAttribute('aria-selected', 'true');
      tabFile.setAttribute('aria-selected', 'false');
      tabUrl.classList.remove(...inactiveClasses);
      tabUrl.classList.add(...activeClasses);
      tabFile.classList.remove(...activeClasses);
      tabFile.classList.add(...inactiveClasses);
      panelUrl.classList.remove('hidden');
      panelFile.classList.add('hidden');
    } else {
      tabFile.setAttribute('aria-selected', 'true');
      tabUrl.setAttribute('aria-selected', 'false');
      tabFile.classList.remove(...inactiveClasses);
      tabFile.classList.add(...activeClasses);
      tabUrl.classList.remove(...activeClasses);
      tabUrl.classList.add(...inactiveClasses);
      panelFile.classList.remove('hidden');
      panelUrl.classList.add('hidden');
    }
  }

  /* ────────────────────────────────────────────────────────
     2. FILE UPLOAD (FileReader → Compresión obligatoria → dataURL)
     ──────────────────────────────────────────────────────── */
  function initFileUpload() {
    const fileInput = $('crud-image-file-input');
    const dropZone  = $('crud-image-drop-zone');
    if (!fileInput) return;

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    });

    if (dropZone) {
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drop-zone-active');
      });
      dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drop-zone-active');
      });
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drop-zone-active');
        const file = e.dataTransfer?.files?.[0];
        if (file) processFile(file);
      });
    }
  }

  function processFile(file) {
    if (!file.type.startsWith('image/')) {
      toast('El archivo seleccionado no es una imagen válida', 'error');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast('La imagen supera el límite de 10 MB', 'error');
      return;
    }

    showLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target.result;
      const tempImg = new Image();
      tempImg.onload = () => {
        try {
          // Compresión preventiva obligatoria (Guardrail ADR-009)
          const compressed = compressImageSource(tempImg, MAX_OUTPUT_W, JPEG_QUALITY);
          loadedImgSrc = compressed;
          showPreview(compressed);
          const hiddenInput = $('crud-image');
          if (hiddenInput) hiddenInput.value = compressed;
        } catch (err) {
          toast('Error al optimizar la imagen', 'error');
        } finally {
          showLoading(false);
        }
      };
      tempImg.onerror = () => {
        toast('Error al leer el archivo de imagen', 'error');
        showLoading(false);
      };
      tempImg.src = rawDataUrl;
    };
    reader.onerror = () => {
      toast('Error al leer el archivo de imagen', 'error');
      showLoading(false);
    };
    reader.readAsDataURL(file);
  }

  /* ────────────────────────────────────────────────────────
     3. URL PREVIEW (con debounce y eventos input + change)
     ──────────────────────────────────────────────────────── */
  function initUrlPreview() {
    const urlInput = $('crud-image-url-input');
    if (!urlInput) return;

    const handleUrlChange = () => {
      if (currentMode !== 'url') return;
      const val = urlInput.value.trim();

      const hiddenInput = $('crud-image');
      if (hiddenInput) hiddenInput.value = val;

      if (!val || !isUrlLike(val)) {
        hidePreview();
        return;
      }
      loadImageFromUrl(val);
    };

    urlInput.addEventListener('input', debounce(handleUrlChange, URL_DEBOUNCE));
    urlInput.addEventListener('change', handleUrlChange);
  }

  function isUrlLike(str) {
    return /^https?:\/\/.+\..+/i.test(str);
  }

  function loadImageFromUrl(url) {
    showLoading(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      loadedImgSrc = url;
      showPreview(url);
      showLoading(false);
    };
    img.onerror = () => {
      hidePreview();
      showLoading(false);
    };
    img.src = url;
  }

  /* ────────────────────────────────────────────────────────
     4. PREVIEW & FEEDBACK
     ──────────────────────────────────────────────────────── */
  function showPreview(src) {
    const wrapper = $('crud-image-preview-wrapper');
    const img     = $('crud-image-preview');
    const cropBtn = $('crud-crop-btn');
    if (!wrapper || !img) return;

    img.src = src;
    wrapper.classList.remove('hidden');
    if (cropBtn) {
      cropBtn.disabled = false;
      cropBtn.classList.remove('disabled:opacity-40', 'disabled:cursor-not-allowed');
    }
  }

  function hidePreview() {
    const wrapper = $('crud-image-preview-wrapper');
    const cropBtn = $('crud-crop-btn');
    if (wrapper) wrapper.classList.add('hidden');
    if (cropBtn) {
      cropBtn.disabled = true;
      cropBtn.classList.add('disabled:opacity-40', 'disabled:cursor-not-allowed');
    }
    loadedImgSrc = null;
  }

  function showLoading(show) {
    const el = $('crud-image-loading');
    if (!el) return;
    if (show) el.classList.remove('hidden');
    else el.classList.add('hidden');
  }

  /* ────────────────────────────────────────────────────────
     5. CROP EDITOR — MODAL
     ──────────────────────────────────────────────────────── */
  function initCropEditor() {
    $('crud-crop-btn')?.addEventListener('click', () => {
      if (!loadedImgSrc) return;
      openCropEditor(loadedImgSrc);
    });
    $('crop-close-btn')?.addEventListener('click', closeCropEditor);
    $('crop-cancel-btn')?.addEventListener('click', closeCropEditor);
    $('crop-apply-btn')?.addEventListener('click', applyCrop);

    const modal = $('crop-editor-modal');
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) closeCropEditor();
    });
  }

  function openCropEditor(imgSrc) {
    const modal  = $('crop-editor-modal');
    const canvas = $('crop-canvas');
    if (!modal || !canvas) return;

    crop.canvas = canvas;
    crop.ctx    = canvas.getContext('2d');

    showLoading(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      crop.img = img;

      // Abrir modal primero para que el wrapper tenga dimensiones reales
      modal.classList.remove('opacity-0', 'pointer-events-none');
      modal.classList.add('opacity-100', 'pointer-events-auto');
      modal.setAttribute('aria-hidden', 'false');

      setupCanvas();
      initCropRegion();
      drawScene();
      bindCanvasEvents();
      showLoading(false);
    };
    img.onerror = () => {
      showLoading(false);
      toast('Esta imagen no permite recorte por restricciones del servidor. Podés descargarla y subirla como archivo.', 'info');
    };
    img.src = imgSrc;
  }

  function closeCropEditor() {
    const modal = $('crop-editor-modal');
    if (!modal) return;
    modal.classList.remove('opacity-100', 'pointer-events-auto');
    modal.classList.add('opacity-0', 'pointer-events-none');
    modal.setAttribute('aria-hidden', 'true');
    unbindCanvasEvents();
    crop.isDragging = false;
    crop.isResizing = false;
    crop.activeHandle = null;
  }

  /* ────────────────────────────────────────────────────────
     6. CANVAS SETUP & RENDERING
     ──────────────────────────────────────────────────────── */
  function setupCanvas() {
    const wrapper = $('crop-canvas-wrapper');
    if (!wrapper || !crop.img) return;

    const maxW = wrapper.clientWidth || 500;
    const maxH = Math.min(window.innerHeight * 0.52, 420);

    const scale = Math.min(maxW / crop.img.naturalWidth, maxH / crop.img.naturalHeight);
    crop.drawW = Math.max(10, Math.round(crop.img.naturalWidth * scale));
    crop.drawH = Math.max(10, Math.round(crop.img.naturalHeight * scale));

    crop.canvas.width  = crop.drawW;
    crop.canvas.height = crop.drawH;
  }

  function initCropRegion() {
    const maxW = crop.drawW * 0.9;
    const maxH = crop.drawH * 0.9;
    let w = maxW;
    let h = w / CROP_ASPECT;
    if (h > maxH) {
      h = maxH;
      w = h * CROP_ASPECT;
    }
    crop.w = Math.round(w);
    crop.h = Math.round(h);
    crop.x = Math.round((crop.drawW - crop.w) / 2);
    crop.y = Math.round((crop.drawH - crop.h) / 2);
  }

  function drawScene() {
    const { ctx, img, drawW, drawH, x, y, w, h } = crop;
    if (!ctx || !img) return;

    // 1. Imagen base
    ctx.clearRect(0, 0, drawW, drawH);
    ctx.drawImage(img, 0, 0, drawW, drawH);

    // 2. Máscara oscura fuera del área de recorte
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, drawW, y);
    ctx.fillRect(0, y + h, drawW, drawH - y - h);
    ctx.fillRect(0, y, x, h);
    ctx.fillRect(x + w, y, drawW - x - w, h);

    // 3. Borde del cuadro de recorte (Violeta Neón)
    ctx.strokeStyle = '#9333ea';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // 4. Guías de la regla de tercios
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.35)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(x + (w * i / 3), y);
      ctx.lineTo(x + (w * i / 3), y + h);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, y + (h * i / 3));
      ctx.lineTo(x + w, y + (h * i / 3));
      ctx.stroke();
    }

    // 5. Handles de las esquinas
    ctx.fillStyle = '#a855f7';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    const hs = HANDLE_SIZE;
    const handles = getHandlePositions();
    for (const key of Object.keys(handles)) {
      const hp = handles[key];
      ctx.fillRect(hp.x - hs / 2, hp.y - hs / 2, hs, hs);
      ctx.strokeRect(hp.x - hs / 2, hp.y - hs / 2, hs, hs);
    }
  }

  function getHandlePositions() {
    return {
      tl: { x: crop.x,          y: crop.y },
      tr: { x: crop.x + crop.w, y: crop.y },
      bl: { x: crop.x,          y: crop.y + crop.h },
      br: { x: crop.x + crop.w, y: crop.y + crop.h }
    };
  }

  /* ────────────────────────────────────────────────────────
     7. INTERACCIÓN (POINTER / TOUCH / MOUSE)
     ──────────────────────────────────────────────────────── */
  let _onPointerDown, _onPointerMove, _onPointerUp;

  function bindCanvasEvents() {
    const c = crop.canvas;
    if (!c) return;

    _onPointerDown = onPointerDown;
    _onPointerMove = onPointerMove;
    _onPointerUp   = onPointerUp;

    c.addEventListener('mousedown',  _onPointerDown);
    window.addEventListener('mousemove',  _onPointerMove);
    window.addEventListener('mouseup',    _onPointerUp);

    c.addEventListener('touchstart', _onPointerDown, { passive: false });
    window.addEventListener('touchmove',  _onPointerMove, { passive: false });
    window.addEventListener('touchend',   _onPointerUp);
  }

  function unbindCanvasEvents() {
    const c = crop.canvas;
    if (!c) return;

    c.removeEventListener('mousedown',  _onPointerDown);
    window.removeEventListener('mousemove',  _onPointerMove);
    window.removeEventListener('mouseup',    _onPointerUp);

    c.removeEventListener('touchstart', _onPointerDown);
    window.removeEventListener('touchmove',  _onPointerMove);
    window.removeEventListener('touchend',   _onPointerUp);
  }

  function getPointerPos(e) {
    const rect = crop.canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
      return { mx: e.touches[0].clientX - rect.left, my: e.touches[0].clientY - rect.top };
    }
    return { mx: e.clientX - rect.left, my: e.clientY - rect.top };
  }

  function hitTestHandle(mx, my) {
    const handles = getHandlePositions();
    const threshold = HANDLE_SIZE + 6;
    for (const [key, pos] of Object.entries(handles)) {
      if (Math.abs(mx - pos.x) < threshold && Math.abs(my - pos.y) < threshold) {
        return key;
      }
    }
    return null;
  }

  function isInsideCrop(mx, my) {
    return mx >= crop.x && mx <= crop.x + crop.w &&
           my >= crop.y && my <= crop.y + crop.h;
  }

  function onPointerDown(e) {
    const { mx, my } = getPointerPos(e);

    const handle = hitTestHandle(mx, my);
    if (handle) {
      e.preventDefault();
      crop.isResizing = true;
      crop.activeHandle = handle;
      crop.startMX = mx;
      crop.startMY = my;
      crop.startX = crop.x;
      crop.startY = crop.y;
      crop.startW = crop.w;
      crop.startH = crop.h;
      crop.canvas.classList.add('is-resizing');
      return;
    }

    if (isInsideCrop(mx, my)) {
      e.preventDefault();
      crop.isDragging = true;
      crop.startMX = mx;
      crop.startMY = my;
      crop.startX = crop.x;
      crop.startY = crop.y;
      crop.canvas.classList.add('is-dragging');
    }
  }

  function onPointerMove(e) {
    if (!crop.isDragging && !crop.isResizing) {
      // Feedback de cursor pasivo
      const { mx, my } = getPointerPos(e);
      const handle = hitTestHandle(mx, my);
      if (handle) {
        crop.canvas.classList.remove('is-dragging');
        crop.canvas.classList.add('is-resizing');
      } else if (isInsideCrop(mx, my)) {
        crop.canvas.classList.remove('is-resizing');
        crop.canvas.classList.add('is-dragging');
      } else {
        crop.canvas.classList.remove('is-dragging', 'is-resizing');
      }
      return;
    }

    e.preventDefault();
    const { mx, my } = getPointerPos(e);

    if (crop.isDragging) {
      let newX = crop.startX + (mx - crop.startMX);
      let newY = crop.startY + (my - crop.startMY);
      newX = Math.max(0, Math.min(newX, crop.drawW - crop.w));
      newY = Math.max(0, Math.min(newY, crop.drawH - crop.h));
      crop.x = newX;
      crop.y = newY;
      drawScene();
      return;
    }

    if (crop.isResizing) {
      const dx = mx - crop.startMX;
      const dy = my - crop.startMY;
      resizeCrop(dx, dy);
      drawScene();
    }
  }

  function onPointerUp() {
    crop.isDragging = false;
    crop.isResizing = false;
    crop.activeHandle = null;
    crop.canvas?.classList.remove('is-dragging', 'is-resizing');
  }

  function resizeCrop(dx, dy) {
    const minW = 64;
    const minH = minW / CROP_ASPECT;
    const handle = crop.activeHandle;

    let newX = crop.startX;
    let newY = crop.startY;
    let newW = crop.startW;
    let newH = crop.startH;

    switch (handle) {
      case 'br':
        newW = crop.startW + dx;
        newH = newW / CROP_ASPECT;
        break;
      case 'bl':
        newW = crop.startW - dx;
        newH = newW / CROP_ASPECT;
        newX = crop.startX + dx;
        break;
      case 'tr':
        newW = crop.startW + dx;
        newH = newW / CROP_ASPECT;
        newY = crop.startY + crop.startH - newH;
        break;
      case 'tl':
        newW = crop.startW - dx;
        newH = newW / CROP_ASPECT;
        newX = crop.startX + dx;
        newY = crop.startY + crop.startH - newH;
        break;
    }

    if (newW < minW) { newW = minW; newH = minW / CROP_ASPECT; }

    if (newX < 0) { newW += newX; newH = newW / CROP_ASPECT; newX = 0; }
    if (newY < 0) { newH += newY; newW = newH * CROP_ASPECT; newY = 0; }
    if (newX + newW > crop.drawW) { newW = crop.drawW - newX; newH = newW / CROP_ASPECT; }
    if (newY + newH > crop.drawH) { newH = crop.drawH - newY; newW = newH * CROP_ASPECT; }

    if (newW >= minW && newH >= minH) {
      crop.x = Math.round(newX);
      crop.y = Math.round(newY);
      crop.w = Math.round(newW);
      crop.h = Math.round(newH);
    }
  }

  /* ────────────────────────────────────────────────────────
     8. APLICAR RECORTE + COMPRESIÓN OBLIGATORIA
     ──────────────────────────────────────────────────────── */
  function applyCrop() {
    if (!crop.img || !crop.ctx) return;

    try {
      const scaleX = crop.img.naturalWidth / crop.drawW;
      const scaleY = crop.img.naturalHeight / crop.drawH;

      const srcX = Math.round(crop.x * scaleX);
      const srcY = Math.round(crop.y * scaleY);
      const srcW = Math.round(crop.w * scaleX);
      const srcH = Math.round(crop.h * scaleY);

      const outCanvas = document.createElement('canvas');
      const outW = Math.min(srcW, MAX_OUTPUT_W);
      const outH = Math.round(outW / CROP_ASPECT);
      outCanvas.width  = Math.round(outW);
      outCanvas.height = outH;

      const outCtx = outCanvas.getContext('2d');
      outCtx.drawImage(crop.img, srcX, srcY, srcW, srcH, 0, 0, outCanvas.width, outCanvas.height);

      const compressedDataUrl = outCanvas.toDataURL('image/jpeg', JPEG_QUALITY);

      // Persistir en el campo del formulario y en la vista previa
      const hiddenInput = $('crud-image');
      if (hiddenInput) hiddenInput.value = compressedDataUrl;

      loadedImgSrc = compressedDataUrl;
      showPreview(compressedDataUrl);

      closeCropEditor();
      toast('Imagen recortada y optimizada con éxito', 'success');
    } catch (err) {
      if (err.name === 'SecurityError') {
        toast('Esta imagen no permite recorte por restricciones del servidor. Podés descargarla y subirla como archivo.', 'info');
      } else {
        toast('Error al procesar el recorte de imagen', 'error');
      }
      closeCropEditor();
    }
  }

  /* ────────────────────────────────────────────────────────
     9. API PÚBLICA (PuntoRC.ImageEditor)
     ──────────────────────────────────────────────────────── */
  function loadPreview(imgValue) {
    if (!imgValue) { hidePreview(); return; }

    loadedImgSrc = imgValue;

    if (imgValue.startsWith('data:')) {
      setMode('file');
      showPreview(imgValue);
    } else {
      setMode('url');
      const urlInput = $('crud-image-url-input');
      if (urlInput) urlInput.value = imgValue;
      showPreview(imgValue);
    }
    const hiddenInput = $('crud-image');
    if (hiddenInput) hiddenInput.value = imgValue;
  }

  function reset() {
    setMode('url');
    hidePreview();
    const urlInput = $('crud-image-url-input');
    if (urlInput) urlInput.value = '';
    const hiddenInput = $('crud-image');
    if (hiddenInput) hiddenInput.value = '';
    const fileInput = $('crud-image-file-input');
    if (fileInput) fileInput.value = '';
    loadedImgSrc = null;
    crop.img = null;
  }

  function initImageEditor() {
    initTabs();
    initFileUpload();
    initUrlPreview();
    initCropEditor();
  }

  ns.ImageEditor = {
    init: initImageEditor,
    loadPreview: loadPreview,
    reset: reset,
    getMode: () => currentMode,
    getImageValue: () => $('crud-image')?.value || ''
  };
  window.ImageEditor = ns.ImageEditor;

})(typeof window !== 'undefined' ? window : global);
