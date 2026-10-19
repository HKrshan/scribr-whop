import {safeReturnPath} from '../auth/return-path.js';

export function authMarkup(route) {
  const signup = route === 'sign-up';
  return `<section class="reading-page auth-page"><a class="back-link" href="/">Back to Scribr</a><h1>${signup ? 'Make room for your words.' : 'Welcome back.'}</h1><p>${signup ? 'Create your Scribr account to connect the extension.' : 'Sign in to use your existing Scribr account.'}</p><div class="auth-mount"><p role="status" data-auth-status>Connecting to sign-in…</p><div data-auth-root></div><button class="button button-secondary" data-auth-retry hidden type="button">Retry sign-in</button></div><p class="small-copy">${signup ? 'Already have an account? <a href="/sign-in">Sign in</a>.' : 'New to Scribr? <a href="/sign-up?returnTo=%2Fwelcome">Create an account</a>.'}</p><p class="small-copy">Clerk securely manages sign-in and email verification. <a href="/privacy">Read our privacy information</a>.</p></section>`;
}

export function mountAuth(root,{route,getAuth,search = window.location.search}) {
  const element = root.querySelector('[data-auth-root]');
  const status = root.querySelector('[data-auth-status]');
  const retry = root.querySelector('[data-auth-retry]');
  const signup = route === 'sign-up';
  const destination = safeReturnPath(new URLSearchParams(search).get('returnTo'));
  const appearance = {variables:{colorPrimary:'var(--accent)',colorPrimaryForeground:'var(--accent-text)',colorForeground:'var(--text)',colorMutedForeground:'var(--muted)',colorBackground:'var(--surface)',colorInput:'var(--surface-hi)',colorInputForeground:'var(--text)',colorRing:'var(--focus)',fontFamily:'inherit',borderRadius:'var(--radius-control)'},elements:{rootBox:{width:'100%'},cardBox:{width:'100%'},card:{boxShadow:'none',border:'1px solid var(--line)'},formButtonPrimary:{minHeight:'44px'},formFieldInput:{minHeight:'44px'}}};
  let disposed = false, auth, observer;
  async function load() {
    retry.hidden = true;
    status.textContent = 'Connecting to sign-in…';
    try {
      auth = await getAuth();
      if (disposed) return;
      status.textContent = 'Loading the secure sign-in form…';
      observer = new MutationObserver(()=>{
        if (element.querySelector('input,button,a')) status.textContent = '';
      });
      observer.observe(element,{childList:true,subtree:true});
      const props = {routing:'hash',forceRedirectUrl:destination,signInForceRedirectUrl:destination,signUpForceRedirectUrl:destination,signInUrl:`/sign-in?returnTo=${encodeURIComponent(destination)}`,signUpUrl:`/sign-up?returnTo=${encodeURIComponent(destination)}`,appearance};
      if (signup) auth.mountSignUp(element,props);
      else auth.mountSignIn(element,props);
    } catch {
      if (disposed) return;
      observer?.disconnect();
      status.textContent = 'Secure sign-in could not load. Check your connection and retry.';
      retry.hidden = false;
    }
  }
  // Reload also retries a failed module download cached by the browser.
  const reload = () => element.ownerDocument.defaultView.location.reload();
  retry.addEventListener('click',reload);
  void load();
  return ()=>{
    disposed = true;
    observer?.disconnect();
    retry.removeEventListener('click',reload);
    if (auth) { if (signup) auth.unmountSignUp(element); else auth.unmountSignIn(element); }
  };
}
