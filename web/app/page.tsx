import Nav from '@/components/landing/Nav';
import Footer from '@/components/landing/Footer';
import LandingMotion from '@/components/landing/LandingMotion';
import SmoothScroll from '@/components/landing/SmoothScroll';
import HeroSection from '@/components/landing/sections/HeroSection';
import PipelineMarquee from '@/components/landing/sections/PipelineMarquee';
import ProblemSection from '@/components/landing/sections/ProblemSection';
import WorkflowSection from '@/components/landing/sections/WorkflowSection';
import DemoSection from '@/components/landing/sections/DemoSection';
import MatrixSection from '@/components/landing/sections/MatrixSection';
import FeaturesSection from '@/components/landing/sections/FeaturesSection';
import ArchitectureSection from '@/components/landing/sections/ArchitectureSection';
import ApiSection from '@/components/landing/sections/ApiSection';
import VoiceSection from '@/components/landing/sections/VoiceSection';
import ScopeSection from '@/components/landing/sections/ScopeSection';
import QuickstartFaqSection from '@/components/landing/sections/QuickstartFaqSection';
import FinalCtaSection from '@/components/landing/sections/FinalCtaSection';

const Home = () => (
  <div className="relative overflow-x-clip bg-canvas text-ink">
    <SmoothScroll />
    <LandingMotion />
    <a
      href="#main"
      className="sr-only z-[60] rounded-md bg-brand px-4 py-2 text-brand-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
    >
      Skip to content
    </a>
    <Nav />

    <main id="main">
      <HeroSection />
      <PipelineMarquee />
      <ProblemSection />
      <WorkflowSection />
      <DemoSection />
      <MatrixSection />
      <FeaturesSection />
      <ArchitectureSection />
      <ApiSection />
      <VoiceSection />
      <ScopeSection />
      <QuickstartFaqSection />
      <FinalCtaSection />
    </main>

    <Footer />
  </div>
);

export default Home;
