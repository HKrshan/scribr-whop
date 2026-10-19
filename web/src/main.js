import { initializeSiteTheme } from './theme.js';
import { routeFor, renderRoute } from './routes.js';
import { loadPublicConfig } from './public-config.js';
import { mountStudio } from './scene/mount.js';
import { createWebAuth } from './auth/client.js';
import { mountAuth } from './pages/auth.js';
import { mountAccount } from './pages/account.js';

const theme = initializeSiteTheme();
const root = document.querySelector('#app');
let cleanup = () => {};
try {
  const config = await loadPublicConfig();
  const route = routeFor(window.location.pathname);
  const routeCleanup = renderRoute(root, route, config);
  let authPromise;
  const getAuth = () => authPromise ??= createWebAuth({publishableKey:config.publishableKey}).catch(error=>{ authPromise = null; throw error; });
  if (!config.authEnabled) {
    for (const target of root.querySelectorAll('[data-auth-status], [data-account-root]')) target.textContent = 'Sign-in and account connection require production configuration. No account is connected.';
  }
  const accountCleanup = !config.authEnabled ? () => {} : ['sign-in','sign-up'].includes(route) ? mountAuth(root,{route,getAuth}) : ['account','welcome'].includes(route) ? mountAccount(root,{getAuth,apiOrigin:config.apiOrigin}) : () => {};
  const studioRoot = root.querySelector('[data-studio-scene]');
  const sceneCleanup = studioRoot ? mountStudio(studioRoot) : () => {};
  cleanup = () => { sceneCleanup(); accountCleanup(); routeCleanup(); };
} catch {
  root.innerHTML = '<section class="reading-page"><h1>Scribr is taking a moment.</h1><p>Website configuration could not be loaded. Reload the page to try again.</p><a class="button" href="/">Reload Scribr</a></section>';
}
window.addEventListener('pagehide', event => {
  if (!event.persisted) { cleanup(); theme?.dispose(); }
});
