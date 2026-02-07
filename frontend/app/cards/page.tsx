"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search,
  MessageSquare,
  Zap,
  ArrowUpRight,
  Terminal,
  ChevronRight,
} from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Search,
    title: "Smart Search",
    description:
      "AI-powered search across Reddit to find exactly what you need",
    tag: "SEARCH",
  },
  {
    icon: MessageSquare,
    title: "Conversational AI",
    description:
      "Chat naturally about Reddit topics and get insightful responses",
    tag: "CHAT",
  },
  {
    icon: Zap,
    title: "Real-time Insights",
    description:
      "Get up-to-date information from active Reddit discussions",
    tag: "LIVE",
  },
];

// ═══════════════════════════════════════════════════════════════
// CARD 1 — Numbered Editorial (current V2 style)
// ═══════════════════════════════════════════════════════════════
function Card1() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {features.map((f, i) => (
        <div
          key={i}
          className={cn(
            "group relative p-8 rounded-2xl bg-[#1c1c1c] border border-white/[0.04] transition-all duration-500 hover:border-[#ff4500]/30 hover:-translate-y-1",
            i === 1 && "md:mt-12",
            i === 2 && "md:mt-24"
          )}
        >
          <span className="font-syne text-[5rem] font-black text-white/[0.03] absolute top-4 right-6 leading-none select-none group-hover:text-[#ff4500]/[0.06] transition-colors duration-500">
            0{i + 1}
          </span>
          <div className="w-12 h-12 rounded-xl bg-[#ff4500]/10 border border-[#ff4500]/20 flex items-center justify-center mb-6">
            <f.icon size={22} className="text-[#ff4500]" />
          </div>
          <h3 className="font-syne text-xl font-bold text-[#f5f5f0] mb-3">{f.title}</h3>
          <p className="text-[#f5f5f0]/50 text-sm leading-relaxed">{f.description}</p>
          <div className="mt-6 h-px w-10 bg-white/10 group-hover:w-full group-hover:bg-[#ff4500]/30 transition-all duration-500" />
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CARD 2 — Animated Gradient Border
// ═══════════════════════════════════════════════════════════════
function Card2() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {features.map((f, i) => (
        <div
          key={i}
          className="group relative rounded-2xl p-px overflow-hidden transition-all duration-500"
        >
          {/* Animated gradient border */}
          <div
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background:
                "conic-gradient(from 0deg, #ff4500, #ff6b35, #ff8a65, #ffd4a8, #ff4500)",
              animation: "spin 3s linear infinite",
            }}
          />
          <div className="absolute inset-px rounded-2xl bg-[#0a0a0a]" />

          {/* Static border for non-hover */}
          <div className="absolute inset-0 rounded-2xl border border-white/[0.06] group-hover:border-transparent transition-colors duration-500" />

          <div className="relative z-10 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff4500] to-[#ff6b35] flex items-center justify-center">
                <f.icon size={18} className="text-white" />
              </div>
              <span className="text-[10px] tracking-[0.25em] uppercase text-[#ff4500]/60 font-medium">
                {f.tag}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{f.title}</h3>
            <p className="text-white/40 text-sm leading-relaxed">{f.description}</p>
          </div>
        </div>
      ))}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CARD 3 — 3D Tilt on Hover
// ═══════════════════════════════════════════════════════════════
function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 200, damping: 20 });

  const handleMouse = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={cn("cursor-default", className)}
    >
      {children}
    </motion.div>
  );
}

