import {createAccountLoader} from '../auth/account.js';

export function accountMarkup() {
  return '<section class="reading-page"><h1>Your Scribr account.</h1><div data-account-root></div><p><a href="/welcome">Read the setup steps</a> or <a href="/help">get help</a>.</p></section>';
}

export function mountAccount(root,{getAuth,apiOrigin,fetcher}) {
  const target = root.querySelector('[data-account-root]');
  const document = target.ownerDocument;
  let disposed = false, unsubscribe, loader, auth, signingOut = false;
  function render(state) {
    target.replaceChildren();
    const message = document.createElement('p');
    message.setAttribute('role',state.status === 'error' ? 'alert' : 'status');
    message.textContent = state.status === 'verified' ? 'Your Scribr account is connected.' : state.status === 'loading' ? 'Checking your account connection…' : state.status === 'error' ? state.message : 'Sign in to connect your Scribr account.';
    target.append(message);
    if (state.status === 'verified') {
      const identity = document.createElement('p');
      identity.textContent = [state.account.displayName,state.account.email].filter(Boolean).join(' · ');
      target.append(identity);
      const note = document.createElement('p');
      note.textContent = 'Your account identity is verified. Subscription access is checked separately when you use protected features.';
      target.append(note);
    }
    if (state.status === 'signed-out' || state.status === 'error') {
      const link = document.createElement('a');
      link.href = '/sign-in?returnTo=%2Faccount';
      link.textContent = 'Sign in again';
      target.append(link);
    }
    if (state.status === 'error' && !signingOut) {
      if (loader) button('Retry connection',()=>loader.refresh());
      else button('Reload sign-in',()=>document.defaultView.location.reload());
    }
    if (auth && state.status !== 'signed-out') button('Sign out',async()=>{
      signingOut = true;
      loader.clear();
      try { await auth.signOut(); }
      catch { if (!disposed) render({status:'error',message:'Sign-out could not finish. Reload this page and try signing out again.'}); }
    });
  }
  function button(label,action) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'button button-secondary'; button.textContent = label;
    button.addEventListener('click',action);
    target.append(button);
  }
  async function connect() {
    render({status:'loading'});
    try {
      auth = await getAuth();
      if (disposed) return;
      loader = createAccountLoader({apiOrigin,getToken:auth.getToken,fetcher,onState:render});
      unsubscribe = auth.subscribe(({session})=>{
        if (signingOut || disposed) return;
        if (session) void loader.refresh();
        else loader.clear();
      });
    } catch { if (!disposed) render({status:'error',message:'Secure sign-in could not load. Check your connection and retry.'}); }
  }
  void connect();
  return ()=>{ disposed = true; unsubscribe?.(); loader?.dispose(); target.replaceChildren(); };
}
