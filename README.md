# Scribr Caption Studio

Standalone frontend export for Whop AI import. The approved Caption Studio scene, sprites, GSAP motion, responsive layout, and light/dark/system appearance are preserved. This repository contains no backend or extension runtime.

## Build and preview

Use Node.js 24 or newer. Run `npm ci`, `npm test`, then `npm run build`. The static output is `dist/`. Run `npm run preview` (or `npm start`) to serve the completed build at the local address printed by the command. `PORT` optionally changes the preview port. The preview is local only; static hosting serves `dist/` directly.

The no-environment build is intentional: it shows the real landing scene and themes, with sign-in, accounts and checkout reporting configuration required. It does not connect to Clerk, an API, inference or checkout. There are no production origins or Store links baked into the default build.

## Public configuration

Only these build-time public inputs are read:

- `PUBLIC_WEBSITE_ORIGIN`: actual deployed website HTTPS origin.
- `PUBLIC_API_ORIGIN`: actual verified Scribr backend HTTPS origin.
- `PUBLIC_CLERK_SYNC_HOST`: configured Clerk session sync HTTPS origin.
- `PUBLIC_CLERK_PUBLISHABLE_KEY`: public Clerk publishable key.
- `PUBLIC_STORE_URL`: optional verified HTTPS Chrome Web Store listing URL.

The first four settings are all required together to enable authentication and checkout. A partial configuration fails the build. URLs retain strict validation: no credentials, paths, query strings or fragments in origins; HTTPS required in production. Only explicit `node scripts/build-web.js --development` permits local origins. Never enter secrets in any PUBLIC input. `.env.example` contains names and blank values only. The scripts do not load `.env` files automatically; supply public values through the build environment and rebuild.

Real authentication also requires a correctly configured Clerk instance and allowed deployment origins, email verification, session sync/extension settings, and a deployed backend that validates Clerk tokens and enforces CORS and access rules. `PUBLIC_CLERK_SYNC_HOST` records the required integration origin; it does not provision session sync. Frontend configuration alone does not create these services. Test the deployed sign-in, account and extension flow before enabling production use.

The inherited backend contracts are `GET /api/auth/me` (Bearer token) and `GET /api/checkout/{starter|pro|ultra}`. Checkout redirects only to verified HTTPS Whop `/checkout/plan_…` links returned by that backend. No backend or payment resources are included here.

## Routes and delivery

Static route folders are generated for `/`, `/sign-in`, `/sign-up`, `/welcome`, `/account`, `/privacy`, and `/help`, plus `404.html`. Serve each folder's `index.html` and preserve absolute `/assets/` paths at the domain root. See [WHOP-AI.md](WHOP-AI.md) for the import handoff.

Production authentication, backend deployment, confirmed support/privacy details and Chrome Web Store release remain pending. Pricing and feature descriptions retain the source page's product direction; this export does not establish paid access or availability. The sample scene is explicitly illustrative and makes no inference requests.

## Assets and rights

The nine runtime studio files and frontend design are supplied for Scribr by HK. Their presence in public source is not a general license grant; confirm ownership and reuse rights with the owner. No MIT license is asserted for this project. Bricolage font files retain their original [font license](assets/fonts/FONT-LICENSE.txt). Dependencies retain their own licenses; generated bundles preserve linked legal comments. Source-image masters, private review history, provider credentials, server code and vendor bundles are excluded from the source export.
