export function frameAt(elapsedSeconds, clip) {
  const step = Math.max(0, Math.floor(elapsedSeconds * clip.fps));
  return clip.frames[clip.loop ? step % clip.frames.length : Math.min(step, clip.frames.length - 1)];
}
