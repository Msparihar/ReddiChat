"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  Menu,
  X,
  User,
  ArrowRight,
  Search,
  MessageSquare,
  Zap,
  Loader2,
} from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";
import { useSession } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import { UserSearchAutocomplete } from "@/components/UserSearchAutocomplete";
import { LampContainer } from "@/components/ui/lamp";

// ─────────────────────────────────────────────────────────────
// Editorial / Magazine Landing Page for ReddiChat
// ─────────────────────────────────────────────────────────────

const FEATURES = [
  {
    number: "01",
    icon: Search,
    title: "Smart Search",
    description:
      "AI-powered search across Reddit's vast landscape. Surface the most relevant threads, comments, and discussions instantly.",
  },
  {
    number: "02",
    icon: MessageSquare,
    title: "Conversational AI",
    description:
      "Chat naturally about any Reddit topic. Get synthesized, insightful responses drawn from real community discussions.",
  },
  {
    number: "03",
    icon: Zap,
    title: "Real-time Insights",
    description:
      "Tap into live Reddit discourse. Get up-to-the-minute takes, trending opinions, and emerging narratives as they unfold.",
  },
] as const;

export default function EditorialLandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userLookupInput, setUserLookupInput] = useState("");
  const [showUserLookup, setShowUserLookup] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const heroRef = useRef<HTMLElement>(null);

  const isAuthenticated = !!session;

  // Parallax scroll values for hero
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleGetStarted = () => {
    router.push(isAuthenticated ? "/chat" : "/login");
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  // ─── HEADER ──────────────────────────────────────────────
  const Header = (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        isScrolled
          ? "backdrop-blur-xl bg-[#050505]/80 border-b border-white/5"
          : "bg-transparent"
      )}
    >
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative p-2.5 bg-[#ff4500] rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Bot size={22} className="text-white" />
            </div>
            <span className="font-syne text-xl font-bold text-[#f5f5f0] tracking-tight">
              ReddiChat
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-10">
            {["Home", "Features"].map((item) => (
              <button
                key={item}
                onClick={() => scrollTo(item.toLowerCase())}
                className="font-jakarta text-sm text-[#f5f5f0]/60 hover:text-[#f5f5f0] transition-colors duration-200 tracking-wide uppercase"
              >
                {item}
              </button>
            ))}
            <button
              onClick={() => setShowUserLookup(true)}
              className="font-jakarta text-sm text-[#f5f5f0]/60 hover:text-[#f5f5f0] transition-colors duration-200 tracking-wide uppercase flex items-center gap-1.5"
            >
              <User size={14} />
              User Lookup
            </button>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:block">
            <button
              onClick={handleGetStarted}
              className="group font-syne text-sm font-semibold tracking-wide uppercase px-7 py-3 bg-[#ff4500] text-white rounded-full hover:bg-[#ff5722] transition-all duration-300 flex items-center gap-2"
            >
              {isAuthenticated ? "Go to Chat" : "Get Started"}
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform duration-200"
              />
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-[#f5f5f0]/60 hover:text-[#f5f5f0] transition-colors"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden absolute top-20 left-0 right-0 bg-[#050505]/95 backdrop-blur-xl border-b border-white/5"
          >
            <nav className="px-6 py-8 space-y-5">
              {["Home", "Features"].map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    scrollTo(item.toLowerCase());
                    setIsMenuOpen(false);
                  }}
                  className="block font-jakarta text-lg text-[#f5f5f0]/70 hover:text-[#f5f5f0] transition-colors w-full text-left"
                >
                  {item}
                </button>
              ))}
              <button
                onClick={() => {
                  setShowUserLookup(true);
                  setIsMenuOpen(false);
                }}
                className="font-jakarta text-lg text-[#f5f5f0]/70 hover:text-[#f5f5f0] transition-colors w-full text-left flex items-center gap-2"
              >
                <User size={18} />
                User Lookup
              </button>
              <div className="pt-4 border-t border-white/10">
                <button
                  onClick={() => {
                    handleGetStarted();
                    setIsMenuOpen(false);
                  }}
                  className="w-full font-syne text-base font-semibold tracking-wide uppercase px-6 py-4 bg-[#ff4500] text-white rounded-full hover:bg-[#ff5722] transition-all"
                >
                  {isAuthenticated ? "Go to Chat" : "Get Started"}
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </div>
    </header>
  );

  // ─── HERO ────────────────────────────────────────────────
  const Hero = (
    <section
      ref={heroRef}
      id="home"
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* Grain / noise texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-20 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />

      {/* Subtle ambient blurs */}
      <div className="absolute top-[15%] left-[5%] w-[500px] h-[500px] bg-[#ff4500]/[0.04] rounded-full blur-[120px]" />
      <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-[#ff4500]/[0.03] rounded-full blur-[100px]" />

      <motion.div
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative z-10 w-full max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 pt-32 pb-20"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16">
          {/* Left side — 60% — Giant typography */}
          <div className="lg:w-[60%] flex-shrink-0">
            {/* Editorial tag */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-8"
            >
              <span className="font-jakarta text-xs tracking-[0.3em] uppercase text-[#ff4500] font-medium">
                AI-Powered Reddit Intelligence
              </span>
            </motion.div>

            {/* Main heading — oversized, grid-breaking */}
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="font-syne font-extrabold text-[#f5f5f0] leading-[0.9] tracking-tighter"
            >
              <span className="block text-6xl sm:text-7xl md:text-8xl lg:text-[7rem] xl:text-[8.5rem]">
                ASK
              </span>
              <span className="block text-6xl sm:text-7xl md:text-8xl lg:text-[7rem] xl:text-[8.5rem]">
                REDDIT
              </span>
              <span
                className="block text-6xl sm:text-7xl md:text-8xl lg:text-[7rem] xl:text-[8.5rem] bg-gradient-to-r from-[#ff4500] via-[#ff6b35] to-[#ff4500] bg-clip-text text-transparent"
                style={{ backgroundSize: "200% 100%" }}
              >
                ANYTHING
              </span>
            </motion.h1>

            {/* Editorial line accent */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
              className="mt-8 h-[2px] w-24 bg-[#ff4500] origin-left"
            />
          </div>

          {/* Right side — 40% — Description + CTAs */}
          <div className="lg:w-[40%] mt-12 lg:mt-0 lg:pt-24">
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="font-jakarta text-lg sm:text-xl text-[#f5f5f0]/60 leading-relaxed max-w-md"
            >
              Get instant, intelligent answers synthesized from Reddit&apos;s
              collective knowledge. Real conversations, real insights, powered by
              AI that understands context.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.7 }}
              className="mt-10 flex flex-col sm:flex-row gap-4"
            >
              <button
                onClick={handleGetStarted}
                className="group font-syne text-sm font-bold tracking-wider uppercase px-8 py-4 bg-[#ff4500] text-white rounded-full hover:bg-[#ff5722] transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(255,69,0,0.25)]"
              >
                {isAuthenticated ? "Go to Chat" : "Start Chatting"}
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform duration-200"
                />
              </button>

              <button
                onClick={() => setShowUserLookup(true)}
                className="group font-syne text-sm font-bold tracking-wider uppercase px-8 py-4 border border-[#f5f5f0]/20 text-[#f5f5f0] rounded-full hover:border-[#ff4500]/60 hover:bg-[#ff4500]/5 transition-all duration-300 flex items-center justify-center gap-3"
              >
                <User size={18} />
                User Lookup
              </button>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.9 }}
              className="mt-14 flex gap-10"
            >
              {[
                { value: "10M+", label: "Threads Indexed" },
                { value: "< 2s", label: "Avg Response" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="font-syne text-2xl font-bold text-[#f5f5f0]">
                    {stat.value}
                  </div>
                  <div className="font-jakarta text-xs text-[#f5f5f0]/40 uppercase tracking-wider mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Bottom scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-[1px] h-12 bg-gradient-to-b from-[#f5f5f0]/40 to-transparent"
        />
      </motion.div>
    </section>
  );

  // ─── LAMP DIVIDER ────────────────────────────────────────
  const LampDivider = (
    <section className="relative" id="lamp-section">
      {/* Scoped CSS to override the LampContainer's cyan colors to orange */}
      <style>{`
        #lamp-section .from-cyan-500 {
          --tw-gradient-from: #ff4500 !important;
          --tw-gradient-from-position:  !important;
          --tw-gradient-to: rgb(255 69 0 / 0) !important;
        }
        #lamp-section .to-cyan-500 {
          --tw-gradient-to: #ff4500 !important;
          --tw-gradient-to-position:  !important;
        }
        #lamp-section .bg-cyan-500 {
          background-color: #ff4500 !important;
        }
        #lamp-section .bg-cyan-400 {
          background-color: #ff6b35 !important;
        }
        #lamp-section .bg-slate-950 {
          background-color: #050505 !important;
        }
      `}</style>
      <LampContainer className="!min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
          className="text-center"
        >
          <p className="font-jakarta text-sm tracking-[0.3em] uppercase text-[#ff4500]/80 mb-4">
            Next Generation
          </p>
          <h2 className="font-syne text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-br from-[#f5f5f0] to-[#f5f5f0]/60 bg-clip-text text-transparent">
            Powered by AI.
            <br />
            Driven by community.
          </h2>
        </motion.div>
      </LampContainer>
    </section>
  );

  // ─── FEATURES ────────────────────────────────────────────
  const Features = (
    <section
      id="features"
      className="relative py-32 px-6 sm:px-8 lg:px-12 overflow-hidden"
    >
      {/* Section header */}
      <div className="max-w-[1400px] mx-auto mb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <span className="font-jakarta text-xs tracking-[0.3em] uppercase text-[#ff4500] font-medium">
            What we offer
          </span>
          <h2 className="font-syne text-4xl sm:text-5xl md:text-6xl font-bold text-[#f5f5f0] mt-4 tracking-tight">
            Features
          </h2>
        </motion.div>
      </div>

      {/* Offset grid — staggered Y positions for editorial feel */}
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {FEATURES.map((feature, index) => {
          // Stagger offsets: 0, 40px, 80px for the editorial look
          const yOffsets = ["md:mt-0", "md:mt-16", "md:mt-32"];
          return (
            <motion.div
              key={feature.number}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className={cn("group", yOffsets[index])}
            >
              <div className="relative p-8 sm:p-10 rounded-2xl bg-[#1c1c1c] border border-white/[0.04] transition-all duration-500 hover:border-[#ff4500]/30 hover:-translate-y-1 hover:shadow-[0_0_60px_rgba(255,69,0,0.08)]">
                {/* Decorative number */}
                <span className="font-syne text-[5rem] sm:text-[6rem] font-black text-white/[0.03] absolute top-4 right-6 leading-none select-none group-hover:text-[#ff4500]/[0.06] transition-colors duration-500">
                  {feature.number}
                </span>

                {/* Icon */}
                <div className="relative z-10 w-14 h-14 rounded-xl bg-[#ff4500]/10 border border-[#ff4500]/20 flex items-center justify-center mb-8 group-hover:bg-[#ff4500]/15 transition-colors duration-300">
                  <feature.icon
                    size={24}
                    className="text-[#ff4500]"
                  />
                </div>

                {/* Content */}
                <h3 className="relative z-10 font-syne text-xl sm:text-2xl font-bold text-[#f5f5f0] mb-4">
                  {feature.title}
                </h3>
                <p className="relative z-10 font-jakarta text-[#f5f5f0]/50 leading-relaxed text-sm sm:text-base">
                  {feature.description}
                </p>

                {/* Bottom accent line */}
                <div className="mt-8 h-[1px] w-12 bg-white/10 group-hover:w-full group-hover:bg-[#ff4500]/30 transition-all duration-500" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );

  // ─── FOOTER ──────────────────────────────────────────────
  const Footer = (
    <footer className="relative border-t border-white/5 py-20 px-6 sm:px-8 lg:px-12">
      <div className="max-w-[1400px] mx-auto">
        {/* Large wordmark */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <span className="font-syne text-5xl sm:text-6xl md:text-7xl font-black text-[#f5f5f0]/[0.06] tracking-tighter select-none">
            ReddiChat
          </span>
        </motion.div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#ff4500] rounded-lg">
              <Bot size={16} className="text-white" />
            </div>
            <span className="font-syne text-sm font-semibold text-[#f5f5f0]/80">
              ReddiChat
            </span>
          </div>
          <p className="font-jakarta text-xs text-[#f5f5f0]/30 tracking-wide">
            {new Date().getFullYear()} ReddiChat. AI-powered Reddit
            assistant. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );

  // ─── USER LOOKUP MODAL ───────────────────────────────────
  const UserLookupModal = showUserLookup ? (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md"
      onClick={() => setShowUserLookup(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="w-full max-w-md mx-4 p-8 rounded-2xl bg-[#1c1c1c] border border-white/[0.06] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-syne text-xl font-bold text-[#f5f5f0]">
            Reddit User Lookup
          </h2>
          <button
            onClick={() => setShowUserLookup(false)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-[#f5f5f0]/40 hover:text-[#f5f5f0] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <p className="font-jakarta text-sm text-[#f5f5f0]/40 mb-5">
          Enter a Reddit username to view their profile, posts, and comments.
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
            className="w-full font-syne text-sm font-semibold tracking-wide uppercase bg-[#ff4500] text-white px-4 py-3.5 rounded-xl hover:bg-[#ff5722] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
    </div>
  ) : null;

  // ─── RENDER ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#050505] text-[#f5f5f0] selection:bg-[#ff4500]/30 selection:text-white">
      {Header}
      {Hero}
      {LampDivider}
      {Features}
      {Footer}
      {UserLookupModal}
    </div>
  );
}
