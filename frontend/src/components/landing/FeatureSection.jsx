import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { BentoGrid } from '../ui/bento-grid';
import { cn } from '../../lib/utils';
import {
  MessageSquare,
  Search,
  Upload,
  Zap,
  Bot,
  FileText
} from 'lucide-react';

const FeatureSection = () => {
  const { colors, isDark } = useTheme();

  const reddiChatFeatures = [
    {
      title: "AI Reddit Search",
      meta: "Instant answers",
      description: "Ask questions about any Reddit post and get instant, clear explanations from AI",
      icon: <MessageSquare className="w-4 h-4 text-orange-500" />,
      status: "Live",
      tags: ["AI", "Search", "Reddit"],
      colSpan: 2,
      hasPersistentHover: true,
    },
    {
      title: "File Upload Support",
      meta: "Multiple formats",
      description: "Upload documents, images, and files to get context-aware analysis",
      icon: <Upload className="w-4 h-4 text-blue-500" />,
      status: "Active",
      tags: ["Upload", "Files"],
    },
    {
      title: "Smart Context Finder",
      meta: "Deep analysis",
      description: "Understand the background and context behind Reddit discussions and memes",
      icon: <Search className="w-4 h-4 text-emerald-500" />,
      tags: ["Context", "Analysis"],
      colSpan: 2,
    },
    {
      title: "Lightning Fast",
      meta: "< 2s response",
      description: "Skip endless scrolling and get straight to the information you need",
      icon: <Zap className="w-4 h-4 text-yellow-500" />,
      status: "Optimized",
      tags: ["Speed", "UX"],
    },
  ];

  return (
    <section id="features" className="py-20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-orange-500/5"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className={cn(
            "text-3xl sm:text-4xl font-bold mb-6 leading-tight",
            colors.textPrimary
          )}>
            Why I Built{' '}
            <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              ReddiChat
            </span>
          </h2>
          <p className={cn("text-lg leading-relaxed max-w-2xl mx-auto", colors.textSecondary)}>
            As someone who spends a lot of time on Reddit, I got tired of scrolling through endless threads
            to find answers. So I built this simple tool to help quickly understand Reddit posts and discussions.
          </p>
        </div>

        {/* Bento Grid */}
        <BentoGrid items={reddiChatFeatures} />
      </div>
    </section>
  );
};

export default FeatureSection;
