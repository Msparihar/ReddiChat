"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

interface UsageData {
  usage: {
    messages: number;
    tokens: number;
    uploads: number;
    uploadBytes: number;
  };
  limits: {
    messages: number;
    tokens: number;
    uploads: number;
    uploadBytes: number;
  };
  resetAt: string;
}

export function useUsage() {
  return useQuery<UsageData>({
    queryKey: ["usage"],
    queryFn: async () => {
      const res = await fetch("/api/usage", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch usage");
      return res.json();
    },
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000,
  });
}

export function useInvalidateUsage() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["usage"] });
}
