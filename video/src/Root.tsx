import React from 'react';
import {Composition} from 'remotion';
import {Film, FilmProps} from './Film';
import {Teaser} from './Teaser';
import {LongFilm} from './LongFilm';
import {TL} from './lib';
import {H, W} from './theme';
import './fonts';

const common = {fps: TL.fps, width: W, height: H};

export const Root: React.FC = () => (
  <>
    <Composition id="RuleProofHackathon" component={Film} durationInFrames={TL.total} defaultProps={{voice: true} as FilmProps} {...common} />
    <Composition id="RuleProofHackathonNoVoice" component={Film} durationInFrames={TL.total} defaultProps={{voice: false} as FilmProps} {...common} />
    <Composition id="RuleProofHackathon3Min" component={LongFilm} durationInFrames={TL.long.total} defaultProps={{voice: true} as FilmProps} {...common} />
    <Composition id="RuleProofHackathon3MinNoVoice" component={LongFilm} durationInFrames={TL.long.total} defaultProps={{voice: false} as FilmProps} {...common} />
    <Composition id="RuleProofTeaser" component={Teaser} durationInFrames={TL.teaser.total} defaultProps={{voice: true} as FilmProps} {...common} />
  </>
);
