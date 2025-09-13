import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import Header from './Header';
import HeroSection from './HeroSection';
import FeatureSection from './FeatureSection';
import Footer from './Footer';
import { cn } from '../../lib/utils';

const LandingPage = () => {
  const { colors, isDark } = useTheme();

  return (
    <div className={cn(
      "min-h-screen",
      isDark
        ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
        : "bg-gradient-to-br from-gray-50 via-white to-gray-100",
      colors.textPrimary
    )}>
      <Header />
      <main>
        <section id="home">
          <HeroSection />
        </section>
        <section id="features">
          <FeatureSection />
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
