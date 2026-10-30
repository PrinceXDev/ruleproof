import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {Scene01} from './scenes/Scene01';
import {Scene02} from './scenes/Scene02';
import {Scene03} from './scenes/Scene03';
import {Scene04} from './scenes/Scene04';
import {Scene05} from './scenes/Scene05';
import {Scene06} from './scenes/Scene06';
import {Scene07} from './scenes/Scene07';
import {Scene08} from './scenes/Scene08';
import {Scene09} from './scenes/Scene09';
import {SceneN1} from './scenes/SceneN1';
import {SceneN2} from './scenes/SceneN2';
import {SceneN3} from './scenes/SceneN3';
import {SceneN4} from './scenes/SceneN4';
import {SceneN5} from './scenes/SceneN5';
import {SceneN6} from './scenes/SceneN6';
import {Captions} from './components/Captions';
import {Speaker} from './components/Speaker';
import {AudioTrack} from './components/AudioTrack';
import {TL} from './lib';
import {F} from './theme';
import {FilmProps} from './Film';

const S = TL.long.scenes;
const at = (k: keyof typeof S, el: React.ReactNode) => (
  <Sequence key={k} from={S[k].from} durationInFrames={S[k].dur}>
    {el}
  </Sequence>
);

// 3 minute cut: the 90 s story plus coverage gap, corrected fix, revision diff, durable runs, architecture and limits.
export const LongFilm: React.FC<FilmProps> = ({voice}) => (
  <AbsoluteFill style={{background: '#000', fontFamily: F.ui}}>
    {at('s1', <Scene01 />)}
    {at('s2', <Scene02 />)}
    {at('s3', <Scene03 />)}
    {at('s4', <Scene04 />)}
    {at('s5', <Scene05 />)}
    {at('n1', <SceneN1 />)}
    {at('s6', <Scene06 />)}
    {at('n2', <SceneN2 />)}
    {at('n3', <SceneN3 />)}
    {at('s7', <Scene07 />)}
    {at('n4', <SceneN4 />)}
    {at('n5', <SceneN5 />)}
    {at('n6', <SceneN6 />)}
    {at('s8', <Scene08 />)}
    {at('s9', <Scene09 dur={S.s9.dur} />)}
    <Captions comp="long" hide={[[S.s9.from, S.s9.from + S.s9.dur]]} />
    {voice && <Speaker comp="long" showFrom={S.s2.from} total={TL.long.total} />}
    <AudioTrack comp="long" voice={voice} total={TL.long.total} />
  </AbsoluteFill>
);
