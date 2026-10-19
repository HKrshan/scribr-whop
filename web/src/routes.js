import {studioMarkup} from './scene/mount.js';
import {authMarkup} from './pages/auth.js';
import {welcomeMarkup} from './pages/welcome.js';
import {accountMarkup} from './pages/account.js';
import { LANGUAGE_OPTIONS } from '../../shared/languages.js';

const routes = new Set(['sign-in', 'sign-up', 'welcome', 'account', 'privacy', 'help']);
export function routeFor(pathname) {
  if (pathname === '/') return 'home';
  const path = pathname.replace(/\/$/, '').slice(1);
  return pathname.startsWith('/') && routes.has(path) ? path : 'not-found';
}

const arrow = '<svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24"><path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"/></svg>';
const play = '<svg aria-hidden="true" viewBox="0 0 24 24" width="26" height="26"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m10 7 7 5-7 5Z" fill="currentColor"/></svg>';
const languages = LANGUAGE_OPTIONS.map(({ name }) => `<li>${name}</li>`).join('');

function home() {
  return `<section class="hero" aria-labelledby="hero-title">
    <div class="hero-copy"><h1 id="hero-title">Watch in<br>your words.</h1>
      <svg class="headline-mark" viewBox="0 0 260 24" aria-hidden="true"><path d="M6 18C76-2 161 0 252 8" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"/></svg>
      <p class="hero-description">Subtitles, translation, and<br class="wide-break"> answers while you watch.</p>
      <a class="button button-primary" href="/sign-up?returnTo=%2Fwelcome">Get started ${arrow}</a>
      <a class="demo-link" href="#how-it-works">${play} See how it works</a>
    </div>
    <div class="studio-scene" data-studio-scene aria-label="Illustrative Scribr caption demonstration">
      ${studioMarkup()}
    </div>
  </section>
  <section class="how-section" id="how-it-works" aria-labelledby="how-title">
    <div class="section-intro"><h2 id="how-title">Stay with the story.</h2><p>Make room for understanding without leaving the video.</p></div>
    <div class="feature-row"><h3>Subtitles that feel like yours.</h3><p>Use an available caption track or captured speech. Choose the subtitle text colour, opacity, size and position that work for your screen.</p></div>
    <div class="feature-row"><h3>A source language.<br>A language for you.</h3><p>Choose the language being spoken and the language you want to read. Scribr keeps source and translation choices separate.</p></div>
    <div class="feature-row"><h3>Ask about what<br>you’ve heard.</h3><p>Ask with AI uses the transcript captured so far. It cannot inspect unseen images or sections of the video you have not captured.</p></div>
  </section>
  <section class="language-section" aria-labelledby="languages-title"><h2 id="languages-title">Your next video.<br>Your familiar words.</h2><div><p>Scribr currently supports these ${LANGUAGE_OPTIONS.length} languages for source and translation choices.</p><ul class="language-list">${languages}</ul></div></section>
  ${plansMarkup()}
  <section class="closing-note"><h2>Ready when you are.</h2><p>Start with your Scribr account, then connect the extension to watch on YouTube.</p><a class="text-link" href="/help">Read the setup guide ${arrow}</a></section>`;
}

export function plansMarkup() {
  return '<section class="how-section" id="plans" aria-labelledby="plans-title"><h2 id="plans-title">Choose your viewing pace.</h2><p>Monthly billing interval: every 30 days, in USD, plus applicable taxes.</p><div class="feature-row"><h3>Starter · $7.99</h3><div><p>60 captured Whisper audio minutes per billing period. Ask with AI is not included.</p><button class="button button-secondary" data-checkout="starter">Choose Starter</button></div></div><div class="feature-row"><h3>Pro · $14.99</h3><div><p>No monthly audio minute cap. 100 successful Ask with AI answers per verified billing period.</p><button class="button button-secondary" data-checkout="pro">Choose Pro</button></div></div><div class="feature-row"><h3>Ultra · $24.99</h3><div><p>No monthly audio minute or answer cap. Shared provider capacity and service rate limits still apply.</p><button class="button button-secondary" data-checkout="ultra">Choose Ultra</button></div></div><p>All paid tiers include the supported languages, translation and subtitle styling. Captured silence counts. Ask uses only the transcript captured so far. Failed answers do not consume the Pro allowance. Free inference capacity can be exhausted; there is no paid provider fallback. Existing customer contracts remain unchanged.</p><p data-checkout-status role="status"></p><noscript><p>Enable JavaScript to request a configured Whop checkout link.</p></noscript></section>';
}

