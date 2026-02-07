"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Search,
  MessageSquare,
  Zap,
  ArrowUpRight,
} from "lucide-react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from "motion/react";
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
// CARD 1 — 3D Flip Card (front/back)
// ═══════════════════════════════════════════════════════════════
function Card1() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ perspective: "1200px" }}>
      {features.map((f, i) => {
        const [flipped, setFlipped] = useState(false);
        return (
          <div
            key={i}
            className="relative h-[280px] cursor-pointer"
            onMouseEnter={() => setFlipped(true)}
            onMouseLeave={() => setFlipped(false)}
          >
            <motion.div
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              style={{ transformStyle: "preserve-3d" }}
              className="w-full h-full relative"
            >
              {/* Front */}
              <div
                className="absolute inset-0 rounded-2xl bg-[#0e0e0e] border border-white/[0.06] p-8 flex flex-col"
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="w-14 h-14 rounded-2xl bg-[#ff4500]/10 border border-[#ff4500]/15 flex items-center justify-center mb-6">
                  <f.icon size={24} className="text-[#ff4500]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed flex-1">{f.description}</p>
                <span className="text-[10px] text-white/20 tracking-widest uppercase mt-4">Hover to flip</span>
              </div>

              {/* Back */}
              <div
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#ff4500] to-[#ff6b35] p-8 flex flex-col items-center justify-center text-center"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <f.icon size={40} className="text-white/90 mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">{f.title}</h3>
                <p className="text-white/70 text-sm leading-relaxed max-w-[200px]">{f.description}</p>
              </div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CARD 2 — Parallax Depth Layers (multi-layer hover)
// ═══════════════════════════════════════════════════════════════
function ParallaxCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const bgX = useSpring(useTransform(mouseX, [-0.5, 0.5], [10, -10]), { stiffness: 150, damping: 20 });
  const bgY = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), { stiffness: 150, damping: 20 });
  const midX = useSpring(useTransform(mouseX, [-0.5, 0.5], [20, -20]), { stiffness: 150, damping: 20 });
  const midY = useSpring(useTransform(mouseY, [-0.5, 0.5], [20, -20]), { stiffness: 150, damping: 20 });
  const fgX = useSpring(useTransform(mouseX, [-0.5, 0.5], [35, -35]), { stiffness: 150, damping: 20 });
  const fgY = useSpring(useTransform(mouseY, [-0.5, 0.5], [35, -35]), { stiffness: 150, damping: 20 });

  const handleMouse = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleLeave = () => { mouseX.set(0); mouseY.set(0); };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      className="relative h-[280px] rounded-2xl bg-[#0a0a0a] border border-white/[0.05] overflow-hidden cursor-default"
    >
      {/* Layer 1: Background glow */}
      <motion.div
        style={{ x: bgX, y: bgY }}
        className="absolute inset-0"
      >
        <div className="absolute w-40 h-40 rounded-full bg-[#ff4500]/10 blur-[60px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </motion.div>

      {/* Layer 2: Icon */}
      <motion.div
        style={{ x: midX, y: midY }}
        className="absolute top-8 left-8"
      >
        <feature.icon size={100} strokeWidth={0.4} className="text-white/[0.04]" />
      </motion.div>

      {/* Layer 3: Content (moves most) */}
      <motion.div
        style={{ x: fgX, y: fgY }}
        className="absolute inset-0 p-8 flex flex-col justify-end"
      >
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-[#ff4500]/15 flex items-center justify-center">
            <feature.icon size={14} className="text-[#ff4500]" />
          </div>
          <span className="text-[10px] tracking-[0.2em] text-[#ff4500]/60 uppercase">{feature.tag}</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
        <p className="text-white/35 text-sm leading-relaxed">{feature.description}</p>
      </motion.div>
    </div>
  );
}

function Card2() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {features.map((f, i) => (
        <ParallaxCard key={i} feature={f} index={i} />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CARD 3 — Holographic Tilt (rainbow shimmer on tilt)
// ═══════════════════════════════════════════════════════════════
function HoloCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [12, -12]), { stiffness: 200, damping: 25 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-12, 12]), { stiffness: 200, damping: 25 });
  const sheenX = useTransform(x, [-0.5, 0.5], [-100, 200]);
  const sheenY = useTransform(y, [-0.5, 0.5], [-100, 200]);
  const [hovering, setHovering] = useState(false);

  const handleMouse = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleLeave = () => { x.set(0); y.set(0); setHovering(false); };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className="relative rounded-2xl bg-[#0c0c0c] border border-white/[0.06] overflow-hidden cursor-default"
    >
      {/* Holographic sheen */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
        style={{
          opacity: hovering ? 0.15 : 0,
          backgroundImage: `linear-gradient(
            115deg,
            transparent 20%,
            rgba(255,69,0,0.3) 36%,
            rgba(255,165,0,0.3) 42%,
            rgba(255,69,0,0.2) 48%,
            transparent 60%
          )`,
          backgroundSize: "200% 200%",
          backgroundPosition: useTransform(
            sheenX,
            (v) => `${v}% ${sheenY.get()}%`
          ) as any,
        }}
      />

      <div className="relative z-20 p-8">
        <div className="w-12 h-12 rounded-xl bg-[#ff4500]/10 border border-[#ff4500]/10 flex items-center justify-center mb-6" style={{ transform: "translateZ(30px)" }}>
          <feature.icon size={22} className="text-[#ff4500]" />
        </div>
        <h3 className="text-xl font-bold text-white mb-3" style={{ transform: "translateZ(20px)" }}>{feature.title}</h3>
        <p className="text-white/40 text-sm leading-relaxed" style={{ transform: "translateZ(10px)" }}>{feature.description}</p>
      </div>
    </motion.div>
  );
}

