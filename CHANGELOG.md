# Changelog

All notable changes to the **UPI QR Code Generator** are documented in this
file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Project scaffolding, open-source metadata, and repository governance
  files (issue/PR templates, lint & deploy workflows, CONTRIBUTING,
  SECURITY, CODE OF CONDUCT, LICENSE).
- Web infrastructure: custom 404 page, `robots.txt`, `sitemap.xml`,
  PWA manifest, browserconfig, and placeholder screenshots.

## [1.0.0] - TBD

> First stable release. _Release notes to be finalized at tag time._

### Added

- Generate UPI (`upi://pay`) QR codes from bank account + IFSC, VPA, or
  mobile + bank code.
- Live QR preview with configurable amount, note, and reference.
- Export QR as PNG and SVG; copy QR text to clipboard.
- Size presets and print-friendly output.
- Dark / light / system themes.
- PWA support (service worker + manifest).
- Fully client-side, offline-capable, zero-dependency build.
