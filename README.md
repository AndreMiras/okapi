# Okapi

[![Tests](https://github.com/AndreMiras/okapi/actions/workflows/tests.yml/badge.svg)](https://github.com/AndreMiras/okapi/actions/workflows/tests.yml)
[![codecov](https://codecov.io/gh/AndreMiras/okapi/graph/badge.svg)](https://codecov.io/gh/AndreMiras/okapi)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Okapi is an unofficial, open-source web client for families who use Kids&amp;Us MyKids. It is an independent community project and is not affiliated with, endorsed by, or maintained by Kids&amp;Us. The official MyKids service and app belong to Kids&amp;Us English S.L.

## Privacy and sign-in

Okapi has no separate account system, analytics, or tracking. Sign-in requests are proxied through the Okapi server to the official Kids&amp;Us API. Your password passes through Okapi only to complete that request; Okapi does not log or store it.

After a successful sign-in, Okapi keeps the Kids&amp;Us authentication token and account data in an encrypted, HttpOnly browser cookie for up to eight hours. You can inspect the source or host your own instance from this repository: [github.com/AndreMiras/okapi](https://github.com/AndreMiras/okapi).

## Getting started

Create `.env.local` from `.env.example`, set a strong `SESSION_SECRET`, then install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Checks

```bash
npm test
npm run test:coverage
npm run lint
npm run typecheck
npm run format:check
npm run build
npm run test:e2e
```

The end-to-end smoke test runs against a production build and requires Chromium.
Install it once for your local Playwright setup:

```bash
npx playwright install chromium
```
