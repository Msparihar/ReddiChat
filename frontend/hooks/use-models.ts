"use client";

import { useQuery } from "@tanstack/react-query";
import { AIModel } from "@/lib/ai/models";

export function useModels() {
  return useQuery<AIModel[]>({
    queryKey: ["models"],
    queryFn: async () => {
      const res = await fetch("/api/models");
      if (!res.ok) throw new Error("Failed to fetch models");
      return res.json();
    },
    staleTime: 60 * 60 * 1000,
  });
}
