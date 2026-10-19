import {frameAt} from './frames.js';

// The demonstration owns only local sample text. It cannot authorize product work.
export function createScene({root, gsap, atlas, demo, theme = 'light', reducedMotion = false}) {
  const doc = root.ownerDocument, win = doc.defaultView;
  const stage = root.querySelector('[data-studio-world]');
  const actor = root.querySelector('[data-actor-world]');
  const pose = root.querySelector('[data-actor-pose]');
  const maker = root.querySelector('[data-maker-pose]');
  const status = root.querySelector('[data-demo-status]');
  const output = root.querySelector('[data-demo-output]');
  const playButton = root.querySelector('[data-demo-play]');
  const pauseButton = root.querySelector('[data-demo-pause]');
  const cell = atlas.cell;
  let generation = 0, timeline, disposed = false, elapsed = 0, clipStart = 0, clipName = 'idle';
  let running = false, userPaused = false, offscreen = false, motionReduced = reducedMotion;
  let lastFrame = -1, lastMaker = -1;
  const clock = {x:0,y:0};
  const blocked = () => userPaused || doc.hidden || offscreen || motionReduced;
  const announce = text => { status.textContent = text; };
  const setClip = name => { clipName = name; clipStart = elapsed; lastFrame = -1; };
  function paint(node, frame) {
    const x = (cell.margin || 0) + (frame % cell.columns) * (cell.width + (cell.gutter || 0));
    const y = (cell.margin || 0) + Math.floor(frame / cell.columns) * (cell.height + (cell.gutter || 0));
    node.style.backgroundPosition = `${-x}px ${-y}px`;
  }
  function syncPause() {
    // The paused timeline is advanced only by the active-time ticker below.
    // Hidden/offscreen wall time therefore cannot skip sample actions.
    pauseButton.textContent = userPaused ? 'Resume scene' : 'Pause scene';
    pauseButton.setAttribute('aria-pressed', String(userPaused));
  }
  function tick(_time, delta) {
    if (disposed || !running || blocked()) return;
    elapsed += Math.min(Math.max(0, delta || 0), 100) / 1000;
    timeline?.time(elapsed, false);
    const frame = frameAt(elapsed - clipStart, atlas.clips[clipName]);
    if (frame !== lastFrame) { paint(pose, frame); lastFrame = frame; }
    const makerFrame = atlas.clips.maker ? frameAt(elapsed, atlas.clips.maker) : atlas.clips.idle.frames[0];
    if (makerFrame !== lastMaker) { paint(maker, makerFrame); lastMaker = makerFrame; }
    gsap.set(actor, {x:clock.x, y:clock.y});
  }
  function station(name) {
    const world = stage.getBoundingClientRect();
    const point = root.querySelector(`[data-station="${name}"]`).getBoundingClientRect();
    return {x:point.left - world.left, y:point.top - world.top};
  }
  function buildRoute(startTime = 0) {
    generation++; timeline?.kill();
    const token = generation;
    const safe = fn => () => { if (!disposed && token === generation && running) fn(); };
    Object.assign(clock, station('video')); gsap.set(actor, {x:clock.x,y:clock.y});
    timeline = gsap.timeline({paused:true, onComplete:safe(() => {
      running = false; setClip('idle'); paint(pose, atlas.clips.idle.frames[0]);
      announce('Demo complete. Replay whenever you like.'); pauseButton.hidden = true;
    })});
    timeline.call(safe(() => {setClip('work'); output.textContent = demo.original; announce('Demo scene: reading the sample caption.');}))
      .to(clock, {duration:2})
      .call(safe(() => setClip('walk')))
      .to(clock, {...station('aisle'), duration:2.2, ease:'none'})
      .to(clock, {...station('translation'), duration:2.2, ease:'none'})
      .call(safe(() => {setClip('present'); output.textContent = demo.translation; output.lang = demo.targetLanguage; announce('Demo scene: the prepared Spanish translation.');}))
      .to(clock, {duration:2.4})
      .call(safe(() => setClip('walk')))
      .to(clock, {...station('question'), duration:2, ease:'none'})
      .call(safe(() => {setClip('reaction'); output.textContent = demo.answer; output.lang = 'en'; announce('Demo scene: the prepared answer.');}))
      .to(clock, {duration:2.4});
    // Reflow restores geometry without replaying earlier announcements/actions.
    if (startTime) timeline.time(startTime, true);
    gsap.set(actor, {x:clock.x,y:clock.y});
    syncPause();
  }
  function play() {
    if (disposed) return;
    generation++; timeline?.kill(); elapsed = 0; clipStart = 0; userPaused = false;
    output.lang = 'en'; output.textContent = demo.original;
    if (motionReduced || root.dataset.assetFailed === 'true') {
      running = false; root.dataset.static = 'true'; pauseButton.hidden = true;
      const translation = doc.createElement('span'), answer = doc.createElement('span');
      translation.lang = demo.targetLanguage; translation.textContent = demo.translation;
      answer.lang = 'en'; answer.textContent = demo.answer;
      output.replaceChildren(translation, doc.createTextNode(' '), answer);
      announce('Static demo: sample translation and answer.'); return;
    }
    root.dataset.static = 'false'; running = true; pauseButton.hidden = false;
    setClip('work'); paint(pose, atlas.clips.work.frames[0]); buildRoute();
  }
  function pause() { if (disposed) return; userPaused = true; syncPause(); }
  function resume() { if (disposed) return; userPaused = false; syncPause(); }
  function cancel() {
    generation++; running = false; timeline?.kill(); timeline = null;
    announce('Demo cancelled. Replay whenever you like.'); pauseButton.hidden = true;
    paint(pose, atlas.clips.idle.frames[0]);
  }
  function setTheme(value) { if (!disposed) root.dataset.sceneTheme = value === 'dark' ? 'dark' : 'light'; }
  function reconcile() {
    if (disposed) return;
    if (running) buildRoute(elapsed);
    else { Object.assign(clock, station('video')); gsap.set(actor, {x:clock.x,y:clock.y}); }
  }
  const onVisibility = () => syncPause();
  const onTheme = event => setTheme(event.detail.theme);
  const onPlay = () => play();
  const onPause = () => userPaused ? resume() : pause();
  doc.addEventListener('visibilitychange', onVisibility);
  win.addEventListener('scribr:themechange', onTheme);
  playButton.addEventListener?.('click', onPlay); pauseButton.addEventListener?.('click', onPause);
  const resize = win.ResizeObserver ? new win.ResizeObserver(reconcile) : null; resize?.observe(stage);
  const intersection = win.IntersectionObserver ? new win.IntersectionObserver(entries => {
    offscreen = !entries[0].isIntersecting; syncPause();
  }, {threshold:.05}) : null; intersection?.observe(stage);
  const media = gsap.matchMedia();
  media.add({reduce:'(prefers-reduced-motion: reduce)', mobile:'(max-width: 700px)', desktop:'(min-width: 701px)'}, context => {
    motionReduced = context.conditions.reduce;
    if (motionReduced) { cancel(); root.dataset.static = 'true'; announce('Static demo. Motion is reduced.'); }
    else { root.dataset.static = root.dataset.assetFailed === 'true' ? 'true' : 'false'; reconcile(); }
    return () => { timeline?.pause(); };
  });
  gsap.ticker.add(tick); setTheme(theme); paint(pose, atlas.clips.idle.frames[0]);
  if (atlas.clips.maker) paint(maker, atlas.clips.maker.frames[0]);
  reconcile();
  return {play,pause,resume,cancel,setTheme,dispose() {
    if (disposed) return;
    cancel(); disposed = true; gsap.ticker.remove(tick); media.revert();
    resize?.disconnect(); intersection?.disconnect();
    doc.removeEventListener('visibilitychange', onVisibility); win.removeEventListener('scribr:themechange', onTheme);
    playButton.removeEventListener?.('click', onPlay); pauseButton.removeEventListener?.('click', onPause);
  }};
}
