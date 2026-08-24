# Security Policy

## Supported Versions

Only the latest released version of Intentional YT is actively supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 2.x     | :white_check_mark: |
| < 2.0   | :x:                |

---

## Reporting a Vulnerability

Intentional YT is designed with privacy and security as core tenets:
- It makes **no remote network calls**.
- It requires no sensitive permissions beyond `storage`, `alarms`, and YouTube content script injection.
- It stores all settings and metrics locally in `browser.storage.local`.

If you discover a security vulnerability or security-sensitive issue:

1. **Do not create a public issue.**
2. Please privately email the maintainer at **manasinghofficial@gmail.com** or open a [Private Security Advisory](https://github.com/manasdotio/intentional-yt/security/advisories/new) on GitHub.
3. Include detailed steps to reproduce the issue, proof-of-concept code, and the affected browser environment.

We will acknowledge receipt of your vulnerability report within 48 hours and work on a fix promptly.
