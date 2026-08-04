# Roadmap

The **UPI QR Code Generator** is an open-source, privacy-first tool for
creating UPI payment QR codes. This roadmap outlines where the project is
headed. It is a living document — priorities may shift based on feedback.

Legend: 🟢 done · 🟡 in progress · ⬜ planned · 💡 idea

---

## 🟢 Foundation

- [x] Core UPI (`upi://pay`) QR generation
- [x] Account + IFSC, VPA, and mobile + bank code inputs
- [x] PNG / SVG export and clipboard copy
- [x] Amount, note, and reference fields
- [x] Size presets and print support
- [x] Dark / light / system themes
- [x] PWA manifest and service worker
- [x] Zero-dependency, fully client-side architecture
- [x] Repository governance (templates, workflows, license)

## 🟡 In progress

- [ ] Public live deployment on Cloudflare Pages
- [ ] Real screenshots for the README
- [ ] E2E smoke tests in CI

## ⬜ Planned — v1.x

- [ ] **Bank presets**: a searchable list of common Indian banks to
      auto-fill IFSC prefixes and VPA suffixes.
- [ ] **Logo overlay**: embed a small centered logo inside the QR code
      (with error-correction level selector).
- [ ] **Bulk generation**: generate multiple QRs from a CSV/table of
      accounts in one go.
- [ ] **History**: recent QR configurations persisted locally.
- [ ] **More export formats**: JPEG, WebP, and PDF.
- [ ] **Custom colors**: choose QR foreground/background colors.
- [ ] **i18n**: English + Hindi initial translations, with a framework for
      more languages.
- [ ] **URL share**: encode a compact QR configuration in the URL hash so
      links can be shared.

## ⬜ Planned — v2.x

- [ ] Progressive Web App "Add to Home Screen" polish and richer offline
      experience.
- [ ] QR scan-verify flow (decode a generated QR to confirm it scans).
- [ ] Advanced payload fields (business category, tip, expiry) per the
      UPI deep-linking spec.
- [ ] Optional encrypted storage (e.g., WebCrypto + IndexedDB) for saved
      configurations.

## 💡 Ideas (not yet scoped)

- [ ] Print multiple QR codes per sheet (label layouts).
- [ ] QR templates / sticker packs.
- [ ] Desktop app (Tauri) wrapper.
- [ ] Keyboard-driven workflow and CLI version.

---

## Milestones

| Milestone | Scope                                         | Target       |
| --------- | --------------------------------------------- | ------------ |
| v1.0.0    | Stable core feature set + live deployment     | Next release |
| v1.1.0    | Bank presets, logo overlay, custom colors     | TBD          |
| v1.2.0    | Bulk generation, history, PDF export          | TBD          |
| v2.0.0    | Scan-verify, advanced payload, i18n expansion | TBD          |

Have an idea that's not listed? Open a
[feature request](https://github.com/itisuniqueofficial-gh/bank-upi-qr-code-generator/issues/new?template=feature_request.md).
