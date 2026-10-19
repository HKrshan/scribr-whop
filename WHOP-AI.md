# Whop AI import handoff

Import the standalone `HKrshan/scribr-whop` repository when it is available. Preserve the approved Scribr Caption Studio design, wordmark, original runtime sprite art, GSAP scene, typography and light/dark/system appearance. Do not replace the scene or redesign the page.

- Install: `npm ci`
- Test: `npm test`
- Build: `npm run build`
- Output directory: `dist`
- Optional local preview: `npm run preview` or `npm start` after building.
- Node.js: 24 or newer.

Publish the generated static output at the domain root. Preserve `/assets/` and folder `index.html` routes for `/`, `/sign-in`, `/sign-up`, `/welcome`, `/account`, `/privacy`, `/help`, and use `404.html` for missing routes. Avoid routing asset failures to HTML.

The default build needs no environment variables and must keep honest configuration-required sign-in, account and checkout states. Do not create fake accounts, credentials, placeholder checkout destinations or unverified Store links. The landing demo is illustrative; it does not capture audio or call AI.

To enable real services later, use only the public build settings documented in README: `PUBLIC_WEBSITE_ORIGIN`, `PUBLIC_API_ORIGIN`, `PUBLIC_CLERK_SYNC_HOST`, `PUBLIC_CLERK_PUBLISHABLE_KEY` together; optional `PUBLIC_STORE_URL`. Supply actual verified values in the build environment. Never put secret keys in source or PUBLIC settings. The public repo contains no backend; real Clerk, backend token verification/CORS, extension session sync and Store publication still need verified deployment work.

A GitHub push does not automatically import, publish, or configure a `.whop.site`. Whop AI import and publication are separate actions, and the resulting public page must be verified after publication. This handoff does not claim that hosting, production auth, payments or Chrome Web Store release are complete.
