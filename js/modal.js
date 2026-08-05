/* UPI QR Code Generator — reusable modal manager.
 *
 * Guarantees:
 *   - a single instance per modal id (never duplicate overlays),
 *   - a single set of global listeners (bound exactly once),
 *   - one open modal at a time (nested modals are prevented),
 *   - body scroll lock with previous-value restore,
 *   - focus save / trap / restore,
 *   - ESC, close button, outside + touch close and browser-back,
 *   - opacity/transform animation honouring prefers-reduced-motion.
 *
 * API: createModal, openModal, closeModal, destroyModal, isModalOpen,
 *      toggleModal, updateContent, cleanup
 */

const MODAL_DURATION = 180;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const modals = new Map();
let bound = false;
let lockCount = 0;
let lockState = null;
let inertSiblings = [];
let lastFocus = null;

const escapeSelector = (id) => String(id).replace(/[^a-zA-Z0-9_-]/g, '_');

const makeOverlay = (id) => {
  const safeId = escapeSelector(id);
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.dataset.modalId = id;
  overlay.innerHTML = [
    `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title-${safeId}" tabindex="-1">`,
    `  <div class="modal-head">`,
    `    <h2 id="modal-title-${safeId}" class="modal-title"></h2>`,
    `    <button type="button" class="modal-close" data-modal-close aria-label="Close dialog">`,
    `      <i class="fa-solid fa-xmark" aria-hidden="true"></i>`,
    `    </button>`,
    `  </div>`,
    `  <div class="modal-body"></div>`,
    `  <div class="modal-foot" hidden></div>`,
    `</div>`,
  ].join('\n');

  const dialog = overlay.querySelector('.modal');
  const body = overlay.querySelector('.modal-body');
  const foot = overlay.querySelector('.modal-foot');

  const record = {
    id,
    overlay,
    dialog,
    body,
    foot,
    title: overlay.querySelector('.modal-title'),
    options: {},
    open: false,
    token: null,
    prevFocus: null,
  };

  /* Delegated listeners — attached ONCE at creation, removed on destroy. */
  overlay.addEventListener('pointerdown', (event) => {
    if (!record.open) return;
    if (event.target === overlay) closeModal(id);
  });
  overlay.addEventListener('click', (event) => {
    if (!record.open) return;
    if (event.target.closest('[data-modal-close]')) closeModal(id);
  });

  return record;
};

/* ------------------------------------------------------------------ */
/* Body scroll lock (restores the exact previous value)                */
/* ------------------------------------------------------------------ */

const lockBody = () => {
  if (lockCount === 0) {
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    lockState = {
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
      scrollbar,
    };
    document.body.style.overflow = 'hidden';
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
  }
  lockCount += 1;
};

const unlockBody = () => {
  if (lockCount === 0) return;
  lockCount -= 1;
  if (lockCount === 0 && lockState) {
    document.body.style.overflow = lockState.overflow;
    document.body.style.paddingRight = lockState.paddingRight;
    lockState = null;
  }
};

/* ------------------------------------------------------------------ */
/* Background inertness (a11y + focus containment)                     */
/* ------------------------------------------------------------------ */

const setBackgroundInert = () => {
  if (inertSiblings.length) return;
  const children = Array.from(document.body.children);
  for (const el of children) {
    if (el.classList.contains('modal-overlay') || el.classList.contains('toast')) continue;
    if (!el.hasAttribute('inert')) {
      el.setAttribute('inert', '');
      inertSiblings.push(el);
    }
  }
};

const restoreBackground = () => {
  for (const el of inertSiblings) el.removeAttribute('inert');
  inertSiblings = [];
};

/* ------------------------------------------------------------------ */
/* Content helpers (replace, never append)                             */
/* ------------------------------------------------------------------ */

const appendContent = (container, content) => {
  container.replaceChildren();
  if (content == null) return;
  if (typeof content === 'string') {
    const wrapper = document.createElement('template');
    wrapper.innerHTML = content;
    container.appendChild(wrapper.content);
  } else if (Array.isArray(content)) {
    for (const node of content) container.appendChild(node);
  } else if (content instanceof Node) {
    container.appendChild(content);
  }
};

const buildFooter = (record, actions) => {
  const { foot } = record;
  foot.replaceChildren();
  if (!actions || !actions.length) {
    foot.hidden = true;
    return;
  }
  foot.hidden = false;
  for (const action of actions) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `btn ${action.variant ? `btn--${action.variant}` : 'btn--primary'}`;
    if (action.icon) {
      const icon = document.createElement('i');
      icon.className = `fa-solid ${action.icon}`;
      icon.setAttribute('aria-hidden', 'true');
      btn.appendChild(icon);
    }
    const label = document.createElement('span');
    label.textContent = action.label;
    btn.appendChild(label);
    btn.addEventListener('click', (event) => {
      if (action.onClick) action.onClick(event);
      if (action.closeOnClick !== false) closeModal(record.id);
    });
    foot.appendChild(btn);
  }
};

/* ------------------------------------------------------------------ */
/* Focus management                                                    */
/* ------------------------------------------------------------------ */

