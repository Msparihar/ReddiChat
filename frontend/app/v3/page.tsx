"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  Menu,
  X,
  User,
  ArrowRight,
  Sparkles,
  Search,
  MessageSquare,
  Zap,
  Loader2,
} from "lucide-react";
import { motion, useInView } from "motion/react";
import { useSession } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import { UserSearchAutocomplete } from "@/components/UserSearchAutocomplete";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Meteors } from "@/components/ui/meteors";

// ── Palette constants ─────────────────────────────────────────────────
const CREAM = "#e8e0d8";
const MUTED = "#a39e97";
const BASE = "#0f0f0f";
const CORAL = "#ff8a65";
const ORANGE = "#ff6b35";

// ── Fade-in animation variants ────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
});

const stagger = {
  animate: { transition: { staggerChildren: 0.15 } },
};

// ── Feature data ──────────────────────────────────────────────────────
const features = [
  {
    icon: Search,
    title: "Smart Search",
    description:
      "AI-powered search across Reddit to surface the most relevant discussions, threads, and answers for your query.",
  },
  {
    icon: MessageSquare,
    title: "Conversational AI",
    description:
      "Chat naturally about any Reddit topic. Get synthesized insights from thousands of community discussions.",
  },
  {
    icon: Zap,
    title: "Real-time Insights",
    description:
      "Pull live data from active Reddit threads to give you the freshest perspectives and trending opinions.",
  },
];

