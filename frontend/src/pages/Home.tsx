import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { Features } from '../components/Features';
import { PricingTiers } from '../components/PricingTiers';
import { HowItWorks } from '../components/HowItWorks';
import { Footer } from '../components/Footer';

export const Home = () => {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <PricingTiers />
      <HowItWorks />
      <Footer />
    </>
  );
};