function Card3() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ perspective: "1200px" }}>
      {features.map((f, i) => (
        <TiltCard key={i}>
          <div className="relative p-8 rounded-2xl bg-gradient-to-br from-[#141414] to-[#0a0a0a] border border-white/[0.06] overflow-hidden">
            {/* Shine effect on hover */}
            <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-700 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent" style={{ transform: "translateZ(20px)" }} />

            <div className="mb-8" style={{ transform: "translateZ(30px)" }}>
              <div className="w-16 h-16 rounded-2xl bg-[#ff4500]/10 flex items-center justify-center mb-6 border border-[#ff4500]/10">
                <f.icon size={28} className="text-[#ff4500]" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-3" style={{ transform: "translateZ(25px)" }}>{f.title}</h3>
            <p className="text-white/40 text-sm leading-relaxed" style={{ transform: "translateZ(15px)" }}>{f.description}</p>
          </div>
        </TiltCard>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CARD 4 — Split Accent Strip
// ═══════════════════════════════════════════════════════════════
function Card4() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {features.map((f, i) => (
        <div
          key={i}
          className="group flex rounded-2xl overflow-hidden bg-[#0e0e0e] border border-white/[0.04] hover:border-white/[0.08] transition-all duration-500"
        >
          {/* Left accent */}
          <div className="w-1.5 bg-gradient-to-b from-[#ff4500] to-[#ff6b35] group-hover:w-2 transition-all duration-500 shrink-0" />

          <div className="p-7 flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <f.icon size={20} className="text-[#ff4500]" />
              <ArrowUpRight
                size={16}
                className="text-white/20 group-hover:text-[#ff4500] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300"
              />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
            <p className="text-white/40 text-sm leading-relaxed flex-1">{f.description}</p>
            <div className="mt-5 text-xs text-[#ff4500]/50 tracking-widest uppercase font-medium">
              0{i + 1}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CARD 5 — Terminal / Code Style
// ═══════════════════════════════════════════════════════════════
function Card5() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {features.map((f, i) => (
        <div
          key={i}
          className="group rounded-xl overflow-hidden border border-white/[0.06] bg-[#0c0c0c] hover:border-[#ff4500]/20 transition-all duration-500"
        >
          {/* Terminal header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.04] bg-white/[0.02]">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff4500]/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
            <span className="ml-2 text-[10px] text-white/30 font-mono">{f.tag.toLowerCase()}.ts</span>
          </div>

          <div className="p-6 font-mono">
            <div className="text-white/20 text-xs mb-1">{"// "}{f.title}</div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[#ff4500] text-xs">export</span>
              <span className="text-[#ff8a65] text-xs">function</span>
              <span className="text-white text-xs">{f.title.replace(/\s/g, "")}()</span>
              <span className="text-white/30 text-xs">{"{"}</span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed pl-4 border-l border-white/[0.04] font-sans">
              {f.description}
            </p>
            <div className="text-white/30 text-xs mt-4">{"}"}</div>

            <div className="mt-4 flex items-center gap-1.5 text-[#ff4500]/40 group-hover:text-[#ff4500]/70 transition-colors">
              <Terminal size={12} />
              <span className="text-[10px] tracking-wider uppercase">Active</span>
              <span className="w-1.5 h-1.5 bg-green-500/60 rounded-full animate-pulse ml-1" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CARD 6 — Spotlight Reveal (radial gradient follows cursor)
// ═══════════════════════════════════════════════════════════════
function SpotlightCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);

  const handleMouse = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className="relative rounded-2xl border border-white/[0.04] bg-[#0a0a0a] overflow-hidden transition-all duration-300 hover:border-white/[0.08]"
    >
      {/* Spotlight follow */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: hovering ? 1 : 0,
          background: `radial-gradient(300px circle at ${pos.x}px ${pos.y}px, rgba(255,69,0,0.08), transparent 60%)`,
        }}
      />
      {children}
    </div>
  );
}

function Card6() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {features.map((f, i) => (
        <SpotlightCard key={i}>
          <div className="relative z-10 p-8">
            <f.icon size={24} className="text-[#ff4500] mb-6" />
            <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
            <p className="text-white/40 text-sm leading-relaxed">{f.description}</p>
            <div className="mt-6 flex items-center gap-1 text-[#ff4500]/60 text-xs font-medium">
              Learn more <ChevronRight size={12} />
            </div>
          </div>
        </SpotlightCard>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CARD 7 — Large Icon Background + Minimal Text
// ═══════════════════════════════════════════════════════════════
function Card7() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {features.map((f, i) => (
        <div
          key={i}
          className="group relative p-8 rounded-3xl bg-[#0e0e0e] border border-white/[0.04] hover:border-[#ff4500]/15 overflow-hidden transition-all duration-500 min-h-[260px] flex flex-col justify-end"
        >
          {/* Giant icon in background */}
          <f.icon
            size={180}
            strokeWidth={0.5}
            className="absolute -top-6 -right-6 text-white/[0.02] group-hover:text-[#ff4500]/[0.06] transition-colors duration-700"
          />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ff4500]/10 border border-[#ff4500]/10 mb-4">
              <f.icon size={12} className="text-[#ff4500]" />
              <span className="text-[10px] text-[#ff4500] tracking-widest uppercase font-semibold">
                {f.tag}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">{f.title}</h3>
            <p className="text-white/35 text-sm leading-relaxed">{f.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CARD 8 — Horizontal Layout Cards
// ═══════════════════════════════════════════════════════════════
function Card8() {
  return (
    <div className="flex flex-col gap-4">
      {features.map((f, i) => (
        <div
          key={i}
          className="group flex items-center gap-6 p-6 rounded-2xl bg-[#0c0c0c] border border-white/[0.04] hover:border-[#ff4500]/20 hover:bg-[#0e0e0e] transition-all duration-500"
        >
          <div className="shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff4500]/20 to-[#ff4500]/5 border border-[#ff4500]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <f.icon size={24} className="text-[#ff4500]" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white mb-1">{f.title}</h3>
            <p className="text-white/40 text-sm leading-relaxed">{f.description}</p>
          </div>

          <div className="shrink-0 hidden sm:block">
            <div className="w-10 h-10 rounded-full border border-white/[0.06] flex items-center justify-center group-hover:border-[#ff4500]/30 group-hover:bg-[#ff4500]/5 transition-all duration-300">
              <ArrowUpRight size={16} className="text-white/20 group-hover:text-[#ff4500] transition-colors" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CARD 9 — Glass Morphism with Blur Orb
// ═══════════════════════════════════════════════════════════════
function Card9() {
  const orbColors = ["#ff4500", "#ff6b35", "#ff8a65"];
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {features.map((f, i) => (
        <div
          key={i}
          className="group relative p-8 rounded-3xl backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] overflow-hidden transition-all duration-500"
        >
          {/* Blur orb */}
          <div
            className="absolute w-32 h-32 rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-all duration-700 -top-10 -right-10 group-hover:top-4 group-hover:right-4"
            style={{ background: orbColors[i] }}
          />

          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.06] backdrop-blur-sm flex items-center justify-center mb-6 group-hover:bg-white/[0.1] transition-colors">
              <f.icon size={22} className="text-white/80" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">{f.title}</h3>
            <p className="text-white/35 text-sm leading-relaxed">{f.description}</p>

            {/* Tag pill */}
            <div className="mt-6 inline-flex items-center px-3 py-1 rounded-full bg-white/[0.04] text-[10px] text-white/40 tracking-widest uppercase">
              {f.tag}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CARD 10 — Bento Grid with Metric Accent
// ═══════════════════════════════════════════════════════════════
function Card10() {
  const metrics = ["50K+", "< 2s", "24/7"];
  const metricLabels = ["Reddit threads", "Response time", "Availability"];
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {features.map((f, i) => (
        <div
          key={i}
          className={cn(
            "group relative rounded-2xl bg-[#0e0e0e] border border-white/[0.04] hover:border-[#ff4500]/20 overflow-hidden transition-all duration-500",
            i === 0 && "md:col-span-2 md:row-span-1",
            i === 1 && "md:col-span-1 md:row-span-2",
            i === 2 && "md:col-span-2"
          )}
        >
          <div className="p-8 h-full flex flex-col">
            <div className="flex items-start justify-between mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#ff4500]/10 flex items-center justify-center">
                <f.icon size={18} className="text-[#ff4500]" />
              </div>
              <span className="font-mono text-3xl font-black text-[#ff4500]/20 group-hover:text-[#ff4500]/40 transition-colors">
                {metrics[i]}
              </span>
            </div>

            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">{f.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{f.description}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between">
              <span className="text-[10px] text-white/25 tracking-widest uppercase">
                {metricLabels[i]}
              </span>
              <div className="w-2 h-2 rounded-full bg-green-500/50 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE — Showcase all 10
// ═══════════════════════════════════════════════════════════════
const cardVariants = [
  { id: 1, name: "Numbered Editorial", desc: "Offset grid, giant faded numbers, expanding accent line", component: Card1 },
  { id: 2, name: "Animated Gradient Border", desc: "Rotating conic gradient border on hover, dark interior", component: Card2 },
  { id: 3, name: "3D Tilt", desc: "Perspective tilt following cursor, depth layers via translateZ", component: Card3 },
  { id: 4, name: "Split Accent Strip", desc: "Left color strip, arrow icon, numbered bottom", component: Card4 },
  { id: 5, name: "Terminal / Code", desc: "Monospace header bar, code syntax styling, active indicator", component: Card5 },
  { id: 6, name: "Spotlight Reveal", desc: "Radial gradient follows mouse cursor, subtle glow", component: Card6 },
  { id: 7, name: "Large Icon Background", desc: "Giant faded icon as bg decoration, pill badge tags", component: Card7 },
  { id: 8, name: "Horizontal Layout", desc: "Full-width rows, icon left, arrow button right", component: Card8 },
  { id: 9, name: "Glass Morphism + Orb", desc: "Frosted glass, moving blur orb on hover, tag pills", component: Card9 },
  { id: 10, name: "Bento Grid + Metrics", desc: "Asymmetric bento layout, large metric numbers, status dots", component: Card10 },
];

export default function CardsShowcase() {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-10">
        <h1 className="font-syne text-4xl sm:text-5xl font-bold mb-3">
          Feature Card Designs
        </h1>
        <p className="text-white/40 text-lg max-w-xl">
          10 card variants for the features section. Pick your favorite.
        </p>
      </div>

      {/* Cards showcase */}
      <div className="max-w-6xl mx-auto px-6 pb-32 space-y-24">
        {cardVariants.map(({ id, name, desc, component: CardComponent }) => (
          <section key={id}>
            <div className="mb-8 flex items-baseline gap-4">
              <span className="font-mono text-sm text-[#ff4500] bg-[#ff4500]/10 px-3 py-1 rounded-lg">
                #{id}
              </span>
              <div>
                <h2 className="text-xl font-bold text-white">{name}</h2>
                <p className="text-white/30 text-sm mt-1">{desc}</p>
              </div>
            </div>
            <CardComponent />
          </section>
        ))}
      </div>
    </div>
  );
}
