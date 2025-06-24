import HeroSection from '../components/HeroSection';
import HowItWorks from '../components/HowItWorks';
import TargetAudience from '../components/TargetAudience';
import Testimonials from '../components/Testimonials';
import FAQ from '../components/FAQ';
import Footer from '../components/Footer';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-theme-primary transition-colors duration-300 animate-slide-up-lg">
      <HeroSection />
      <HowItWorks />
      <TargetAudience />
      <Testimonials />
      <FAQ />
      <Footer />
    </div>
  );
};

export default LandingPage;