import { AIModel } from "./ai/models";

export type UserRole = "free" | "pro" | "team" | "admin";

export interface TierLimits {
  maxMessagesPerDay: number;
  maxTokensPerDay: number;
  maxUploadsPerDay: number;
  maxUploadBytesPerDay: number;
  allowedTierClasses: ("fast" | "flagship")[];
  allowedTools: string[];
}

const ALL_TOOLS = ["search_reddit", "web_search"];

export const TIER_CONFIG: Record<UserRole, TierLimits> = {
  free: {
    maxMessagesPerDay: 100,
    maxTokensPerDay: 500000,
    maxUploadsPerDay: 50,
    maxUploadBytesPerDay: 100 * 1024 * 1024,
    allowedTierClasses: ["fast"],
    allowedTools: ALL_TOOLS,
  },
  pro: {
    maxMessagesPerDay: 1000,
    maxTokensPerDay: 5000000,
    maxUploadsPerDay: 200,
    maxUploadBytesPerDay: 1024 * 1024 * 1024,
    allowedTierClasses: ["fast", "flagship"],
    allowedTools: ALL_TOOLS,
  },
  team: {
    maxMessagesPerDay: 5000,
    maxTokensPerDay: 20000000,
    maxUploadsPerDay: 500,
    maxUploadBytesPerDay: 5 * 1024 * 1024 * 1024,
    allowedTierClasses: ["fast", "flagship"],
    allowedTools: ALL_TOOLS,
  },
  admin: {
    maxMessagesPerDay: Infinity,
    maxTokensPerDay: Infinity,
    maxUploadsPerDay: Infinity,
    maxUploadBytesPerDay: Infinity,
    allowedTierClasses: ["fast", "flagship"],
    allowedTools: ALL_TOOLS,
  },
};

export function getTierLimits(role: UserRole): TierLimits {
  return TIER_CONFIG[role] || TIER_CONFIG.free;
}

export function getTierDisplayName(role: UserRole): string {
  const names: Record<UserRole, string> = {
    free: "Free",
    pro: "Pro",
    team: "Team",
    admin: "Admin",
  };
  return names[role] || "Free";
}

export function isModelAllowedForRole(role: UserRole, model: AIModel): boolean {
  return getTierLimits(role).allowedTierClasses.includes(model.tierClass);
}