export default function V3LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userLookupInput, setUserLookupInput] = useState("");
  const [showUserLookup, setShowUserLookup] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const isAuthenticated = !!session;

  const featuresRef = useRef<HTMLDivElement>(null);
  const featuresInView = useInView(featuresRef, { once: true, amount: 0.2 });

  // ── Scroll listener for header frost effect ───────────────────────
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Nav helpers ────────────────────────────────────────────────────
  const handleGetStarted = () => {
    router.push(isAuthenticated ? "/chat" : "/login");
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setIsMenuOpen(false);
  };

  // ──────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────
  return (
    <div className="font-jakarta bg-[#0f0f0f] text-[#e8e0d8] min-h-screen overflow-x-hidden">
      {/* ═══════════════════ HEADER ═══════════════════ */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          isScrolled
            ? "backdrop-blur-xl bg-[#0f0f0f]/80 border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.4)]"
            : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="relative p-2 bg-gradient-to-br from-[#ff6b35] to-[#ff8a65] rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-[#ff6b35]/20">
                <Bot size={22} className="text-white" />
              </div>
              <span className="text-lg font-bold text-[#e8e0d8] group-hover:text-[#ff8a65] transition-colors duration-300">
                ReddiChat
              </span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center space-x-8">
              {["Home", "Features"].map((item) => (
                <button
                  key={item}
                  onClick={() => scrollTo(item.toLowerCase())}
                  className="relative text-[#a39e97] hover:text-[#ff8a65] transition-colors duration-300 group py-2 text-sm font-medium"
                >
                  {item}
                  <span className="absolute bottom-0 left-0 w-0 h-[2px] rounded-full bg-gradient-to-r from-[#ff6b35] to-[#ff8a65] group-hover:w-full transition-all duration-300" />
                </button>
              ))}
              <button
                onClick={() => setShowUserLookup(true)}
                className="relative text-[#a39e97] hover:text-[#ff8a65] transition-colors duration-300 group py-2 flex items-center gap-1.5 text-sm font-medium"
              >
                <User size={15} />
                User Lookup
                <span className="absolute bottom-0 left-0 w-0 h-[2px] rounded-full bg-gradient-to-r from-[#ff6b35] to-[#ff8a65] group-hover:w-full transition-all duration-300" />
              </button>
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center">
              <button
                onClick={handleGetStarted}
                className="relative bg-gradient-to-r from-[#ff6b35] to-[#ff8a65] text-white px-6 py-2.5 rounded-full font-semibold text-sm hover:shadow-[0_0_30px_rgba(255,107,53,0.3)] transition-all duration-300 hover:scale-105 cursor-pointer"
              >
                {isAuthenticated ? "Go to Chat" : "Get Started"}
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-[#a39e97] hover:text-[#e8e0d8] transition-colors rounded-xl hover:bg-white/5"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="md:hidden absolute top-16 left-0 right-0 backdrop-blur-xl bg-[#0f0f0f]/95 border-b border-white/5"
            >
              <nav className="px-4 py-6 space-y-3">
                {["Home", "Features"].map((item) => (
                  <button
                    key={item}
                    onClick={() => scrollTo(item.toLowerCase())}
                    className="block w-full text-left text-[#a39e97] hover:text-[#ff8a65] transition-colors py-2 text-sm font-medium"
                  >
                    {item}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setShowUserLookup(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left text-[#a39e97] hover:text-[#ff8a65] transition-colors py-2 text-sm font-medium flex items-center gap-1.5"
                >
                  <User size={15} />
                  User Lookup
                </button>
                <div className="pt-4 border-t border-white/5">
                  <button
                    onClick={() => {
                      handleGetStarted();
                      setIsMenuOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-[#ff6b35] to-[#ff8a65] text-white px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300"
                  >
                    {isAuthenticated ? "Go to Chat" : "Get Started"}
                  </button>
                </div>
              </nav>
            </motion.div>
          )}
        </div>
      </header>

      {/* ═══════════════════ HERO SECTION ═══════════════════ */}
      <section id="home">
        <AuroraBackground
          className="!bg-[#0f0f0f] dark:!bg-[#0f0f0f]"
          showRadialGradient
          style={
            {
              "--aurora":
                "repeating-linear-gradient(100deg, #ff6b35_10%, #ff8a65_15%, #ffab76_20%, #ffd4a8_25%, #ff4500_30%)",
              "--dark-gradient":
                "repeating-linear-gradient(100deg, #000_0%, #000_7%, transparent_10%, transparent_12%, #000_16%)",
              "--white-gradient":
                "repeating-linear-gradient(100deg, #fff_0%, #fff_7%, transparent_10%, transparent_12%, #fff_16%)",
              "--blue-300": "#ffab76",
              "--blue-400": "#ff4500",
              "--blue-500": "#ff6b35",
              "--indigo-300": "#ff8a65",
              "--violet-200": "#ffd4a8",
              "--black": "#000",
              "--white": "#fff",
              "--transparent": "transparent",
            } as React.CSSProperties
          }
        >
          {/* Meteor overlay */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
            <Meteors
              number={15}
              className="!bg-[#ff6b35] !shadow-[0_0_0_1px_rgba(255,107,53,0.15)] before:!bg-gradient-to-r before:!from-[#ff8a65] before:!to-transparent"
            />
          </div>

          {/* Hero content */}
          <motion.div
            className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center"
            initial="initial"
            animate="animate"
            variants={stagger}
          >
            {/* Pill badge */}
            <motion.div
              variants={fadeUp(0)}
              className="inline-flex items-center space-x-2 backdrop-blur-xl bg-white/[0.05] border border-[#ff6b35]/20 rounded-full px-5 py-2.5 mb-8 hover:border-[#ff6b35]/40 transition-all duration-300 hover:scale-105"
            >
              <Sparkles size={14} className="text-[#ff8a65]" />
              <span className="text-sm text-[#a39e97] font-medium">
                AI-powered Reddit insights
              </span>
              <div className="w-1.5 h-1.5 bg-[#ff6b35] rounded-full animate-glow-pulse" />
            </motion.div>

            {/* Heading */}
            <motion.h1
              variants={fadeUp(0.15)}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-[1.1] tracking-tight"
              style={{ color: CREAM }}
            >
              Ask Reddit{" "}
              <span className="bg-gradient-to-r from-[#ff6b35] via-[#ff8a65] to-[#ff6b35] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x">
                Anything
              </span>
              <br />
              Get Smart Answers.
            </motion.h1>

            {/* Description */}
            <motion.p
              variants={fadeUp(0.3)}
              className="text-base sm:text-lg mb-10 max-w-2xl leading-relaxed"
              style={{ color: MUTED }}
            >
              Powered by AI. Get instant, intelligent answers from
              Reddit&apos;s community. Understand discussions, surface insights,
              and explore topics like never before.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              variants={fadeUp(0.45)}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <button
                onClick={handleGetStarted}
                className="group relative bg-gradient-to-r from-[#ff6b35] to-[#ff8a65] text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 flex items-center gap-2 shadow-[0_0_40px_rgba(255,107,53,0.2)] hover:shadow-[0_0_60px_rgba(255,107,53,0.35)] hover:scale-105 cursor-pointer"
              >
                <span>{isAuthenticated ? "Go to Chat" : "Start Chatting"}</span>
                <ArrowRight
                  size={20}
                  className="group-hover:translate-x-1 transition-transform duration-300"
                />
              </button>

              <button
                onClick={() => setShowUserLookup(true)}
                className="group relative px-8 py-4 rounded-full font-semibold text-lg text-[#e8e0d8] border border-white/10 hover:border-[#ff6b35]/40 bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-xl transition-all duration-300 flex items-center gap-2 hover:scale-105 cursor-pointer"
              >
                <User size={20} className="text-[#ff8a65]" />
                <span>User Lookup</span>
              </button>
            </motion.div>
          </motion.div>
        </AuroraBackground>
      </section>

      {/* ═══════════════════ FEATURES SECTION ═══════════════════ */}
      <section
        id="features"
        className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8"
        style={{ background: BASE }}
      >
        {/* Soft top glow to blend from aurora */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#ff6b35]/[0.04] rounded-full blur-[120px] pointer-events-none" />

        <div ref={featuresRef} className="max-w-7xl mx-auto relative z-10">
          {/* Section header */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight"
              style={{ color: CREAM }}
            >
              Powerful Features
            </h2>
            <p
              className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
              style={{ color: MUTED }}
            >
              Everything you need to explore Reddit with AI assistance
            </p>
          </motion.div>

          {/* Feature cards */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.7,
                  delay: 0.15 + index * 0.15,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={cn(
                  "group relative p-8 rounded-3xl",
                  "backdrop-blur-xl bg-white/[0.03] border border-white/[0.06]",
                  "hover:bg-white/[0.06] hover:border-[#ff6b35]/20",
                  "hover:shadow-[0_0_60px_rgba(255,107,53,0.08)]",
                  "transition-all duration-500 hover:scale-[1.02]",
                  "animate-float"
                )}
                style={{
                  animationDelay: `${index * 0.8}s`,
                  animationDuration: `${3 + index * 0.5}s`,
                }}
              >
                {/* Icon circle */}
                <div className="w-14 h-14 bg-gradient-to-br from-[#ff6b35]/20 to-[#ff8a65]/10 border border-[#ff6b35]/15 rounded-2xl flex items-center justify-center mb-6 group-hover:shadow-[0_0_30px_rgba(255,107,53,0.15)] transition-all duration-500">
                  <feature.icon size={24} className="text-[#ff8a65]" />
                </div>

                {/* Text */}
                <h3
                  className="text-xl font-semibold mb-3 tracking-tight"
                  style={{ color: CREAM }}
                >
                  {feature.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: MUTED }}
                >
                  {feature.description}
                </p>

                {/* Subtle corner glow on hover */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff6b35]/0 group-hover:bg-[#ff6b35]/[0.04] rounded-full blur-[60px] transition-all duration-700 pointer-events-none" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="relative py-12 px-4 sm:px-6 lg:px-8">
        {/* Gradient fade from base to slightly warmer */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(to bottom, ${BASE}, #121215)`,
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Logo mark */}
            <div className="flex items-center space-x-2.5 group">
              <div className="p-1.5 bg-gradient-to-br from-[#ff6b35] to-[#ff8a65] rounded-xl shadow-lg shadow-[#ff6b35]/10">
                <Bot size={16} className="text-white" />
              </div>
              <span
                className="font-semibold text-sm"
                style={{ color: CREAM }}
              >
                ReddiChat
              </span>
            </div>

            {/* Copyright */}
            <p className="text-sm" style={{ color: "#5a5550" }}>
              {new Date().getFullYear()} ReddiChat. AI-powered Reddit
              assistant.
            </p>
          </div>
        </div>
      </footer>

      {/* ═══════════════════ USER LOOKUP MODAL ═══════════════════ */}
      {showUserLookup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowUserLookup(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md mx-4 p-6 rounded-3xl backdrop-blur-xl bg-[#1a1a1e]/90 border border-white/[0.08] shadow-[0_25px_80px_rgba(0,0,0,0.6)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-xl font-semibold"
                style={{ color: CREAM }}
              >
                Reddit User Lookup
              </h2>
              <button
                onClick={() => setShowUserLookup(false)}
                className="p-1.5 rounded-xl text-[#a39e97] hover:text-[#e8e0d8] hover:bg-white/5 transition-all duration-200"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm mb-5" style={{ color: MUTED }}>
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
                className="w-full bg-gradient-to-r from-[#ff6b35] to-[#ff8a65] text-white px-4 py-3 rounded-2xl font-medium transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(255,107,53,0.2)]"
              >
                {isLookingUp ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Search size={18} />
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
