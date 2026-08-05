import { createQR } from './qr.js';
import { validator } from './validator.js';
import { theme } from './theme.js';
import { utils } from './utils.js';
import { clipboard } from './clipboard.js';
import { render } from './download.js';
import { generator } from './generator.js';
import { config } from './config.js';
import { storage } from './storage.js';

const APP = config.APP;

const LEVEL = config.ERROR_CORRECTION;
const FIELDS = ['name', 'account', 'confirm', 'ifsc', 'amount', 'note'];
const THEME_OPTIONS = ['system', 'light', 'dark', 'high-contrast'];

const $ = (id) => document.getElementById(id);

export const initApp = () => {
  const form = $('upi-form');
  const previewCanvas = $('preview-canvas');
  const previewWrap = $('preview-wrap');
  const previewStatus = $('preview-status');
  const sizeSelect = $('size-select');
  const versionInfo = $('version-info');
  const rawUri = $('raw-uri');
  const copyUriBtn = $('copy-uri');
  const copyJsonBtn = $('copy-json');
  const copyRawBtn = $('copy-raw');
  const copyTxtBtn = $('copy-txt');
  const downloadPngBtn = $('download-png');
  const downloadSvgBtn = $('download-svg');
  const printBtn = $('print-qr');
  const shareBtn = $('share-btn');
  const fullscreenBtn = $('fullscreen-btn');
  const openUpiBtn = $('open-upi');
  const regenerateBtn = $('regenerate-btn');
  const generateBtn = $('generate-btn');
  const resetBtn = $('reset-btn');
  const themeSelect = $('theme-select');
  const toast = $('toast');
  const offlineNotice = $('offline-notice');
  const overlay = $('fullscreen-overlay');
  const fullscreenCanvas = $('fullscreen-canvas');
  const fullscreenClose = $('fullscreen-close');
  const shortcutsHelp = $('shortcuts-help');

  const getInput = (name) => $(`field-${name}`);
  const getErrorEl = (name) => $(`field-${name}-error`);

  const state = {
    qr: null,
    payload: '',
    valid: false,
  };

  let toastTimer = null;
  const TOAST_ICONS = {
    success: 'fa-circle-check',
    error: 'fa-circle-exclamation',
    info: 'fa-circle-info',
  };

  const showToast = (message, tone = 'info') => {
    const icon = TOAST_ICONS[tone] || TOAST_ICONS.info;
    toast.querySelector('.toast-text').textContent = message;
    toast.querySelector('.toast-icon').className = `fa-solid ${icon} toast-icon`;
    toast.classList.remove('success', 'error', 'info');
    if (tone) toast.classList.add(tone);
    toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
  };

  const getFormData = () => {
    const data = {};
    for (const name of FIELDS) data[name] = getInput(name).value;
    return data;
  };

  const persistForm = () => {
    storage.setJSON(config.STORAGE_KEYS.form, getFormData());
  };

  const restoreForm = () => {
    const saved = storage.getJSON(config.STORAGE_KEYS.form, {});
    for (const name of FIELDS) {
      const value = saved[name];
      if (typeof value !== 'string' || value === '') continue;
      const input = getInput(name);
      if (name === 'ifsc') {
        input.value = value.toUpperCase();
      } else if (name === 'account' || name === 'confirm') {
        input.value = value.replace(/\D/g, '');
      } else {
        input.value = value;
      }
    }
  };

  const setFieldError = (name, message) => {
    const input = getInput(name);
    const errorEl = getErrorEl(name);
    const field = input.closest('.field');
    if (message) {
      input.setAttribute('aria-invalid', 'true');
      if (field) field.classList.remove('is-valid');
      errorEl.textContent = message;
      errorEl.classList.add('show');
    } else {
      input.removeAttribute('aria-invalid');
      if (field) field.classList.toggle('is-valid', input.value.trim() !== '');
      errorEl.textContent = '';
      errorEl.classList.remove('show');
    }
  };

  const validateField = (name) => {
    const data = getFormData();
    const result =
      name === 'confirm'
        ? validator.validators.confirm(data.confirm, data.account)
        : validator.validators[name](data[name]);
    setFieldError(name, result.ok ? '' : result.message);
    return result.ok;
  };

  const setPreviewStatus = (message) => {
    previewWrap.classList.toggle('empty', Boolean(message));
    previewStatus.textContent = message || '';
  };

  const getSize = () => Number(sizeSelect.value) || config.DEFAULT_SIZE;

  const fillPrintSummary = () => {
    const data = getFormData();
    const name = $('print-name');
    const account = $('print-account');
    const amount = $('print-amount');
    if (name) name.textContent = data.name.trim();
    if (account) account.textContent = `${data.account.trim()} · ${data.ifsc.trim()}`;
    if (amount) amount.textContent = data.amount.trim() ? `₹${data.amount.trim()}` : 'Any amount';
  };

  const showVersionInfo = () => {
    if (!state.qr) {
      versionInfo.textContent = '';
      return;
    }
    const n = state.qr.getModuleCount();
    versionInfo.textContent = `Version ${state.qr.getVersion()} · ${n}×${n} modules · EC ${state.qr.getLevel()}`;
  };

  const renderPreview = () => {
    const data = getFormData();
    const result = validator.validateAll(data);
    state.valid = result.ok;
    if (!result.ok) {
      state.qr = null;
      state.payload = '';
      fillPrintSummary();
      setPreviewStatus('Fill in the highlighted fields to preview your QR code.');
      rawUri.value = '';
      showVersionInfo();
      syncActions();
      return;
    }
    try {
      const payload = generator.buildUpiPayload(data);
      const qr = createQR(payload, { level: LEVEL });
      state.qr = qr;
      state.payload = payload;
      fillPrintSummary();
      render.renderCanvas(previewCanvas, qr, {
        size: getSize(),
        dark: '#000000',
        light: '#ffffff',
      });
      setPreviewStatus('');
      rawUri.value = payload;
      showVersionInfo();
      syncActions();
    } catch (_e) {
      state.qr = null;
      state.payload = '';
      fillPrintSummary();
      setPreviewStatus('This input is too large to encode as a QR code.');
      rawUri.value = '';
      showVersionInfo();
      syncActions();
    }
  };

  const renderPreviewDebounced = utils.debounce(renderPreview, 150);

  const syncActions = () => {
    const on = state.valid && state.qr;
    [
      copyUriBtn,
      copyJsonBtn,
      copyRawBtn,
      copyTxtBtn,
      downloadPngBtn,
      downloadSvgBtn,
      printBtn,
      shareBtn,
      fullscreenBtn,
      openUpiBtn,
      regenerateBtn,
    ].forEach((btn) => btn.toggleAttribute('disabled', !on));
  };

  const getFilename = (ext) => `upi-qr-${getInput('account').value || 'code'}.${ext}`;

  const handleInput = (name) => {
    const input = getInput(name);
    if (name === 'ifsc') {
      const upper = input.value.toUpperCase();
      if (upper !== input.value) {
        input.value = upper;
        input.setSelectionRange(upper.length, upper.length);
      }
    }
    if (name === 'account' || name === 'confirm') {
      const digits = input.value.replace(/\D/g, '');
      if (digits !== input.value) {
        input.value = digits;
        input.setSelectionRange(digits.length, digits.length);
      }
    }
    validateField(name);
    if (name === 'account' && getInput('confirm').value !== '') validateField('confirm');
    renderPreviewDebounced();
    persistForm();
  };

  const animateGenerate = () => {
    previewWrap.classList.remove('animate');
    void previewWrap.offsetWidth;
    previewWrap.classList.add('animate');
  };

  const setGenerateLoading = (loading) => {
    generateBtn.classList.toggle('is-loading', loading);
    generateBtn.setAttribute('aria-busy', String(loading));
    generateBtn.toggleAttribute('disabled', loading);
    generateBtn.querySelector('.btn-label').textContent = loading ? 'Generating…' : 'Generate QR code';
  };

  const onGenerate = async () => {
    const data = getFormData();
    const result = validator.validateAll(data);
    if (!result.ok) {
      for (const name of FIELDS) validateField(name);
      const firstError = FIELDS.find((name) => getErrorEl(name).textContent);
      if (firstError) {
        const el = getInput(firstError);
        el.focus();
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    setGenerateLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 350));
    renderPreview();
    animateGenerate();
    setGenerateLoading(false);
    previewWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const onReset = () => {
    form.reset();
    storage.removeItem(config.STORAGE_KEYS.form);
    for (const name of FIELDS) setFieldError(name, '');
    state.qr = null;
    state.payload = '';
    state.valid = false;
    setPreviewStatus('Fill in the highlighted fields to preview your QR code.');
    rawUri.value = '';
    versionInfo.textContent = '';
    syncActions();
    getInput('name').focus();
  };

  const onRegenerate = () => {
    if (!state.valid || !state.qr) return;
    renderPreview();
    animateGenerate();
    showToast('QR code regenerated', 'success');
  };

  const onCopy = async (kind) => {
    if (!state.valid || !state.qr) return;
    let text;
    let label;
    if (kind === 'uri') {
      text = state.payload;
      label = 'UPI URI copied';
    } else if (kind === 'raw') {
      text = state.payload;
      label = 'Raw URI copied';
    } else if (kind === 'txt') {
      text = generator.buildSummary(getFormData());
      label = 'Summary copied';
    } else {
      const data = getFormData();
      text = JSON.stringify(
        {
          app: APP.name,
          upi: state.payload,
          account: data.account,
          ifsc: data.ifsc,
          name: data.name,
          amount: data.amount,
          note: data.note,
          level: state.qr.getLevel(),
          version: state.qr.getVersion(),
          moduleCount: state.qr.getModuleCount(),
          size: getSize(),
          createdAt: new Date().toISOString(),
        },
        null,
        2
      );
      label = 'JSON copied';
    }
    const ok = await clipboard.copyText(text);
    showToast(ok ? label : 'Copy failed — select the text manually.', ok ? 'success' : 'error');
  };

  const onDownloadPng = async () => {
    if (!state.qr) return;
    const ok = await render.downloadPNG(state.qr, {
      size: getSize(),
      filename: getFilename('png'),
      dark: '#000000',
      light: '#ffffff',
    });
    showToast(ok ? 'PNG downloaded' : 'Download failed', ok ? 'success' : 'error');
  };

  const onDownloadSvg = () => {
    if (!state.qr) return;
    render.downloadSVG(state.qr, {
      filename: getFilename('svg'),
      dark: '#000000',
      light: '#ffffff',
    });
    showToast('SVG downloaded', 'success');
  };

  const onPrint = () => {
    if (!state.qr) return;
    window.print();
  };

  const onOpenUpi = () => {
    if (!state.valid || !state.qr) return;
    const anchor = document.createElement('a');
    anchor.href = state.payload;
    anchor.target = '_self';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    showToast('Opening UPI app…', 'info');
  };

  const onShare = async () => {
    if (!state.valid || !state.qr) return;
    const data = getFormData();
    const text = `${data.name.trim()}\nUPI: ${state.payload}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: APP.name, text });
        showToast('Shared', 'success');
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }
    }
    const ok = await clipboard.copyText(state.payload);
    showToast(ok ? 'Sharing unavailable — UPI URI copied instead' : 'Sharing unavailable', ok ? 'success' : 'error');
  };

  const openFullscreen = () => {
    if (!state.qr) return;
    render.renderCanvas(fullscreenCanvas, state.qr, {
      size: 1024,
      dark: '#000000',
      light: '#ffffff',
    });
    overlay.hidden = false;
    document.body.classList.add('no-scroll');
    fullscreenClose.focus();
  };

  const closeFullscreen = () => {
    if (overlay.hidden) return;
    overlay.hidden = true;
    document.body.classList.remove('no-scroll');
    fullscreenBtn.focus();
  };

  const toggleShortcuts = () => {
    shortcutsHelp.open = !shortcutsHelp.open;
  };

  const closeNav = () => {
    const nav = $('site-nav');
    const toggle = $('nav-toggle');
    if (!nav || !nav.classList.contains('is-open')) return;
    nav.classList.remove('is-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  };

  const isTyping = (el) => {
    if (!(el instanceof Element)) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  };

  const onKeydown = (event) => {
    if (event.ctrlKey || event.metaKey) {
      const key = event.key.toLowerCase();
      if (key === 'enter') {
        event.preventDefault();
        onGenerate();
      } else if (key === 'd') {
        event.preventDefault();
        onDownloadPng();
      } else if (key === 's') {
        event.preventDefault();
        onDownloadSvg();
      } else if (key === 'p') {
        event.preventDefault();
        onPrint();
      }
      return;
    }
    if (event.key === 'Escape') {
      if ($('site-nav') && $('site-nav').classList.contains('is-open')) {
        closeNav();
        return;
      }
      closeFullscreen();
      return;
    }
    if (isTyping(event.target)) return;
    if (event.key === 'f' || event.key === 'F') {
      if (state.valid && state.qr) openFullscreen();
    } else if (event.key === '?') {
      toggleShortcuts();
    }
  };

  const initTheme = () => {
    theme.init();
    themeSelect.value = THEME_OPTIONS.includes(theme.getStored()) ? theme.getStored() : 'system';
    themeSelect.addEventListener('change', () => theme.set(themeSelect.value));
  };

  const initConnectivity = () => {
    const update = () => {
      offlineNotice.hidden = navigator.onLine;
    };
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();
  };

  const initAbout = () => {
    const dialog = $('about-dialog');
    if (!dialog) return;
    const open = () => {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    };
    const close = () => {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    };
    document.querySelectorAll('[data-about-open]').forEach((el) => el.addEventListener('click', open));
    document.querySelectorAll('[data-about-close]').forEach((el) => el.addEventListener('click', close));
    const closeBtn = $('about-close');
    if (closeBtn) closeBtn.addEventListener('click', close);
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) close();
    });
  };

  const initNav = () => {
    const toggle = $('nav-toggle');
    const nav = $('site-nav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', () => {
      const open = !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', (event) => {
      if (event.target.closest('a, button')) closeNav();
    });
  };

  const initFooter = () => {
    const year = $('footer-year');
    if (year) year.textContent = new Date().getFullYear();
    const version = $('app-version');
    if (version) version.textContent = APP.version;
  };

  const registerServiceWorker = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  };

  const bindEvents = () => {
    for (const name of FIELDS) {
      getInput(name).addEventListener('input', () => handleInput(name));
    }
    sizeSelect.innerHTML = '';
    for (const preset of config.SIZE_PRESETS) {
      const option = document.createElement('option');
      option.value = String(preset);
      option.textContent = `${preset} × ${preset}`;
      if (preset === config.DEFAULT_SIZE) option.selected = true;
      sizeSelect.appendChild(option);
    }
    sizeSelect.addEventListener('change', renderPreview);
    copyUriBtn.addEventListener('click', () => onCopy('uri'));
    copyRawBtn.addEventListener('click', () => onCopy('raw'));
    copyJsonBtn.addEventListener('click', () => onCopy('json'));
    copyTxtBtn.addEventListener('click', () => onCopy('txt'));
    downloadPngBtn.addEventListener('click', onDownloadPng);
    downloadSvgBtn.addEventListener('click', onDownloadSvg);
    printBtn.addEventListener('click', onPrint);
    shareBtn.addEventListener('click', onShare);
    fullscreenBtn.addEventListener('click', openFullscreen);
    openUpiBtn.addEventListener('click', onOpenUpi);
    regenerateBtn.addEventListener('click', onRegenerate);
    generateBtn.addEventListener('click', onGenerate);
    resetBtn.addEventListener('click', onReset);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      onGenerate();
    });
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) closeFullscreen();
    });
    fullscreenClose.addEventListener('click', closeFullscreen);

    const bindKeydown = window.jQuery
      ? (fn) => window.jQuery(document).on('keydown', fn)
      : (fn) => document.addEventListener('keydown', fn);
    bindKeydown(onKeydown);
  };

  bindEvents();
  restoreForm();
  initTheme();
  initConnectivity();
  initAbout();
  initNav();
  initFooter();
  syncActions();
  renderPreviewDebounced();
  registerServiceWorker();
  getInput('name').focus();
};

utils.ready(() => initApp());
