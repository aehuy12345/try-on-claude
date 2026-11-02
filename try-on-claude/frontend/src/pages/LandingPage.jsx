import CtaSection from '../components/landing/CtaSection.jsx';
import FeaturesSection from '../components/landing/FeaturesSection.jsx';
import HeroSection from '../components/landing/HeroSection.jsx';
import HowItWorksSection from '../components/landing/HowItWorksSection.jsx';

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CtaSection />
    </>
  );
}
