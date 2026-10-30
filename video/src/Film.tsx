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
import {Captions} from './components/Captions';
import {Speaker} from './components/Speaker';
import {AudioTrack} from './components/AudioTrack';
import {TL} from './lib';
import {F} from './theme';

export type FilmProps = {voice: boolean};

const S = TL.scenes;

// 90 s film. Scenes are plain Sequences; narration, captions and the presenter column sit on top.
export const Film: React.FC<FilmProps> = ({voice}) => (
  <AbsoluteFill style={{background: '#000', fontFamily: F.ui}}>
    <Sequence from={S.s1.from} durationInFrames={S.s1.dur}><Scene01 /></Sequence>
    <Sequence from={S.s2.from} durationInFrames={S.s2.dur}><Scene02 /></Sequence>
    <Sequence from={S.s3.from} durationInFrames={S.s3.dur}><Scene03 /></Sequence>
    <Sequence from={S.s4.from} durationInFrames={S.s4.dur}><Scene04 /></Sequence>
    <Sequence from={S.s5.from} durationInFrames={S.s5.dur}><Scene05 /></Sequence>
    <Sequence from={S.s6.from} durationInFrames={S.s6.dur}><Scene06 /></Sequence>
    <Sequence from={S.s7.from} durationInFrames={S.s7.dur}><Scene07 /></Sequence>
    <Sequence from={S.s8.from} durationInFrames={S.s8.dur}><Scene08 /></Sequence>
    <Sequence from={S.s9.from} durationInFrames={S.s9.dur}><Scene09 dur={S.s9.dur} /></Sequence>
    <Captions comp="main" hide={[[S.s9.from, S.s9.from + S.s9.dur]]} />
    {voice && <Speaker comp="main" showFrom={S.s2.from} total={TL.total} />}
    <AudioTrack comp="main" voice={voice} total={TL.total} />
  </AbsoluteFill>
);
