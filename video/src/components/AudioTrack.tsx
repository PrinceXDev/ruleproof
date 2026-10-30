import React from 'react';
import {Audio, Sequence, interpolate, staticFile} from 'remotion';
import {Comp, clipsFor, duckAt} from '../voice';

// Score + SFX + (optional) narration. Music ducks under the voice; everything fades out at the end.
export const AudioTrack: React.FC<{comp: Comp; voice: boolean; total: number}> = ({comp, voice, total}) => {
  const clips = clipsFor(comp);
  const pre = comp === 'main' ? '' : comp === 'long' ? 'long-' : 'teaser-';
  const master = (f: number) => interpolate(f, [total - 36, total - 2], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <>
      <Audio src={staticFile(`audio/${pre}music.wav`)} volume={(f) => 0.5 * (1 - (voice ? 0.55 : 0) * duckAt(clips, f)) * master(f)} />
      <Audio src={staticFile(`audio/${pre}sfx.wav`)} volume={(f) => 0.8 * master(f)} />
      {voice &&
        clips.map((c) => (
          <Sequence key={c.id} from={c.at} durationInFrames={c.durationFrames + 4} layout="none">
            <Audio src={staticFile(c.file)} volume={1} />
          </Sequence>
        ))}
    </>
  );
};
