function origin(value, name, development) {
  if (typeof value !== 'string' || !value || value !== value.trim() || /[?#\\]/.test(value)) throw new Error(`${name} must be an origin without credentials, a path, query or hash.`);
  let url;
  try { url = new URL(value); } catch { throw new Error(`${name} must be a valid origin.`); }
  const local = url.hostname === 'localhost' || url.hostname.endsWith('.localhost') || url.hostname === '[::1]' || /^127\./.test(url.hostname) || url.hostname === '0.0.0.0';
  if (url.username || url.password || url.pathname !== '/' || url.search || url.hash || (!development && local) || (url.protocol !== 'https:' && !(development && local && url.protocol === 'http:'))) throw new Error(`${name} requires HTTPS; local origins require --development.`);
  return url.origin;
}

export function publicWebConfig(env, { development = false } = {}) {
  const names = ['PUBLIC_WEBSITE_ORIGIN', 'PUBLIC_API_ORIGIN', 'PUBLIC_CLERK_SYNC_HOST', 'PUBLIC_CLERK_PUBLISHABLE_KEY'];
  const configured = names.filter(name => env[name]);
  if (configured.length && configured.length !== names.length) throw new Error('Authentication requires all four PUBLIC website, API, Clerk sync host and publishable key settings.');
  const authEnabled = configured.length === names.length;
  const websiteOrigin = authEnabled ? origin(env.PUBLIC_WEBSITE_ORIGIN, 'PUBLIC_WEBSITE_ORIGIN', development) : null;
  const apiOrigin = authEnabled ? origin(env.PUBLIC_API_ORIGIN, 'PUBLIC_API_ORIGIN', development) : null;
  const syncHost = authEnabled ? origin(env.PUBLIC_CLERK_SYNC_HOST, 'PUBLIC_CLERK_SYNC_HOST', development) : null;
  const publishableKey = authEnabled ? env.PUBLIC_CLERK_PUBLISHABLE_KEY : null;
  if (authEnabled && (typeof publishableKey !== 'string' || !/^pk_(test|live)_[A-Za-z0-9_-]+$/.test(publishableKey))) throw new Error('PUBLIC_CLERK_PUBLISHABLE_KEY must be a public Clerk publishable key.');
  let storeUrl = null;
  if (env.PUBLIC_STORE_URL) {
    const raw = env.PUBLIC_STORE_URL;
    let url;
    try { url = new URL(raw); } catch { throw new Error('PUBLIC_STORE_URL must be a Chrome Web Store listing URL.'); }
    const validPath = url.hostname === 'chromewebstore.google.com' ? /^\/detail\/[^/]+\/[^/]+\/?$/.test(url.pathname) : url.hostname === 'chrome.google.com' && /^\/webstore\/detail\/[^/]+\/[^/]+\/?$/.test(url.pathname);
    if (raw !== raw.trim() || /[?#\\]/.test(raw) || url.protocol !== 'https:' || url.username || url.password || url.port || !validPath) throw new Error('PUBLIC_STORE_URL must be a safe HTTPS Chrome Web Store listing URL.');
    storeUrl = url.href;
  }
  return { authEnabled, websiteOrigin, apiOrigin, publishableKey, syncHost, storeUrl };
}
