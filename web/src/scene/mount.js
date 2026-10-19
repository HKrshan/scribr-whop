import {gsap} from 'gsap';
import atlas from '../../assets/studio/reader.json' with {type:'json'};
import {createScene} from './controller.js';
import {demo} from './demo.js';

export function studioMarkup() {
  return `<p class="scene-note">A little studio for understanding. <span>Demo scene</span></p>
    <div class="studio-viewport"><div class="studio-world" data-studio-world aria-hidden="true">
      <div class="studio-background"></div><div class="studio-poster"></div>
      <span class="studio-sign studio-sign-video">Subtitles</span><span class="studio-sign studio-sign-translation">Translation</span><span class="studio-sign studio-sign-question">Ask with AI</span>
      <span class="studio-station" data-station="video"></span><span class="studio-station" data-station="aisle"></span><span class="studio-station" data-station="translation"></span><span class="studio-station" data-station="question"></span>
      <div class="studio-actor" data-actor-world><div class="studio-pose" data-actor-pose></div></div>
      <div class="studio-maker"><div class="studio-pose" data-maker-pose></div></div>
      <img class="studio-furniture" src="/assets/studio/furniture.png" width="160" height="160" alt=""><div class="studio-foreground"></div>
    </div></div>
    <div class="studio-demo"><div class="studio-demo-heading"><span>Demo scene</span><div class="studio-controls"><button type="button" data-demo-play>Play demo</button><button type="button" data-demo-pause hidden aria-pressed="false">Pause scene</button></div></div>
      <p class="studio-output" data-demo-output lang="en">${demo.original}</p>
      <p class="studio-status" data-demo-status role="status">A prepared caption, translation and answer.</p>
      <details class="studio-transcript"><summary>Read the complete example</summary><dl><dt>English caption</dt><dd lang="en">${demo.original}</dd><dt>Spanish translation</dt><dd lang="es">${demo.translation}</dd><dt>${demo.question}</dt><dd>${demo.answer}</dd></dl></details>
    </div><p class="scene-caption">Illustrative sample. No audio capture or AI requests on this page.</p>`;
}

export function mountStudio(root) {
  const doc = root.ownerDocument, win = doc.defaultView;
  let disposed = false, scene, loaded = false;
  const availability = new Map();
  root.dataset.sceneTheme = doc.documentElement.dataset.theme || 'light';
  root.dataset.static = 'true';
  const pending = [];
  const load = path => new Promise((resolve,reject) => {
    const image = new win.Image(); pending.push(image);
    image.onload = () => { availability.set(path,true); resolve(); };
    image.onerror = () => { availability.set(path,false); reject(new Error('Studio artwork unavailable')); };
    image.src = `/assets/studio/${path}`;
  });
  const updateFallback = () => {
    if (!loaded || disposed) return;
    const theme = root.dataset.sceneTheme;
    const failed = ['reader.png','furniture.png',`background-${theme}.png`,theme === 'dark' ? 'foreground-dark.png' : 'foreground.png'].some(path => !availability.get(path));
    root.dataset.assetFailed = String(failed);
    root.dataset.posterFailed = String(!availability.get(`poster-${theme}.png`));
    root.dataset.static = String(failed || win.matchMedia('(prefers-reduced-motion: reduce)').matches);
    root.querySelector('[data-demo-play]').hidden = failed;
    if (failed) {
      scene?.cancel();
      root.querySelector('[data-demo-status]').textContent = 'Artwork could not load. Read the complete example below.';
    }
  };
  // Copy and controls render before these images load; artwork failure stays usable.
  const onEarlyPlay = () => { root.querySelector('[data-demo-status]').textContent = 'The studio is loading. The complete example is available below.'; };
  root.querySelector('[data-demo-play]').addEventListener('click',onEarlyPlay);
  const files = ['reader.png','furniture.png','background-light.png','background-dark.png','foreground.png','foreground-dark.png','poster-light.png','poster-dark.png'];
  Promise.allSettled(files.map(load)).then(() => {
    if (disposed) return;
    loaded = true;
    root.querySelector('[data-demo-play]').removeEventListener('click',onEarlyPlay);
    // A missing actor sheet needs no animation controller. The HTML example and
    // theme-matched poster still work, as does the independent signup link.
    if (availability.get('reader.png')) scene = createScene({root,gsap,atlas,demo,theme:root.dataset.sceneTheme,reducedMotion:win.matchMedia('(prefers-reduced-motion: reduce)').matches});
    root.querySelector('[data-demo-status]').textContent = 'A prepared caption, translation and answer.';
    updateFallback();
  }).catch(() => {
    if (disposed) return;
    root.dataset.assetFailed = 'true'; root.dataset.static = 'true';
    root.querySelector('[data-demo-status]').textContent = 'Artwork could not load. Read the complete example below.';
    root.querySelector('[data-demo-play]').hidden = true;
  });
  const syncTheme = event => { root.dataset.sceneTheme = event.detail.theme; updateFallback(); };
  win.addEventListener('scribr:themechange',syncTheme);
  return () => {
    disposed = true; scene?.dispose();
    root.querySelector('[data-demo-play]').removeEventListener('click',onEarlyPlay);
    win.removeEventListener('scribr:themechange',syncTheme);
    for (const image of pending) { image.onload = null; image.onerror = null; }
  };
}
