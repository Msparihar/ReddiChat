"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bot,
  Github,
  Menu,
  X,
  User,
  ArrowRight,
  Sparkles,
  Search,
  MessageSquare,
  Zap,
} from "lucide-react";
import { useSession } from "@/lib/auth/client";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userLookupInput, setUserLookupInput] = useState("");
  const [showUserLookup, setShowUserLookup] = useState(false);
  const { data: session } = useSession();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();

  const isAuthenticated = !!session;

  const handleUserLookup = () => {
    if (userLookupInput.trim()) {
      router.push(`/u/${userLookupInput.trim()}`);
      setShowUserLookup(false);
      setUserLookupInput("");
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push("/chat");
    } else {
      router.push("/login");
    }
  };

  return (
    <div
      className={cn(
        "min-h-screen",
        isDark
          ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
          : "bg-gradient-to-br from-gray-50 via-white to-gray-100"
      )}
    >
      {/* Header */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled
            ? cn(
                "backdrop-blur-md border-b shadow-2xl",
                isDark
                  ? "bg-slate-950/90 border-slate-800/50"
                  : "bg-white/90 border-gray-200/50"
              )
            : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3 group">
              <div className="relative p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Bot size={24} className="text-white" />
              </div>
              <span
                className={cn(
                  "text-xl font-bold group-hover:text-orange-300 transition-colors duration-300",
                  isDark ? "text-white" : "text-gray-900"
                )}
              >
                ReddiChat
              </span>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              {["Home", "Features"].map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    const element = document.getElementById(item.toLowerCase());
                    element?.scrollIntoView({ behavior: "smooth" });
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
              <button
                onClick={() => setShowUserLookup(true)}
                className={cn(
                  "relative hover:text-orange-400 transition-all duration-200 group py-2 flex items-center gap-1.5",
                  isDark ? "text-gray-300" : "text-gray-600"
                )}
              >
                <User size={16} />
                User Lookup
              </button>
            </nav>

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

              <button
                onClick={handleGetStarted}
                className="relative bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2 rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all duration-200 overflow-hidden group cursor-pointer"
              >
                <span className="relative z-10">
                  {isAuthenticated ? "Go to Chat" : "Get Started"}
                </span>
              </button>
            </div>

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

          {isMenuOpen && (
            <div
              className={cn(
                "md:hidden absolute top-16 left-0 right-0 backdrop-blur-md border-b animate-fade-in",
                isDark
                  ? "bg-slate-950/95 border-slate-800/50"
                  : "bg-white/95 border-gray-200/50"
              )}
            >
              <nav className="px-4 py-6 space-y-4">
                {["Home", "Features"].map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      const element = document.getElementById(
                        item.toLowerCase()
                      );
                      element?.scrollIntoView({ behavior: "smooth" });
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
                <div
                  className={cn(
                    "pt-4 border-t",
                    isDark ? "border-slate-800" : "border-gray-200"
                  )}
                >
                  <button
                    onClick={() => {
                      handleGetStarted();
                      setIsMenuOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
                  >
                    {isAuthenticated ? "Go to Chat" : "Get Started"}
                  </button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section
        id="home"
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
      >
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-400/5 rounded-full blur-3xl animate-pulse"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div
            className={cn(
              "inline-flex items-center space-x-2 backdrop-blur-md border border-orange-500/20 rounded-full px-6 py-3 mb-8 hover:border-orange-500/40 transition-all duration-300 hover:scale-105",
              isDark ? "bg-slate-800/30" : "bg-white/50"
            )}
          >
            <Sparkles size={16} className="text-orange-400 animate-pulse" />
            <span
              className={cn(
                "text-sm",
                isDark ? "text-gray-300" : "text-gray-600"
              )}
            >
              AI-powered Reddit insights
            </span>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>

          <h1
            className={cn(
              "text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-tight",
              isDark ? "text-white" : "text-gray-900"
            )}
          >
            Ask Reddit{" "}
            <span className="bg-gradient-to-r from-orange-400 via-red-500 to-orange-600 bg-clip-text text-transparent">
              Anything
            </span>
            <br />
            Get Smart Answers.
          </h1>

          <p
            className={cn(
              "text-lg sm:text-xl mb-10 max-w-3xl mx-auto leading-relaxed",
              isDark ? "text-gray-300" : "text-gray-600"
            )}
          >
            Powered by AI. Get instant, intelligent answers from Reddit&apos;s
            community. Perfect for when you need context or want to understand
            discussions better.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              onClick={handleGetStarted}
              className="group relative bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 flex items-center space-x-2 shadow-2xl shadow-orange-500/25 overflow-hidden cursor-pointer"
            >
              <span className="relative z-10">
                {isAuthenticated ? "Go to Chat" : "Start Chatting"}
              </span>
              <ArrowRight
                size={20}
                className="relative z-10 group-hover:translate-x-1 transition-transform duration-200"
              />
            </button>

            <button
              onClick={() => setShowUserLookup(true)}
              className="group relative px-8 py-4 rounded-xl font-semibold text-lg text-white border-2 border-orange-500/50 hover:border-orange-400 bg-orange-500/10 hover:bg-orange-500/20 transition-all duration-300 backdrop-blur-sm flex items-center space-x-2 overflow-hidden cursor-pointer"
            >
              <User size={20} className="relative z-10" />
              <span className="relative z-10">User Lookup</span>
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className={cn(
                "text-3xl sm:text-4xl font-bold mb-4",
                isDark ? "text-white" : "text-gray-900"
              )}
            >
              Powerful Features
            </h2>
            <p
              className={cn(
                "text-lg max-w-2xl mx-auto",
                isDark ? "text-gray-400" : "text-gray-600"
              )}
            >
              Everything you need to explore Reddit with AI assistance
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
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
            ].map((feature, index) => (
              <div
                key={index}
                className={cn(
                  "p-6 rounded-2xl border transition-all duration-300 hover:scale-105",
                  isDark
                    ? "bg-slate-900/50 border-slate-800 hover:border-orange-500/50"
                    : "bg-white border-gray-200 hover:border-orange-500/50 shadow-lg"
                )}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3
                  className={cn(
                    "text-xl font-semibold mb-2",
                    isDark ? "text-white" : "text-gray-900"
                  )}
                >
                  {feature.title}
                </h3>
                <p className={isDark ? "text-gray-400" : "text-gray-600"}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className={cn(
          "py-8 border-t",
          isDark ? "border-slate-800" : "border-gray-200"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="p-1.5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
                <Bot size={18} className="text-white" />
              </div>
              <span
                className={cn(
                  "font-semibold",
                  isDark ? "text-white" : "text-gray-900"
                )}
              >
                ReddiChat
              </span>
            </div>
            <p
              className={cn(
                "text-sm",
                isDark ? "text-gray-500" : "text-gray-400"
              )}
            >
              {new Date().getFullYear()} ReddiChat. AI-powered Reddit assistant.
            </p>
          </div>
        </div>
      </footer>

      {/* User Lookup Modal */}
      {showUserLookup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowUserLookup(false)}
        >
          <div
            className={cn(
              "w-full max-w-md mx-4 p-6 rounded-2xl border shadow-2xl",
              isDark
                ? "bg-slate-900 border-slate-700"
                : "bg-white border-gray-200"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                className={cn(
                  "text-xl font-semibold",
                  isDark ? "text-white" : "text-gray-900"
                )}
              >
                Reddit User Lookup
              </h2>
              <button
                onClick={() => setShowUserLookup(false)}
                className={cn(
                  "p-1 rounded-lg transition-colors",
                  isDark
                    ? "hover:bg-slate-800 text-gray-400"
                    : "hover:bg-gray-100 text-gray-600"
                )}
              >
                <X size={20} />
              </button>
            </div>

            <p
              className={cn(
                "text-sm mb-4",
                isDark ? "text-gray-400" : "text-gray-600"
              )}
            >
              Enter a Reddit username to view their profile, posts, and comments.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUserLookup();
              }}
              className="space-y-4"
            >
              <div className="relative">
                <span
                  className={cn(
                    "absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium",
                    isDark ? "text-gray-500" : "text-gray-400"
                  )}
                >
                  u/
                </span>
                <input
                  type="text"
                  value={userLookupInput}
                  onChange={(e) => setUserLookupInput(e.target.value)}
                  placeholder="username"
                  autoFocus
                  className={cn(
                    "w-full pl-8 pr-4 py-3 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/50",
                    isDark
                      ? "bg-slate-800 border-slate-700 text-white placeholder-gray-500"
                      : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"
                  )}
                />
              </div>

              <button
                type="submit"
                disabled={!userLookupInput.trim()}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-3 rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Search size={18} />
                Look Up User
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
