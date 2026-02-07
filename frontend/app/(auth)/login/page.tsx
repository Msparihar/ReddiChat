"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth/client";
import { SignInCard } from "@/components/auth/SignInCard";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const callbackUrl = searchParams.get("callbackUrl") || "/chat";

  useEffect(() => {
    if (session && !isPending) {
      router.push(callbackUrl);
    }
  }, [session, isPending, router, callbackUrl]);

  if (isPending) {
    return (
      <div
        className={cn(
          "min-h-screen flex items-center justify-center",
          isDark ? "bg-gray-950" : "bg-gray-50"
        )}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-h-screen flex items-center justify-center p-4",
        isDark
          ? "bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950"
          : "bg-gradient-to-br from-gray-50 via-white to-gray-100"
      )}
    >
      <SignInCard callbackURL={callbackUrl} />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-950">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