function Card3() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ perspective: "1000px" }}>
      {features.map((f, i) => (
        <HoloCard key={i} feature={f} index={i} />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CARD 4 — Liquid Fill from Bottom
// ═══════════════════════════════════════════════════════════════
function Card4() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {features.map((f, i) => {
        const [hovered, setHovered] = useState(false);
        return (
          <div
            key={i}
            className="group relative rounded-2xl bg-[#0a0a0a] border border-white/[0.05] overflow-hidden cursor-default"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            {/* Liquid fill */}
            <motion.div
              initial={{ height: "0%" }}
              animate={{ height: hovered ? "100%" : "0%" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#ff4500] to-[#ff6b35] z-0"
            />

            {/* Wave SVG at top of liquid */}
            <motion.div
              initial={{ bottom: "0%" }}
              animate={{ bottom: hovered ? "95%" : "0%" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-0 right-0 h-4 z-[1]"
            >
              <svg viewBox="0 0 400 20" className="w-full h-full" preserveAspectRatio="none">
                <path
                  d="M0,10 C100,20 200,0 300,10 C350,15 380,8 400,10 L400,20 L0,20 Z"
                  fill={hovered ? "#ff4500" : "transparent"}
                  className="transition-colors duration-300"
                />
              </svg>
            </motion.div>

            <div className="relative z-10 p-8">
              <div className="w-12 h-12 rounded-xl bg-[#ff4500]/10 group-hover:bg-white/20 border border-[#ff4500]/10 group-hover:border-white/20 flex items-center justify-center mb-6 transition-colors duration-500">
                <f.icon size={22} className="text-[#ff4500] group-hover:text-white transition-colors duration-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
              <p className="text-white/40 group-hover:text-white/80 text-sm leading-relaxed transition-colors duration-500">{f.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CARD 5 — Magnetic Pull (card drifts toward cursor)
// ═══════════════════════════════════════════════════════════════
function MagneticCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(0, { stiffness: 120, damping: 15 });
  const y = useSpring(0, { stiffness: 120, damping: 15 });

  const handleMouse = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * 0.15);
    y.set((e.clientY - cy) * 0.15);
  };
  const handleLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ x, y }}
      className="cursor-default"
    >
      {children}
    </motion.div>
  );
}

function Card5() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {features.map((f, i) => (
        <MagneticCard key={i}>
          <div className="group p-8 rounded-2xl bg-[#0c0c0c] border border-white/[0.05] hover:border-[#ff4500]/20 transition-colors duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff4500] to-[#ff6b35] flex items-center justify-center group-hover:shadow-[0_0_25px_rgba(255,69,0,0.3)] transition-shadow duration-500">
                <f.icon size={18} className="text-white" />
              </div>
              <span className="text-xs text-[#ff4500]/40 tracking-[0.2em] uppercase">{f.tag}</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
            <p className="text-white/40 text-sm leading-relaxed">{f.description}</p>
          </div>
        </MagneticCard>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CARD 6 — Stacked Deck (fan out on hover)
// ═══════════════════════════════════════════════════════════════
function Card6() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {features.map((f, i) => (
        <div
          key={i}
          className="relative h-[280px]"
          onMouseEnter={() => setHoveredIdx(i)}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {/* Shadow cards behind */}
          {[2, 1].map((layer) => (
            <motion.div
              key={layer}
              animate={{
                rotate: hoveredIdx === i ? layer * 3 : 0,
                y: hoveredIdx === i ? layer * -4 : 0,
                x: hoveredIdx === i ? layer * 6 : 0,
                scale: 1 - layer * 0.03,
              }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 rounded-2xl bg-[#0e0e0e] border border-white/[0.03]"
              style={{ zIndex: 10 - layer }}
            />
          ))}

          {/* Main card */}
          <motion.div
            animate={{
              rotate: hoveredIdx === i ? -2 : 0,
              y: hoveredIdx === i ? 4 : 0,
            }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 rounded-2xl bg-[#111] border border-white/[0.06] p-8 flex flex-col z-20 hover:border-[#ff4500]/20 transition-colors duration-300"
          >
            <div className="w-12 h-12 rounded-xl bg-[#ff4500]/10 border border-[#ff4500]/15 flex items-center justify-center mb-6">
              <f.icon size={22} className="text-[#ff4500]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
            <p className="text-white/40 text-sm leading-relaxed flex-1">{f.description}</p>
          </motion.div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CARD 7 — Expanding Ring Pulse on Hover
// ═══════════════════════════════════════════════════════════════
function Card7() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {features.map((f, i) => {
        const [hovered, setHovered] = useState(false);
        return (
          <div
            key={i}
            className="group relative p-8 rounded-2xl bg-[#0a0a0a] border border-white/[0.05] overflow-hidden cursor-default"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            {/* Concentric expanding rings */}
            <AnimatePresence>
              {hovered && [0, 1, 2].map((ring) => (
                <motion.div
                  key={ring}
                  initial={{ scale: 0, opacity: 0.3 }}
                  animate={{ scale: 3, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 1.5,
                    delay: ring * 0.3,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                  className="absolute top-8 left-8 w-14 h-14 rounded-full border border-[#ff4500]/30 pointer-events-none"
                />
              ))}
            </AnimatePresence>

            <div className="relative z-10">
              <div className="w-14 h-14 rounded-full bg-[#ff4500]/10 border border-[#ff4500]/15 flex items-center justify-center mb-6 group-hover:bg-[#ff4500]/20 transition-colors">
                <f.icon size={22} className="text-[#ff4500]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{f.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CARD 8 — Reveal Slide (content slides up on hover)
// ═══════════════════════════════════════════════════════════════
function Card8() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {features.map((f, i) => {
        const [hovered, setHovered] = useState(false);
        return (
          <div
            key={i}
            className="group relative h-[280px] rounded-2xl bg-[#0c0c0c] border border-white/[0.05] overflow-hidden cursor-default"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            {/* Default: centered icon + title */}
            <motion.div
              animate={{ y: hovered ? -40 : 0, opacity: hovered ? 0 : 1 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff4500]/20 to-[#ff4500]/5 flex items-center justify-center mb-5">
                <f.icon size={28} className="text-[#ff4500]" />
              </div>
              <h3 className="text-xl font-bold text-white">{f.title}</h3>
            </motion.div>

            {/* Reveal: full content slides up */}
            <motion.div
              animate={{ y: hovered ? 0 : 60, opacity: hovered ? 1 : 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 p-8 flex flex-col justify-center bg-gradient-to-t from-[#ff4500]/10 to-[#0c0c0c]"
            >
              <div className="w-10 h-10 rounded-lg bg-[#ff4500]/15 flex items-center justify-center mb-4">
                <f.icon size={18} className="text-[#ff4500]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{f.description}</p>
              <div className="mt-4 flex items-center gap-1.5 text-[#ff4500] text-xs font-medium">
                Explore <ArrowUpRight size={12} />
              </div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CARD 9 — Glitch / Distort on Hover
// ═══════════════════════════════════════════════════════════════
function Card9() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {features.map((f, i) => {
        const [hovered, setHovered] = useState(false);
        return (
          <div
            key={i}
            className="group relative p-8 rounded-2xl bg-[#0a0a0a] border border-white/[0.05] overflow-hidden cursor-default"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            {/* Glitch layers */}
            <AnimatePresence>
              {hovered && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: [0, 0.5, 0, 0.3, 0],
                      x: [0, -3, 2, -1, 0],
                      scaleY: [1, 1.01, 0.99, 1.005, 1],
                    }}
                    transition={{ duration: 0.3, repeat: 2 }}
                    className="absolute inset-0 rounded-2xl bg-[#ff4500]/5 z-0"
                  />
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: [0, 0.3, 0],
                      x: [0, 2, -2, 0],
                    }}
                    transition={{ duration: 0.2, delay: 0.1, repeat: 1 }}
                    className="absolute inset-0 border border-[#ff4500]/30 rounded-2xl z-0"
                    style={{ clipPath: "inset(30% 0 40% 0)" }}
                  />
                </>
              )}
            </AnimatePresence>

            {/* Border glow after glitch */}
            <motion.div
              animate={{ opacity: hovered ? 1 : 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="absolute inset-0 rounded-2xl border border-[#ff4500]/25 z-0"
            />

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <f.icon size={24} className="text-[#ff4500]" />
                <div className="h-px flex-1 bg-white/[0.04] group-hover:bg-[#ff4500]/20 transition-colors duration-700" />
                <span className="font-mono text-xs text-white/20 group-hover:text-[#ff4500]/50 transition-colors">0{i + 1}</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{f.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CARD 10 — Orbit Ring (icon orbits card border)
// ═══════════════════════════════════════════════════════════════
function Card10() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {features.map((f, i) => {
        const [hovered, setHovered] = useState(false);
        return (
          <div
            key={i}
            className="group relative p-8 rounded-2xl bg-[#0a0a0a] border border-white/[0.05] hover:border-[#ff4500]/15 overflow-visible cursor-default transition-colors duration-500"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            {/* Orbiting dot */}
            <motion.div
              animate={hovered ? { rotate: 360 } : { rotate: 0 }}
              transition={hovered ? { duration: 3, repeat: Infinity, ease: "linear" } : { duration: 0.5 }}
              className="absolute inset-[-6px] pointer-events-none z-20"
              style={{ transformOrigin: "center center" }}
            >
              <div className="absolute top-[-3px] left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#ff4500] shadow-[0_0_12px_rgba(255,69,0,0.6)]" />
            </motion.div>

            {/* Dashed border that appears on hover */}
            <motion.div
              animate={{ opacity: hovered ? 0.3 : 0 }}
              className="absolute inset-[-6px] rounded-[20px] border border-dashed border-[#ff4500]/30 pointer-events-none"
            />

            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-[#ff4500]/10 border border-[#ff4500]/10 flex items-center justify-center mb-6">
                <f.icon size={22} className="text-[#ff4500]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{f.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
const cardVariants = [
  { id: 1, name: "3D Flip Card", desc: "Full card flips on hover revealing orange gradient back", component: Card1 },
  { id: 2, name: "Parallax Depth Layers", desc: "Background, icon, and content move at different speeds on mouse", component: Card2 },
  { id: 3, name: "Holographic Tilt", desc: "3D tilt with rainbow/orange sheen that shifts with cursor", component: Card3 },
  { id: 4, name: "Liquid Fill", desc: "Orange liquid fills card from bottom on hover with wave edge", component: Card4 },
  { id: 5, name: "Magnetic Pull", desc: "Entire card drifts toward cursor with spring physics", component: Card5 },
  { id: 6, name: "Stacked Deck", desc: "Shadow cards fan out behind on hover like a card deck", component: Card6 },
  { id: 7, name: "Ring Pulse", desc: "Concentric rings pulse outward from icon on hover", component: Card7 },
  { id: 8, name: "Reveal Slide", desc: "Minimal icon+title transitions to full content on hover", component: Card8 },
  { id: 9, name: "Glitch Distort", desc: "Brief glitch/distort animation on hover, then settles with glow", component: Card9 },
  { id: 10, name: "Orbit Ring", desc: "Glowing dot orbits around card border continuously on hover", component: Card10 },
];

export default function Cards2Showcase() {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans">
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-10">
        <h1 className="font-syne text-4xl sm:text-5xl font-bold mb-3">
          Motion & 3D Cards
        </h1>
        <p className="text-white/40 text-lg max-w-xl">
          10 more variants — heavy on motion, 3D, and interactive effects.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-32 space-y-28">
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