export async function verifiedCheckout(apiOrigin, tier, fetcher = fetch) {
  if (!apiOrigin) throw new Error('Checkout requires production configuration.');
  if (!['starter','pro','ultra'].includes(tier)) throw new Error('Choose a Scribr plan.');
  const response = await fetcher(apiOrigin + '/api/checkout/' + tier, {credentials:'omit'});
  if (!response.ok) throw new Error('Checkout is unavailable. Please try again later.');
  const {url:raw} = await response.json();
  const url = new URL(raw);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || !(url.hostname === 'whop.com' || url.hostname.endsWith('.whop.com')) || !/^\/checkout\/plan_[A-Za-z0-9]+\/?$/.test(url.pathname)) throw new Error('Checkout could not be verified.');
  return url.href;
}

export function privacy() {
  return `<article class="reading-page"><h1>Your words deserve care.</h1><p>This describes Scribr’s current data flow. Public production onboarding is still being prepared.</p><h2>Video audio and text</h2><p>When you start captions, Scribr uses available caption tracks or captures the video’s speech. Audio and transcript text needed for speech processing, sentence processing, translation or questions may be sent through the relay to hosted inference providers. Ask with AI uses the transcript captured so far, not unseen video images.</p><h2>Inference services</h2><p>Hosted inference providers process the input required for the feature you request. Provider availability and handling depend on the configured relay and provider terms. This website’s illustrative demo does not capture audio or send inference requests.</p><h2>Sign-in and account records</h2><p>Clerk manages authentication, email verification and passwords. When configured, the verified server stores minimal account and sign-in records in Supabase: Clerk user ID, email, username or display name, and sign-in timestamps. Passwords, raw session tokens, transcripts and audio do not belong in those account tables.</p><h2>Membership and local preferences</h2><p>Whop manages subscription purchases and plan verification. Scribr saves subtitle appearance and other extension preferences in browser extension storage. The website may store a non-sensitive appearance preference in this browser.</p><h2>Publication details</h2><p>The confirmed support contact, production origins, provider-specific disclosures and retention details must be finalized before public publication. No support address or Store listing is implied by this preview.</p><a href="/help">Read setup help</a></article>`;
}

export function help(config) {
  const store = config.storeUrl ? '<p><a class="text-link" data-store-link>Open Scribr in the Chrome Web Store</a></p>' : '<p class="publication-note">The public Store listing has not been confirmed. If you already have Scribr installed, open it from your browser’s extensions menu.</p>';
  return `<article class="reading-page"><h1>Find your way into Scribr.</h1><h2>Set up for a video</h2><p><a href="/sign-up">Create an account</a>, verify your email through Clerk, and connect the installed extension. Returning members can <a href="/sign-in">sign in</a> with the same account.</p>${store}<h2>Choose what you hear and read</h2><p>Open a YouTube video, choose its source language and your subtitle output language, and adjust subtitle size, colour, opacity and position. Start captions when you are ready.</p><h2>Understand an answer</h2><p>Ask with AI answers from the transcript captured so far. It cannot describe unseen images or a section that has not been captured.</p><h2>If connection takes a moment</h2><p>Reload this page and check that the extension is enabled. The sign-in and account connection must complete before protected features can work.</p><h2>Contact and publication</h2><p>A confirmed support contact is still required before public publication. This preview does not provide a support inbox or claim that a Store release is available.</p><p><a href="/welcome">View the setup steps</a> · <a href="/privacy">Read privacy information</a></p></article>`;
}

export function routeMarkup(route, config) {
  return route === 'home' ? home() : route === 'sign-in' || route === 'sign-up' ? authMarkup(route) : route === 'welcome' ? welcomeMarkup(config) : route === 'account' ? accountMarkup() : route === 'privacy' ? privacy() : route === 'help' ? help(config) : '<section class="reading-page"><h1>This page wandered off.</h1><p>We could not find that Scribr page.</p><a class="button button-primary" href="/">Back to Scribr</a></section>';
}

export function renderRoute(root, route, config) {
  root.innerHTML = routeMarkup(route, config);
  let disposed = false;
  for (const button of root.querySelectorAll?.('[data-checkout]') || []) button.onclick = async () => {
    const status = root.querySelector('[data-checkout-status]');
    if (!config.authEnabled) { status.textContent = 'Checkout requires production configuration. No payment has been started.'; return; }
    button.disabled = true; status.textContent = 'Checking the configured Whop checkout…';
    try { const url = await verifiedCheckout(config.apiOrigin, button.dataset.checkout); if (!disposed) window.location.assign(url); }
    catch { if (!disposed) status.textContent = 'Checkout is unavailable. Please try again later.'; }
    finally { if (!disposed) button.disabled = false; }
  }
  const storeLink = root.querySelector('[data-store-link]');
  if (storeLink && config.storeUrl) storeLink.href = config.storeUrl;
  document.title = route === 'home' ? 'Scribr — Watch in your words.' : `${({ 'sign-in': 'Sign in', 'sign-up': 'Get started', welcome: 'Welcome', account: 'Your account', privacy: 'Privacy', help: 'Help', 'not-found': 'Page not found' })[route]} — Scribr`;
  return () => { disposed = true; root.replaceChildren(); };
}
