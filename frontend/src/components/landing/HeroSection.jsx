import React, { useEffect, useRef } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth-store';
import { useTheme } from '../../contexts/ThemeContext';
import AnimatedBackground from '../ui/AnimatedBackground';
import MagneticButton from '../ui/MagneticButton';
import TypewriterText from '../ui/TypewriterText';
import { cn } from '../../lib/utils';

const HeroSection = () => {
  const heroRef = useRef(null);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;

      const x = (clientX / innerWidth) * 100;
      const y = (clientY / innerHeight) * 100;

      const bgGradient = isDark
        ? `radial-gradient(circle at ${x}% ${y}%, rgba(255, 69, 0, 0.1) 0%, transparent 50%), linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)`
        : `radial-gradient(circle at ${x}% ${y}%, rgba(255, 69, 0, 0.05) 0%, transparent 50%), linear-gradient(135deg, #f9fafb 0%, #ffffff 50%, #f3f4f6 100%)`;
      hero.style.background = bgGradient;
    };

    hero.addEventListener('mousemove', handleMouseMove);
    return () => hero.removeEventListener('mousemove', handleMouseMove);
  }, [isDark]);

  return (
    <section
      ref={heroRef}
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
          : 'linear-gradient(135deg, #f9fafb 0%, #ffffff 50%, #f3f4f6 100%)'
      }}
    >
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Floating Orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-400/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-red-500/8 rounded-full blur-2xl animate-bounce delay-500"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Trust Badge with Animation */}
        <div className={cn(
          "inline-flex items-center space-x-2 backdrop-blur-md border border-orange-500/20 rounded-full px-6 py-3 mb-8 hover:border-orange-500/40 transition-all duration-300 hover:scale-105",
          isDark ? "bg-slate-800/30" : "bg-white/50"
        )}>
          <Sparkles size={16} className="text-orange-400 animate-pulse" />
          <span className={cn("text-sm", isDark ? "text-gray-300" : "text-gray-600")}>
            A simple tool for Reddit users
          </span>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        </div>

        {/* Main Headline with Typewriter Effect */}
        <h1 className={cn(
          "text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-tight",
          isDark ? "text-white" : "text-gray-900"
        )}>
          <TypewriterText
            text="Ask Reddit "
            speed={80}
            className="block"
          />
          <span className="bg-gradient-to-r from-orange-400 via-red-500 to-orange-600 bg-clip-text text-transparent animate-gradient-x">
            <TypewriterText
              text="Anything"
              speed={80}
              delay={1200}
            />
          </span>
          <br />
          <TypewriterText
            text="Get Smart Answers."
            speed={100}
            delay={2400}
          />
        </h1>

        {/* Subheading with Fade In */}
        <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '3.5s', animationFillMode: 'forwards' }}>
          <p className={cn(
            "text-lg sm:text-xl mb-10 max-w-3xl mx-auto leading-relaxed",
            isDark ? "text-gray-300" : "text-gray-600"
          )}>
            Powered by AI. Get instant, intelligent answers from Reddit's community.
            Perfect for when you need context or want to understand discussions better.
          </p>
        </div>

        {/* CTA Buttons with Magnetic Effect */}
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '4s', animationFillMode: 'forwards' }}>
          <MagneticButton
            onClick={() => {
              if (isAuthenticated) {
                navigate('/chat');
              } else {
                navigate('/login');
              }
            }}
            className="group relative bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 flex items-center space-x-2 shadow-2xl shadow-orange-500/25 overflow-hidden cursor-pointer"
            intensity={0.05}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative z-10">
              {isAuthenticated ? 'Go to Chat' : 'Start Chatting'}
            </span>
            <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform duration-200" />
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
          </MagneticButton>

          <MagneticButton
            onClick={() => {
              const featuresElement = document.getElementById('features');
              featuresElement?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="relative px-8 py-4 rounded-xl font-semibold text-lg text-white border-2 border-slate-600 hover:border-orange-400 transition-all duration-300 backdrop-blur-sm group overflow-hidden cursor-pointer"
            intensity={0.03}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative z-10">Learn More</span>
          </MagneticButton>
        </div>

        {/* Enhanced Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 animate-fade-in" style={{ animationDelay: '5s', animationFillMode: 'forwards' }}>
          <div className="relative">
            <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center animate-bounce">
              <div className="w-1 h-3 bg-orange-400 rounded-full mt-2 animate-pulse"></div>
            </div>
            <div className="absolute inset-0 w-6 h-10 border-2 border-orange-400/30 rounded-full animate-ping"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
