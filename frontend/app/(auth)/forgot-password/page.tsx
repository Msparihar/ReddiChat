"use client";

import { Suspense, useState } from "react";
import { requestPasswordReset } from "@/lib/auth/client";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";
import Link from "next/link";

function ForgotPasswordContent() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNetworkError(null);
    setLoading(true);
    try {
      await requestPasswordReset({ email, redirectTo: "/reset-password" });
      setSubmitted(true);
    } catch (err) {
      setNetworkError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "min-h-screen flex items-center justify-center p-4",
        isDark
          ? "bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950"
          : "bg-gradient-to-br from-gray-50 via-white to-gray-100"
      )}
    >
      <div
        className={cn(
          "w-full max-w-md p-8 rounded-2xl border",
          isDark
            ? "bg-gray-900/50 border-gray-800"
            : "bg-white border-gray-200 shadow-lg"
        )}
      >
        <div className="text-center mb-8">
          <h1 className={cn("text-2xl font-bold mb-2", isDark ? "text-white" : "text-gray-900")}>
            Reset your password
          </h1>
          <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {submitted ? (
          <div className={cn("text-sm text-center py-4", isDark ? "text-gray-300" : "text-gray-700")}>
            If an account exists for that email, a reset link is on its way.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={cn(
                  "w-full text-sm px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--rc-brand)]",
                  isDark
                    ? "bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                )}
              />
            </div>

            {networkError && (
              <p className="text-sm text-red-500">{networkError}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-medium text-sm text-white bg-[var(--rc-brand)] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "..." : "Send reset link"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className={cn("text-sm hover:underline", isDark ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-700")}
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0c0c0d]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