const focusModal = (record) => {
  const selector = record.options.initialFocus;
  let target = null;
  if (selector) {
    target = record.dialog.querySelector(selector);
  }
  if (!target) {
    target = record.dialog.querySelector(FOCUSABLE) || record.dialog;
  }
  target.focus();
  lastFocus = record.prevFocus;
};

const trapFocus = (record, event) => {
  const focusables = Array.from(record.dialog.querySelectorAll(FOCUSABLE));
  if (!focusables.length) {
    event.preventDefault();
    record.dialog.focus();
    return;
  }
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const active = document.activeElement;
  if (event.shiftKey) {
    if (active === first || !record.dialog.contains(active)) {
      event.preventDefault();
      last.focus();
    }
  } else if (active === last || !record.dialog.contains(active)) {
    event.preventDefault();
    first.focus();
  }
};

/* ------------------------------------------------------------------ */
/* Animations (opacity + transform; reduced-motion handled in CSS)     */
/* ------------------------------------------------------------------ */

const afterTransition = (el, callback) => {
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    el.removeEventListener('transitionend', finish);
    callback();
  };
  el.addEventListener('transitionend', finish);
  setTimeout(finish, MODAL_DURATION + 80);
};

/* ------------------------------------------------------------------ */
/* Global listeners — bound exactly once                               */
/* ------------------------------------------------------------------ */

const onDocumentKeydown = (event) => {
  const record = currentOpen();
  if (!record) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    closeModal(record.id);
    return;
  }
  if (event.key === 'Tab') {
    event.preventDefault();
    trapFocus(record, event);
  }
};

const onPopstate = () => {
  for (const record of modals.values()) {
    if (record.open && record.token !== history.state) {
      closeModal(record.id);
      return;
    }
  }
};

const ensureBound = () => {
  if (bound) return;
  bound = true;
  document.addEventListener('keydown', onDocumentKeydown, true);
  window.addEventListener('popstate', onPopstate);
};

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

const currentOpen = () => {
  for (const record of modals.values()) {
    if (record.open) return record;
  }
  return null;
};

const createModal = (id, options = {}) => {
  ensureBound();
  const existing = modals.get(id);
  if (existing) return existing;
  const record = makeOverlay(id);
  record.options = { ...options };
  document.body.appendChild(record.overlay);
  modals.set(id, record);
  return record;
};

const openModal = (id, options = {}) => {
  const record = createModal(id, options);
  record.options = { ...record.options, ...options };

  /* only one open modal at a time — never stack overlays */
  for (const other of modals.values()) {
    if (other !== record && other.open) closeModal(other.id);
  }

  record.title.textContent = options.title || '';
  record.dialog.classList.toggle('modal--wide', Boolean(options.wide));
  appendContent(record.body, options.content);
  buildFooter(record, options.actions);

  if (record.open) {
    focusModal(record);
    return record;
  }

  record.open = true;
  record.prevFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  record.token = {};
  history.pushState(record.token, '');

  lockBody();
  setBackgroundInert();
  requestAnimationFrame(() => {
    record.overlay.classList.add('open');
    focusModal(record);
  });

  if (typeof options.onOpen === 'function') options.onOpen(record);

  return record;
};

const closeModal = (id, options = {}) => {
  const record = modals.get(id);
  if (!record || !record.open) return;
  record.open = false;

  const { prevFocus, token } = record;
  record.prevFocus = null;

  record.overlay.classList.remove('open');
  record.overlay.classList.add('closing');
  afterTransition(record.overlay, () => {
    record.overlay.classList.remove('closing');
    /* destroy content so no stale/duplicate instances linger */
    record.body.replaceChildren();
    record.foot.replaceChildren();
    record.foot.hidden = true;
  });

  unlockBody();
  restoreBackground();

  if (prevFocus && document.body.contains(prevFocus)) prevFocus.focus();
  else if (lastFocus && document.body.contains(lastFocus)) lastFocus.focus();

  /* clean the history entry pushed on open (guarded, async popstate no-ops) */
  if (token && history.state === token) history.back();

  if (typeof options.onClose === 'function') options.onClose(record);
};

const isModalOpen = (id) => {
  if (id == null) return Boolean(currentOpen());
  const record = modals.get(id);
  return Boolean(record && record.open);
};

const toggleModal = (id, options = {}) => {
  if (isModalOpen(id)) closeModal(id);
  else openModal(id, options);
  return isModalOpen(id);
};

const updateContent = (id, content) => {
  const record = modals.get(id) || createModal(id);
  appendContent(record.body, content);
};

const destroyModal = (id) => {
  const record = modals.get(id);
  if (!record) return;
  if (record.open) closeModal(id);
  record.overlay.remove();
  modals.delete(id);
};

const cleanup = () => {
  for (const record of Array.from(modals.values())) {
    destroyModal(record.id);
  }
  if (bound) {
    bound = false;
    document.removeEventListener('keydown', onDocumentKeydown, true);
    window.removeEventListener('popstate', onPopstate);
  }
  unlockBody();
  restoreBackground();
};

export const modal = {
  createModal,
  openModal,
  closeModal,
  destroyModal,
  isModalOpen,
  toggleModal,
  updateContent,
  cleanup,
};
