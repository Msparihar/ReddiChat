import React, { useState, useEffect } from 'react';
import { Bot, Github, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth-store';
import { useTheme } from '../../contexts/ThemeContext';
import MagneticButton from '../ui/MagneticButton';
import { cn } from '../../lib/utils';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      isScrolled
        ? cn("backdrop-blur-md border-b shadow-2xl",
            isDark
              ? "bg-slate-950/90 border-slate-800/50"
              : "bg-white/90 border-gray-200/50"
          )
        : 'bg-transparent'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo with Glow Effect */}
          <div className="flex items-center space-x-3 group">
            <div className="relative p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <Bot size={24} className="text-white" />
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg opacity-0 group-hover:opacity-50 transition-opacity duration-300 blur-sm"></div>
            </div>
            <span className={cn(
              "text-xl font-bold group-hover:text-orange-300 transition-colors duration-300",
              isDark ? "text-white" : "text-gray-900"
            )}>
              ReddiChat
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {['Home', 'Features'].map((item) => (
              <button
                key={item}
                onClick={() => {
                  const element = document.getElementById(item.toLowerCase());
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={cn(
                  "relative hover:text-orange-400 transition-all duration-200 group py-2",
                  isDark ? "text-gray-300" : "text-gray-600"
                )}
              >
                {item}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-400 to-red-500 group-hover:w-full transition-all duration-300"></span>
              </button>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "p-2 hover:text-orange-400 transition-colors duration-200 rounded-lg",
                isDark
                  ? "text-gray-400 hover:bg-slate-800/50"
                  : "text-gray-600 hover:bg-gray-100/50"
              )}
            >
              <Github size={20} />
            </a>

            <MagneticButton
              onClick={() => {
                if (isAuthenticated) {
                  navigate('/chat');
                } else {
                  navigate('/login');
                }
              }}
              className="relative bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2 rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all duration-200 overflow-hidden group cursor-pointer"
              intensity={0.05}
            >
              <span className="relative z-10">
                {isAuthenticated ? 'Go to Chat' : 'Get Started'}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </MagneticButton>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={cn(
              "md:hidden p-2 transition-colors duration-200 rounded-lg",
              isDark
                ? "text-gray-400 hover:text-white hover:bg-slate-800/50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
            )}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className={cn(
            "md:hidden absolute top-16 left-0 right-0 backdrop-blur-md border-b animate-fade-in",
            isDark
              ? "bg-slate-950/95 border-slate-800/50"
              : "bg-white/95 border-gray-200/50"
          )}>
            <nav className="px-4 py-6 space-y-4">
              {['Home', 'Features'].map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    const element = document.getElementById(item.toLowerCase());
                    element?.scrollIntoView({ behavior: 'smooth' });
                    setIsMenuOpen(false);
                  }}
                  className={cn(
                    "block hover:text-orange-400 transition-colors duration-200 py-2 w-full text-left",
                    isDark ? "text-gray-300" : "text-gray-600"
                  )}
                >
                  {item}
                </button>
              ))}
              <div className={cn(
                "pt-4 border-t",
                isDark ? "border-slate-800" : "border-gray-200"
              )}>
                <button
                  onClick={() => {
                    if (isAuthenticated) {
                      navigate('/chat');
                    } else {
                      navigate('/login');
                    }
                    setIsMenuOpen(false);
                  }}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
                >
                  {isAuthenticated ? 'Go to Chat' : 'Get Started'}
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
