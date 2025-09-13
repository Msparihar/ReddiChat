import React from 'react';
import { Bot, Github, Mail } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../lib/utils';

const Footer = () => {
  const { colors, isDark } = useTheme();

  return (
    <footer className={cn(
      "border-t",
      isDark
        ? "bg-slate-950 border-slate-800/50"
        : "bg-gray-50 border-gray-200/50"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between">
          {/* Brand Section */}
          <div className="flex items-center space-x-3 mb-6 md:mb-0">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
              <Bot size={24} className="text-white" />
            </div>
            <div>
              <span className={cn("text-xl font-bold", colors.textPrimary)}>ReddiChat</span>
              <p className={cn("text-sm", colors.textMuted)}>
                A simple tool to quickly search Reddit
              </p>
            </div>
          </div>

          {/* Links and Contact */}
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8">
            {/* Social Links */}
            <div className="flex space-x-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "p-2 rounded-lg transition-all duration-200",
                  isDark
                    ? "bg-slate-800/50 text-gray-400 hover:text-orange-400 hover:bg-slate-700/50"
                    : "bg-gray-100/50 text-gray-600 hover:text-orange-500 hover:bg-gray-200/50"
                )}
                title="View on GitHub"
              >
                <Github size={20} />
              </a>
              <a
                href="mailto:hello@reddichat.com"
                className={cn(
                  "p-2 rounded-lg transition-all duration-200",
                  isDark
                    ? "bg-slate-800/50 text-gray-400 hover:text-orange-400 hover:bg-slate-700/50"
                    : "bg-gray-100/50 text-gray-600 hover:text-orange-500 hover:bg-gray-200/50"
                )}
                title="Send feedback"
              >
                <Mail size={20} />
              </a>
            </div>

            {/* Simple Copyright */}
            <p className={cn("text-sm", colors.textMuted)}>
              Made with ❤️ for Reddit enthusiasts
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
