"use client";

import { useState } from "react";
import { signIn, signUp } from "@/lib/auth/client";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface SignInCardProps {
  callbackURL?: string;
}

export function SignInCard({ callbackURL = "/chat" }: SignInCardProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    await signIn.social({
      provider: "google",
      callbackURL,
    });
  };

  const handleGitHubSignIn = async () => {
    await signIn.social({
      provider: "github",
      callbackURL,
    });
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        const result = await signIn.email({ email, password, callbackURL });
        if (result?.error) {
          setError(result.error.message ?? "Sign in failed");
        }
      } else {
        const result = await signUp.email({ email, password, name, callbackURL });
        if (result?.error) {
          setError(result.error.message ?? "Sign up failed");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = cn(
    "w-full text-sm px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--rc-brand)]",
    isDark
      ? "bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500"
      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
  );

  return (
    <div
      className={cn(
        "w-full max-w-md p-8 rounded-2xl border",
        isDark
          ? "bg-gray-900/50 border-gray-800"
          : "bg-white border-gray-200 shadow-lg"
      )}
    >
      <div className="text-center mb-8">
        <h1
          className={cn(
            "text-3xl font-bold mb-2",
            isDark ? "text-white" : "text-gray-900"
          )}
        >
          Welcome to{" "}
          <span className="text-[var(--rc-brand)]">
            ReddiChat
          </span>
        </h1>
        <p
          className={cn(
            "text-sm",
            isDark ? "text-gray-400" : "text-gray-600"
          )}
        >
          Sign in to start chatting with AI-powered Reddit insights
        </p>
      </div>

      <form onSubmit={handleEmailSubmit} className="space-y-3 mb-4">
        {mode === "signup" && (
          <div>
            <label htmlFor="name" className="sr-only">Full name</label>
            <input
              id="name"
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={inputClass}
            />
          </div>
        )}
        <div>
          <label htmlFor="email" className="sr-only">Email address</label>
          <input
            id="email"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="password" className="sr-only">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={inputClass}
          />
          {mode === "signin" && (
            <div className="flex justify-end mt-1">
              <Link
                href="/forgot-password"
                className={cn(
                  "text-xs hover:underline",
                  isDark ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"
                )}
              >
                Forgot password?
              </Link>
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg font-medium text-sm text-white bg-[var(--rc-brand)] hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "..." : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className={cn("text-xs text-center mb-4", isDark ? "text-gray-500" : "text-gray-400")}>
        {mode === "signin" ? (
          <>Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => { setMode("signup"); setError(null); }}
              className="underline hover:opacity-80"
            >
              Sign up
            </button>
          </>
        ) : (
          <>Already have an account?{" "}
            <button
              type="button"
              onClick={() => { setMode("signin"); setError(null); }}
              className="underline hover:opacity-80"
            >
              Sign in
            </button>
          </>
        )}
      </p>

      <div className="relative flex items-center my-4">
        <div className={cn("flex-1 border-t", isDark ? "border-gray-700" : "border-gray-200")} />
        <span className={cn("px-3 text-xs", isDark ? "text-gray-500" : "text-gray-400")}>or</span>
        <div className={cn("flex-1 border-t", isDark ? "border-gray-700" : "border-gray-200")} />
      </div>

      <div className="space-y-4">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className={cn(
            "w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors",
            isDark
              ? "bg-white text-gray-900 hover:bg-gray-100"
              : "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
          )}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <button
          type="button"
          onClick={handleGitHubSignIn}
          className={cn(
            "w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors",
            isDark
              ? "bg-gray-800 text-white hover:bg-gray-700"
              : "bg-gray-900 text-white hover:bg-gray-800"
          )}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"
            />
          </svg>
          Continue with GitHub
        </button>
      </div>

      <div className="mt-8 text-center">
        <p
          className={cn(
            "text-xs",
            isDark ? "text-gray-500" : "text-gray-400"
          )}
        >
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
