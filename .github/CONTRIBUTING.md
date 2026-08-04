# Contribution Guidelines

Welcome, and thank you for considering contributing to the **UPI QR Code Generator**! 🎉

Please take a moment to review the guidelines below. By participating in this
project, you agree to abide by the terms of the
[Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).

## Table of contents

- [How to contribute](#how-to-contribute)
- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [Development workflow](#development-workflow)
- [Commit conventions](#commit-conventions)
- [Style guide](#style-guide)
- [Testing](#testing)
- [Pull request checklist](#pull-request-checklist)
- [Reporting issues](#reporting-issues)
- [License](#license)

## How to contribute

There are many ways to help:

- Report bugs or unexpected behavior via the [issue tracker](../../issues).
- Propose new features or improvements.
- Improve documentation, comments, or accessibility.
- Review and test open pull requests.
- Write code for open issues.

## Getting started

1. Fork the repository.
2. Clone your fork:

   ```sh
   git clone https://github.com/<your-username>/bank-upi-qr-code-generator.git
   cd bank-upi-qr-code-generator
   ```

3. Create a feature branch:

   ```sh
   git checkout -b feat/your-feature-name
   ```

4. Serve the project locally:

   ```sh
   python3 -m http.server 8080
   # or
   npx serve .
   ```

   Open <http://localhost:8080> in your browser.

## Project structure

```
├── index.html        # single-page application markup
├── js/               # ES modules (app, qr, validator, generator, …)
├── css/              # stylesheets (variables, layout, forms, qr, …)
├── icons/            # favicon + PWA icons
├── assets/           # shared static assets
├── screenshots/      # README screenshots
├── docs/             # project documentation
├── .github/          # issue/PR templates, workflows, governance files
└── sw.js             # service worker
```

## Development workflow

The project is a dependency-free, client-side web app. There is no build
step — edit the source files and refresh the browser.

1. Make your changes in `js/`, `css/`, or `index.html`.
2. Validate your work:

   ```sh
   npm run lint     # prettier + node --check + html-validate (see below)
   ```

   If you do not use npm, run the equivalent commands documented in
   [.github/workflows/lint.yml](.github/workflows/lint.yml).

3. Test on a desktop and a mobile viewport, and in light/dark/system themes.
4. Commit using the [conventional commits](#commit-conventions) style.
5. Push your branch and open a pull request.

## Commit conventions

Use [Conventional Commits](https://www.conventionalcommits.org/) messages:

```text
feat: add UPI QR export to PDF
fix: correct IFSC case-normalization on restore
docs: update deployment guide
refactor: extract size presets into config.js
chore: update dependabot config
```

- Keep the first line under 72 characters.
- Prefix with a type: `feat`, `fix`, `docs`, `refactor`, `perf`, `style`,
  `test`, `build`, `ci`, `chore`.
- Reference issues in the body when relevant, e.g. `Closes #12`.

## Style guide

- JavaScript: ES modules, 2-space indentation, no semicolons are avoided —
  the repo uses Prettier defaults. Run `npx prettier --write .` if unsure.
- CSS: custom properties in `css/variables.css`; follow the existing naming.
- HTML: semantic elements, accessible labels, keyboard- and focus-friendly
  markup.
- Accessibility: preserve `aria-*` attributes and visible focus states.

## Testing

There is no automated test suite yet; validation is currently:

```sh
# JavaScript syntax
for f in js/*.js; do node --check "$f"; done

# Formatting
npx --yes prettier --check "**/*.{html,css,js,json,md}"

# HTML validation
npx --yes html-validate index.html 404.html
```

Contributions that add a lightweight test harness are welcome. See the
[Roadmap](ROADMAP.md) for planned testing work.

## Pull request checklist

Before opening a pull request, make sure:

- [ ] Your branch is based on the latest `main`.
- [ ] The code follows the style guide.
- [ ] `npm run lint` passes (or the equivalent commands above).
- [ ] You have manually verified QR generation, download, copy, and print.
- [ ] You have updated the documentation if behavior changed.
- [ ] No secrets, personal data, or generated artifacts are committed.

## Reporting issues

Please use the [issue templates](../../issues/new/choose) for bugs, feature
requests, and questions. Include your browser/OS and, for bugs, the exact
input values that trigger the issue.

## License

By contributing, you agree that your contributions will be licensed under the
[MIT License](LICENSE).
