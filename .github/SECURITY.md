# Security Policy

## Supported Versions

| Version | Branch | Supported |
| ------- | ------ | --------- |
| 1.x     | `main` | ✅ Yes    |
| < 1.0   | —      | ❌ No     |

## Reporting a vulnerability

The **UPI QR Code Generator** handles sensitive financial identifiers (bank
account numbers and IFSC codes). We take security seriously.

If you discover a security vulnerability, **please do not open a public
issue**. Instead, report it privately so it can be addressed before
disclosure.

To report:

- **GitHub private vulnerability reporting:** open
  [a security advisory](https://github.com/itisuniqueofficial-gh/bank-upi-qr-code-generator/security/advisories/new)
  on the repository (preferred).
- Or email the maintainers directly (see [FUNDING.yml](.github/FUNDING.yml)
  / project profile for contact).

Please include:

- The affected version/commit and URL.
- A description of the vulnerability and its impact.
- Steps to reproduce, or a minimal proof-of-concept.
- Any suggested mitigation.

## What to expect

We aim to respond within **5 business days** with an initial assessment.
You will be kept informed of the fix progress and credited in the advisory
release notes if you wish.

## Security considerations for this project

- **Client-side only:** bank details are processed entirely in the browser and
  are never transmitted to a server. Do not introduce server-side logging,
  analytics, or telemetry that captures form data.
- **QR payloads:** generated UPI URIs follow the
  [UPI Deep Linking](https://www.npci.org.in/what-we-do/upi/product-statistics)
  / `upi://pay` convention.
- **Dependencies:** the project is dependency-free at runtime. Review any new
  dependency (including dev-only tools) for supply-chain risk.
- **Dependabot & secret scanning:** keep automated security updates enabled
  and never commit tokens, keys, or credentials.

## Vulnerability disclosure

Reported issues are coordinated through private security advisories and
publicly disclosed after a fix is released, following responsible
disclosure practices.
