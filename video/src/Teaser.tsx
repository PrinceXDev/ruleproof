import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {Scene01} from './scenes/Scene01';
import {Scene06} from './scenes/Scene06';
import {Scene09} from './scenes/Scene09';
import {Captions} from './components/Captions';
import {Speaker} from './components/Speaker';
import {AudioTrack} from './components/AudioTrack';
import {TL} from './lib';
import {F} from './theme';
import {FilmProps} from './Film';

const T = TL.teaser.scenes;

// 30 s teaser: the opening hook, the 12-passed / 9-leaked reveal, and the closing statement.
export const Teaser: React.FC<FilmProps> = ({voice}) => (
  <AbsoluteFill style={{background: '#000', fontFamily: F.ui}}>
    <Sequence from={T.s1.from} durationInFrames={T.s1.dur}><Scene01 /></Sequence>
    <Sequence from={T.s6.from} durationInFrames={T.s6.dur}><Scene06 /></Sequence>
    <Sequence from={T.s9.from} durationInFrames={T.s9.dur}><Scene09 dur={T.s9.dur} /></Sequence>
    <Captions comp="teaser" hide={[[T.s9.from, T.s9.from + T.s9.dur]]} />
    {voice && <Speaker comp="teaser" showFrom={T.s6.from} total={TL.teaser.total} />}
    <AudioTrack comp="teaser" voice={voice} total={TL.teaser.total} />
  </AbsoluteFill>
);
