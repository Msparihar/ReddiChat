"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  Github,
  Menu,
  X,
  User,
  ArrowRight,
  Search,
  MessageSquare,
  Zap,
  Loader2,
} from "lucide-react";
import { motion } from "motion/react";
import { useSession } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import { UserSearchAutocomplete } from "@/components/UserSearchAutocomplete";
import { Spotlight } from "@/components/ui/spotlight";
import { BackgroundBeams } from "@/components/ui/background-beams";

export default function V1DarkCinematic() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userLookupInput, setUserLookupInput] = useState("");
  const [showUserLookup, setShowUserLookup] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const isAuthenticated = !!session;

  const handleUserLookup = () => {
    if (userLookupInput.trim()) {
      setIsLookingUp(true);
      router.push(`/u/${userLookupInput.trim()}`);
    }
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleGetStarted = () => {
    router.push(isAuthenticated ? "/chat" : "/login");
  };

  const features = [
    {
      icon: Search,
      title: "Smart Search",
      description:
        "AI-powered search across Reddit to find exactly what you need",
    },
    {
      icon: MessageSquare,
      title: "Conversational AI",
      description:
        "Chat naturally about Reddit topics and get insightful responses",
    },
    {
      icon: Zap,
      title: "Real-time Insights",
      description:
        "Get up-to-date information from active Reddit discussions",
    },
  ];

  return (
    <div className="min-h-screen bg-black font-dm-sans">
      {/* Grain overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-[100] opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          isScrolled
            ? "bg-black/80 backdrop-blur-xl border-b border-white/5 shadow-2xl shadow-orange-500/5"
            : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3 group">
              <div className="relative p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg group-hover:shadow-lg group-hover:shadow-orange-500/30 transition-all duration-300">
                <Bot size={22} className="text-white" />
              </div>
              <span className="text-lg font-outfit font-bold text-white tracking-tight">
                ReddiChat
              </span>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              {["Home", "Features"].map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    document
                      .getElementById(item.toLowerCase())
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="relative text-gray-400 hover:text-white transition-colors duration-300 text-sm tracking-wide uppercase group py-2"
                >
                  {item}
                  <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-gradient-to-r from-orange-500 to-red-500 group-hover:w-full transition-all duration-300" />
                </button>
              ))}
              <button
                onClick={() => setShowUserLookup(true)}
                className="relative text-gray-400 hover:text-white transition-colors duration-300 text-sm tracking-wide uppercase flex items-center gap-1.5 group py-2"
              >
                <User size={14} />
                Lookup
                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-gradient-to-r from-orange-500 to-red-500 group-hover:w-full transition-all duration-300" />
              </button>
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-500 hover:text-white transition-colors duration-300"
              >
                <Github size={18} />
              </a>
              <button
                onClick={handleGetStarted}
                className="group relative px-6 py-2 rounded-lg font-medium text-sm overflow-hidden cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-600 transition-all duration-300 group-hover:opacity-90" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-orange-400 to-red-500" />
                <span className="relative z-10 text-white">
                  {isAuthenticated ? "Go to Chat" : "Get Started"}
                </span>
              </button>
            </div>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:hidden absolute top-16 left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-white/5"
            >
              <nav className="px-4 py-6 space-y-4">
                {["Home", "Features"].map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      document
                        .getElementById(item.toLowerCase())
                        ?.scrollIntoView({ behavior: "smooth" });
                      setIsMenuOpen(false);
                    }}
                    className="block text-gray-400 hover:text-white transition-colors text-sm uppercase tracking-wide w-full text-left py-2"
                  >
                    {item}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setShowUserLookup(true);
                    setIsMenuOpen(false);
                  }}
                  className="block text-gray-400 hover:text-white transition-colors text-sm uppercase tracking-wide w-full text-left py-2"
                >
                  User Lookup
                </button>
                <div className="pt-4 border-t border-white/5">
                  <button
                    onClick={() => {
                      handleGetStarted();
                      setIsMenuOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-lg font-medium text-sm"
                  >
                    {isAuthenticated ? "Go to Chat" : "Get Started"}
                  </button>
                </div>
              </nav>
            </motion.div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section
        id="home"
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Spotlight effects */}
        <Spotlight
          className="-top-40 left-0 md:left-60 md:-top-20"
          fill="#ff4500"
        />
        <Spotlight
          className="top-10 left-full -translate-x-[40%] md:-top-10"
          fill="#ff6b35"
        />

        {/* Subtle radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[120px] animate-glow-pulse" />

        {/* Background beams */}
        <BackgroundBeams className="opacity-30" />

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center space-x-2 bg-white/[0.03] border border-white/[0.06] rounded-full px-5 py-2 mb-10 backdrop-blur-sm"
          >
            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-400 tracking-widest uppercase font-outfit">
              AI-powered Reddit insights
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="font-outfit font-bold text-5xl sm:text-6xl lg:text-8xl text-white mb-8 leading-[0.95] tracking-tight"
          >
            Ask Reddit{" "}
            <span className="bg-gradient-to-r from-orange-400 via-red-500 to-orange-500 bg-clip-text text-transparent">
              Anything
            </span>
            <br />
            <span className="text-gray-300">Get Smart Answers.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="text-gray-500 text-lg sm:text-xl max-w-2xl mx-auto mb-12 leading-relaxed font-light"
          >
            Powered by AI. Get instant, intelligent answers from Reddit&apos;s
            community. Perfect for when you need context or want to understand
            discussions better.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={handleGetStarted}
              className="group relative bg-gradient-to-r from-orange-500 to-red-600 text-white px-8 py-4 rounded-xl font-outfit font-semibold text-base flex items-center gap-2 shadow-2xl shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-500 cursor-pointer"
            >
              {isAuthenticated ? "Go to Chat" : "Start Chatting"}
              <ArrowRight
                size={18}
                className="group-hover:translate-x-1 transition-transform duration-300"
              />
            </button>

            <button
              onClick={() => setShowUserLookup(true)}
              className="group px-8 py-4 rounded-xl font-outfit font-semibold text-base text-white border border-white/10 hover:border-orange-500/30 bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-500 backdrop-blur-sm flex items-center gap-2 cursor-pointer"
            >
              <User size={18} className="text-gray-400 group-hover:text-orange-400 transition-colors" />
              User Lookup
            </button>
          </motion.div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-32 px-4 sm:px-6 lg:px-8">
        {/* Subtle top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />

        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <span className="text-xs text-orange-500 tracking-[0.3em] uppercase font-outfit mb-4 block">
              Features
            </span>
            <h2 className="font-outfit font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Everything you need to explore Reddit with AI assistance
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="group relative p-8 rounded-2xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] hover:border-orange-500/20 transition-all duration-500 cursor-default"
              >
                {/* Hover glow */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-b from-orange-500/5 to-transparent" />

                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/10 flex items-center justify-center mb-6 group-hover:border-orange-500/30 group-hover:shadow-lg group-hover:shadow-orange-500/10 transition-all duration-500">
                    <feature.icon className="w-5 h-5 text-orange-400" />
                  </div>
                  <h3 className="font-outfit font-semibold text-xl text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/[0.04] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="p-1.5 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
                <Bot size={16} className="text-white" />
              </div>
              <span className="font-outfit font-semibold text-white text-sm">
                ReddiChat
              </span>
            </div>
            <p className="text-xs text-gray-600">
              {new Date().getFullYear()} ReddiChat. AI-powered Reddit assistant.
            </p>
          </div>
        </div>
      </footer>

      {/* User Lookup Modal */}
      {showUserLookup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
          onClick={() => setShowUserLookup(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md mx-4 p-6 rounded-2xl border border-white/[0.06] bg-[#0a0a0a] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-outfit font-semibold text-white">
                Reddit User Lookup
              </h2>
              <button
                onClick={() => setShowUserLookup(false)}
                className="p-1 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Enter a Reddit username to view their profile, posts, and
              comments.
            </p>

            <div className="space-y-4">
              <UserSearchAutocomplete
                isDark={true}
                autoFocus
                onInputChange={(value) => setUserLookupInput(value)}
                onSelect={(username) => {
                  setIsLookingUp(true);
                  setShowUserLookup(false);
                  router.push(`/u/${username}`);
                }}
              />

              <button
                onClick={() => {
                  if (userLookupInput.trim()) {
                    setIsLookingUp(true);
                    setShowUserLookup(false);
                    router.push(`/u/${userLookupInput.trim()}`);
                  }
                }}
                disabled={!userLookupInput.trim() || isLookingUp}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-3 rounded-lg font-outfit font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLookingUp ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    Look Up User
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
