/* UPI QR Code Generator — application bootstrap & state */

import { createQR } from './qr.js';
import { validator } from './validator.js';
import { theme } from './theme.js';
import { utils } from './utils.js';
import { clipboard } from './clipboard.js';
import { render } from './download.js';
import { generator } from './generator.js';
import { config } from './config.js';
import { storage } from './storage.js';
import { card } from './card.js';
import { brands } from './brands.js';
import { pdf } from './pdf.js';
import { modal } from './modal.js';

const APP = config.APP;
const LEVEL = config.ERROR_CORRECTION;
const FIELDS = ['name', 'account', 'confirm', 'ifsc', 'amount', 'note'];
const THEME_OPTIONS = ['system', 'light', 'dark', 'high-contrast'];

const $ = (id) => document.getElementById(id);

export const initApp = () => {
  const form = $('upi-form');
  const cardEl = $('qr-card');
  const sizeSelect = $('size-select');
  const versionInfo = $('version-info');
  const rawUri = $('raw-uri');
  const printCard = $('print-card');
  const shortcutsHelp = $('shortcuts-help');
  const offlineNotice = $('offline-notice');
  const themeSelect = $('theme-select');

  const actionBtns = {
    png: $('download-png'),
    svg: $('download-svg'),
    pdf: $('download-pdf'),
    copyUri: $('copy-uri'),
    copyAccount: $('copy-account'),
    copyJson: $('copy-json'),
    copyQr: $('copy-qr'),
    share: $('share-btn'),
    openUpi: $('open-upi'),
    print: $('print-btn'),
    regenerate: $('regenerate-btn'),
  };

  const getInput = (name) => $(`field-${name}`);
  const getErrorEl = (name) => $(`field-${name}-error`);

  const state = {
    qr: null,
    payload: '',
    data: null,
    valid: false,
  };

  let toastTimer = null;
  const TOAST_ICONS = {
    success: 'fa-circle-check',
    error: 'fa-circle-exclamation',
    info: 'fa-circle-info',
  };

  const showToast = (message, tone = 'info') => {
    const toast = $('toast');
    const icon = TOAST_ICONS[tone] || TOAST_ICONS.info;
    toast.querySelector('.toast-text').textContent = message;
    toast.querySelector('.toast-icon').className = `fa-solid ${icon} toast-icon`;
    toast.classList.remove('success', 'error', 'info');
    if (tone) toast.classList.add(tone);
    toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
  };

  /* ---------------------------------------------------------------- */
  /* Form state                                                        */
  /* ---------------------------------------------------------------- */

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
      if (field) {
        field.classList.remove('is-valid');
        field.classList.add('is-invalid');
      }
      errorEl.textContent = message;
      errorEl.classList.add('show');
    } else {
      input.removeAttribute('aria-invalid');
      if (field) {
        field.classList.remove('is-invalid');
        field.classList.toggle('is-valid', input.value.trim() !== '');
      }
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

  /* ---------------------------------------------------------------- */
  /* Card rendering (single live preview)                              */
  /* ---------------------------------------------------------------- */

  const getExportSize = () => Number(sizeSelect.value) || config.DEFAULT_SIZE;

  const showVersionInfo = () => {
    if (!state.qr) {
      versionInfo.textContent = '';
      return;
    }
    const n = state.qr.getModuleCount();
    versionInfo.textContent = `Version ${state.qr.getVersion()} · ${n}×${n} modules · EC ${state.qr.getLevel()} · ${getExportSize()}px`;
  };

  const cloneCard = () => {
    const clone = cardEl.cloneNode(true);
    const canvas = clone.querySelector('#card-canvas');
    if (canvas && state.qr) {
      render.renderCanvas(canvas, state.qr, { size: card.CARD_QR_SIZE, dark: '#000000', light: '#ffffff' });
    }
    return clone;
  };

  const syncPrintCard = () => {
    if (printCard) {
      printCard.replaceChildren(cloneCard());
    }
  };

  const clearPrintClone = () => {
    if (printCard) printCard.replaceChildren();
  };

  const renderCard = () => {
    const data = getFormData();
    const result = validator.validateAll(data);
    state.valid = result.ok;
    state.data = data;
    if (!result.ok) {
      state.qr = null;
      state.payload = '';
      card.resetCard();
      clearPrintClone();
      closePreview();
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
      card.updateCard({ qr, data });
      syncPrintCard();
      refreshPreview();
      rawUri.value = payload;
      showVersionInfo();
      syncActions();
    } catch (_e) {
      state.qr = null;
      state.payload = '';
      card.resetCard();
      clearPrintClone();
      closePreview();
      rawUri.value = '';
      showVersionInfo();
      syncActions();
    }
  };

  const renderCardDebounced = utils.debounce(renderCard, 150);

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
    renderCardDebounced();
    persistForm();
  };

  const animateGenerate = () => {
    const stage = cardEl && cardEl.querySelector('.card-qr-stage');
    if (!stage) return;
    stage.classList.remove('animate');
    void stage.offsetWidth;
    stage.classList.add('animate');
  };

  const setGenerateLoading = (loading) => {
    const btn = $('generate-btn');
    btn.classList.toggle('is-loading', loading);
    btn.setAttribute('aria-busy', String(loading));
    btn.toggleAttribute('disabled', loading);
    btn.querySelector('.btn-label').textContent = loading ? 'Generating card…' : 'Generate payment card';
  };

  /* ---------------------------------------------------------------- */
  /* Generate / reset / regenerate                                     */
  /* ---------------------------------------------------------------- */

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
    renderCard();
    animateGenerate();
    setGenerateLoading(false);
    refreshPreview();
    cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const onReset = () => {
    form.reset();
    storage.removeItem(config.STORAGE_KEYS.form);
    for (const name of FIELDS) setFieldError(name, '');
    state.qr = null;
    state.payload = '';
    state.data = null;
    state.valid = false;
    card.resetCard();
    clearPrintClone();
    closePreview();
    rawUri.value = '';
    showVersionInfo();
    syncActions();
    getInput('name').focus();
    showToast('Card cleared', 'info');
  };

  const onRegenerate = () => {
    if (!state.valid || !state.qr) return;
    renderCard();
    animateGenerate();
    refreshPreview();
    showToast('Payment card regenerated', 'success');
  };

  /* ---------------------------------------------------------------- */
  /* Export actions                                                    */
  /* ---------------------------------------------------------------- */

  const syncActions = () => {
    const on = state.valid && state.qr;
    for (const btn of Object.values(actionBtns)) {
      if (btn) btn.toggleAttribute('disabled', !on);
    }
  };

  const getFilename = (ext) => `upi-card-${(state.data && state.data.account) || 'code'}.${ext}`;

  const paintCard = async () => {
    if (!state.valid || !state.qr) throw new Error('invalid state');
    return card.paintCard({ qr: state.qr, data: state.data, size: getExportSize() });
  };

  const onDownloadPng = async () => {
    if (!state.valid) return;
    try {
      const canvas = await paintCard();
      const ok = await render.downloadCanvas(canvas, getFilename('png'), 'image/png');
      showToast(ok ? 'PNG downloaded' : 'Download failed', ok ? 'success' : 'error');
    } catch (_e) {
      showToast('Download failed', 'error');
    }
  };

  const onDownloadSvg = async () => {
    if (!state.valid) return;
    try {
      const canvas = await paintCard();
      const { blob, filename } = await card.cardSVG(canvas, getFilename('svg'));
      utils.downloadFile(URL.createObjectURL(blob), filename);
      showToast('SVG downloaded', 'success');
    } catch (_e) {
      showToast('Download failed', 'error');
    }
  };

  const onDownloadPdf = async () => {
    if (!state.valid) return;
    try {
      const canvas = await paintCard();
      await pdf.downloadPDF(canvas, getFilename('pdf'));
      showToast('PDF downloaded', 'success');
    } catch (_e) {
      showToast('Download failed', 'error');
    }
  };

  const onCopy = async (kind) => {
    if (!state.valid || !state.qr) return;
    let text;
    let label;
    if (kind === 'uri') {
      text = state.payload;
      label = 'UPI URI copied';
    } else if (kind === 'account') {
      const data = state.data;
      text = [
        'UPI Payment Card',
        '',
        `Name: ${data.name.trim()}`,
        `Account: ${data.account.trim()}`,
        `IFSC: ${data.ifsc.trim()}`,
        `UPI: ${card.buildVpa(data)}`,
        `Amount: ${data.amount.trim() ? `₹${data.amount.trim()}` : 'Any amount'}`,
        `Note: ${data.note.trim() || '—'}`,
      ].join('\n');
      label = 'Account details copied';
    } else {
      const data = state.data;
      text = JSON.stringify(
        {
          app: APP.name,
          brand: config.BRAND.name,
          upi: state.payload,
          vpa: card.buildVpa(data),
          name: data.name,
          account: data.account,
          ifsc: data.ifsc,
          amount: data.amount,
          note: data.note,
          level: state.qr.getLevel(),
          version: state.qr.getVersion(),
          moduleCount: state.qr.getModuleCount(),
          size: getExportSize(),
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

  const onCopyQr = async () => {
    if (!state.valid) return;
    try {
      const canvas = await paintCard();
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (blob && navigator.clipboard && window.isSecureContext && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        showToast('QR image copied', 'success');
      } else if (blob) {
        utils.downloadFile(URL.createObjectURL(blob), getFilename('png'));
        showToast('Copy unsupported — PNG downloaded', 'success');
      } else {
        showToast('Failed to copy QR image', 'error');
      }
    } catch (_e) {
      showToast('Failed to copy QR image', 'error');
    }
  };

  const onPrint = () => {
    if (!state.valid) return;
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
    const data = state.data;
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

  /* ---------------------------------------------------------------- */
  /* Live preview modal                                                */
  /* ---------------------------------------------------------------- */

  const buildPreviewContent = () => {
    if (!state.valid || !state.qr) return null;
    return cloneCard();
  };

  const openPreview = () => {
    if (!state.valid || !state.qr) return;
    modal.openModal('preview', {
      title: 'UPI payment card',
      wide: true,
      content: buildPreviewContent(),
      actions: [
        { label: 'Print', icon: 'fa-print', variant: 'outline', onClick: onPrint, closeOnClick: false },
        { label: 'Close', icon: 'fa-xmark', variant: 'primary', closeOnClick: true },
      ],
    });
  };

  const closePreview = () => {
    modal.closeModal('preview');
  };

  const refreshPreview = () => {
    if (!modal.isModalOpen('preview')) return;
    const content = buildPreviewContent();
    if (content) modal.updateContent('preview', content);
  };

  /* ---------------------------------------------------------------- */
  /* Sidebar quick actions                                             */
  /* ---------------------------------------------------------------- */

  const initSidebar = () => {
    const scrollTo = (el) => el && el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const map = {
      generate: () => {
        const first = getInput('name');
        scrollTo(form);
        first.focus({ preventScroll: true });
      },
      downloads: () => scrollTo($('action-groups')),
      settings: () => {
        scrollTo($('preview-title'));
        sizeSelect.focus({ preventScroll: true });
      },
      help: () => {
        shortcutsHelp.open = !shortcutsHelp.open;
      },
      about: () => openAbout(),
    };
    document.querySelectorAll('.side-link[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const fn = map[btn.dataset.action];
        if (fn) fn();
      });
    });
  };

  /* ---------------------------------------------------------------- */
  /* About modal                                                       */
  /* ---------------------------------------------------------------- */

  const ABOUT_TITLE = 'About UPI QR Code Generator';

  const openAbout = () => {
    const template = $('about-modal-template');
    const content = template ? template.content.cloneNode(true) : null;
    modal.openModal('about', { title: ABOUT_TITLE, content });
  };

  const initAbout = () => {
    document.addEventListener('click', (event) => {
      if (event.target.closest('[data-about-open]')) openAbout();
    });
  };

  /* ---------------------------------------------------------------- */
  /* Navigation                                                        */
  /* ---------------------------------------------------------------- */

  const initNav = () => {
    const toggle = $('nav-toggle');
    const mobileNav = $('site-nav-mobile');
    const closeNav = () => {
      mobileNav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    };
    toggle.addEventListener('click', () => {
      const open = !mobileNav.classList.contains('is-open');
      mobileNav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
    mobileNav.addEventListener('click', (event) => {
      if (event.target.closest('a, button')) closeNav();
    });
    const header = document.querySelector('.site-header');
    const onScroll = () => header.setAttribute('data-scrolled', String(window.scrollY > 8));
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  };

  /* ---------------------------------------------------------------- */
  /* Theme, connectivity, footer                                       */
  /* ---------------------------------------------------------------- */

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

  const initFooter = () => {
    const year = $('footer-year');
    if (year) year.textContent = new Date().getFullYear();
    const version = $('app-version');
    if (version) version.textContent = APP.version;
    const headerVersion = $('header-version');
    if (headerVersion) headerVersion.textContent = APP.version;
  };

  /* ---------------------------------------------------------------- */
  /* Brand marks                                                       */
  /* ---------------------------------------------------------------- */

  const initBrands = () => {
    const logo = $('card-logo');
    if (logo) logo.src = brands.upi;
    const appMap = {
      gpay: $('card-app-gpay'),
      phonepay: $('card-app-phonepay'),
      paytm: $('card-app-paytm'),
      bhim: $('card-app-bhim'),
      amazon: $('card-app-amazon'),
    };
    for (const b of brands.list) {
      const el = appMap[b.key];
      if (el) el.src = brands[b.key];
    }
  };

  /* ---------------------------------------------------------------- */
  /* Shortcuts                                                         */
  /* ---------------------------------------------------------------- */

  const isTyping = (el) => {
    if (!(el instanceof Element)) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  };

  const onKeydown = (event) => {
    /* while a modal is open the manager owns all keyboard handling */
    if (modal.isModalOpen()) return;
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
      } else if (key === 'p' && event.shiftKey) {
        event.preventDefault();
        onDownloadPdf();
      }
      return;
    }
    if (event.key === 'Escape') {
      const mobileNav = $('site-nav-mobile');
      if (mobileNav && mobileNav.classList.contains('is-open')) {
        mobileNav.classList.remove('is-open');
        $('nav-toggle').setAttribute('aria-expanded', 'false');
      }
      return;
    }
    if (isTyping(event.target)) return;
    if (event.key === 'f' || event.key === 'F') {
      openPreview();
    } else if (event.key === 'g' || event.key === 'G') {
      getInput('name').focus();
    } else if (event.key === '?') {
      shortcutsHelp.open = !shortcutsHelp.open;
    }
  };

  /* ---------------------------------------------------------------- */
  /* Service worker                                                    */
  /* ---------------------------------------------------------------- */

  const registerServiceWorker = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  };

  /* ---------------------------------------------------------------- */
  /* Bind events                                                       */
  /* ---------------------------------------------------------------- */

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
    sizeSelect.addEventListener('change', renderCard);
    $('generate-btn').addEventListener('click', onGenerate);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      onGenerate();
    });
    $('reset-btn').addEventListener('click', onReset);
    $('actions-reset-btn').addEventListener('click', onReset);
    actionBtns.png.addEventListener('click', onDownloadPng);
    actionBtns.svg.addEventListener('click', onDownloadSvg);
    actionBtns.pdf.addEventListener('click', onDownloadPdf);
    actionBtns.copyUri.addEventListener('click', () => onCopy('uri'));
    actionBtns.copyAccount.addEventListener('click', () => onCopy('account'));
    actionBtns.copyJson.addEventListener('click', () => onCopy('json'));
    actionBtns.copyQr.addEventListener('click', onCopyQr);
    actionBtns.share.addEventListener('click', onShare);
    actionBtns.openUpi.addEventListener('click', onOpenUpi);
    actionBtns.print.addEventListener('click', onPrint);
    actionBtns.regenerate.addEventListener('click', onRegenerate);
    document.addEventListener('keydown', onKeydown);
  };

  bindEvents();
  restoreForm();
  initTheme();
  initConnectivity();
  initAbout();
  initNav();
  initFooter();
  initBrands();
  initSidebar();
  syncActions();
  renderCardDebounced();
  registerServiceWorker();
  document.documentElement.dataset.appReady = 'true';
};

utils.ready(() => initApp());
