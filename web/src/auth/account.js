export function createAccountLoader({apiOrigin,getToken,fetcher = fetch,onState}) {
  let generation = 0, controller, disposed = false;
  function invalidate() { generation++; controller?.abort(); }
  return {
    async refresh() {
      if (disposed) return;
      invalidate();
      const current = generation;
      controller = new AbortController();
      const signal = controller.signal;
      const publish = state => { if (!disposed && generation === current) onState(state); };
      publish({status:'loading'});
      try {
        const token = await getToken();
        if (disposed || generation !== current) return;
        if (!token) { publish({status:'signed-out'}); return; }
        const response = await fetcher(new URL('/api/auth/me',apiOrigin),{headers:{Authorization:`Bearer ${token}`},signal});
        if (!response.ok) {
          publish({status:'error',message:response.status === 401 ? 'Your sign-in ended. Sign in again.' : response.status === 403 ? 'Verify your primary email in Clerk, or check that your account has access to Scribr.' : 'Your account connection could not be completed. Please retry.'});
          return;
        }
        const account = await response.json();
        if (!account || !['userId','sessionId','email','displayName'].every(key=>typeof account[key] === 'string') || !account.userId || !account.sessionId || !account.email || !['member','admin'].includes(account.role) || !(account.username === null || typeof account.username === 'string')) throw new Error('Invalid account response');
        publish({status:'verified',account});
      } catch {
        publish({status:'error',message:'Your account connection could not be completed. Please retry.'});
      }
    },
    clear() { invalidate(); if (!disposed) onState({status:'signed-out'}); },
    dispose() { disposed = true; invalidate(); }
  };
}
