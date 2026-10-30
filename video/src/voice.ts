import {TL, VO, VoClip} from './lib';

export type Comp = 'main' | 'teaser' | 'long';

// Narration clips placed on a composition timeline. The teaser re-uses the clips of its scenes.
export const clipsFor = (comp: Comp): (VoClip & {at: number})[] => {
  const sc = (comp === 'main' ? TL.scenes : comp === 'long' ? TL.long.scenes : TL.teaser.scenes) as Record<string, {from: number; dur: number}>;
  return VO.filter((c) => sc[c.scene]).map((c) => ({...c, at: sc[c.scene].from + c.offset}));
};

// 0..1 loudness of the narration at a frame (smoothed over 3 frames)
export const ampAt = (clips: (VoClip & {at: number})[], f: number) => {
  let m = 0;
  for (const c of clips) {
    for (let d = -1; d <= 1; d++) {
      const v = c.env[f + d - c.at];
      if (v !== undefined) m = Math.max(m, v * (d === 0 ? 1 : 0.7));
    }
  }
  return Math.min(1, m);
};

// 0..1 how strongly the music should duck at a frame
export const duckAt = (clips: (VoClip & {at: number})[], f: number) => {
  let m = 0;
  for (const c of clips) {
    const a = f - (c.at - 6);
    const b = c.at + c.durationFrames + 10 - f;
    m = Math.max(m, Math.max(0, Math.min(1, a / 8, b / 14)));
  }
  return m;
};
