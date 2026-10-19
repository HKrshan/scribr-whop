export async function createWebAuth({publishableKey,ClerkConstructor}) {
  let options = {};
  if (!ClerkConstructor) {
    const [{Clerk},{ui}] = await Promise.all([import('@clerk/clerk-js'),import('@clerk/ui')]);
    ClerkConstructor = Clerk;
    options = {ui:{ClerkUI:ui.ClerkUI}};
  }
  const clerk = new ClerkConstructor(publishableKey);
  await clerk.load(options);
  return {
    getToken:async()=>await clerk.session?.getToken() ?? null,
    subscribe:fn=>clerk.addListener(fn),
    mountSignIn:(element,props)=>clerk.mountSignIn(element,props),
    mountSignUp:(element,props)=>clerk.mountSignUp(element,props),
    unmountSignIn:element=>clerk.unmountSignIn(element),
    unmountSignUp:element=>clerk.unmountSignUp(element),
    signOut:()=>clerk.signOut({redirectUrl:'/account'})
  };
}
