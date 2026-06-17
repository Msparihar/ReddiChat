"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { resetPassword } from "@/lib/auth/client";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";
import Link from "next/link";

function ResetPasswordContent() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");
  const urlError = searchParams.get("error");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const inputClass = cn(
    "w-full text-sm px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--rc-brand)]",
    isDark
      ? "bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500"
      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const result = await resetPassword({ newPassword, token: token! });
      if (result?.error) {
        setError(result.error.message ?? "Failed to reset password.");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
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
        {!token || urlError ? (
          <div className="text-center">
            <h1 className={cn("text-2xl font-bold mb-4", isDark ? "text-white" : "text-gray-900")}>
              Link invalid or expired
            </h1>
            <p className={cn("text-sm mb-6", isDark ? "text-gray-400" : "text-gray-600")}>
              This password reset link is invalid or has expired.
            </p>
            <Link
              href="/forgot-password"
              className="text-sm text-[var(--rc-brand)] hover:underline"
            >
              Request a new reset link
            </Link>
          </div>
        ) : success ? (
          <div className="text-center">
            <h1 className={cn("text-2xl font-bold mb-4", isDark ? "text-white" : "text-gray-900")}>
              Password updated
            </h1>
            <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
              Your password has been set. Redirecting you to sign in…
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className={cn("text-2xl font-bold mb-2", isDark ? "text-white" : "text-gray-900")}>
                Set new password
              </h1>
              <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-600")}>
                Choose a strong password of at least 8 characters.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="new-password" className="sr-only">New password</label>
                <input
                  id="new-password"
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="sr-only">Confirm new password</label>
                <input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg font-medium text-sm text-white bg-[var(--rc-brand)] hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "..." : "Set new password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0c0c0d]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
