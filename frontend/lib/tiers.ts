export type UserRole = "free" | "pro" | "team" | "admin";

export interface TierLimits {
  maxMessagesPerDay: number;
  maxTokensPerDay: number;
  maxUploadsPerDay: number;
  maxUploadBytesPerDay: number;
  allowedModels: string[];
  allowedTools: string[];
}

const ALL_MODELS = [
  "gemini-2.5-flash",
  "gemini-3-flash",
  "gemini-3.1-pro",
  "gpt-5.4-mini",
  "gpt-5.4",
];

const ALL_TOOLS = ["search_reddit", "web_search"];

export const TIER_CONFIG: Record<UserRole, TierLimits> = {
  free: {
    maxMessagesPerDay: 100,
    maxTokensPerDay: 500000,
    maxUploadsPerDay: 50,
    maxUploadBytesPerDay: 100 * 1024 * 1024, // 100MB
    allowedModels: ["gemini-2.5-flash"],
    allowedTools: ALL_TOOLS,
  },
  pro: {
    maxMessagesPerDay: 1000,
    maxTokensPerDay: 5000000,
    maxUploadsPerDay: 200,
    maxUploadBytesPerDay: 1024 * 1024 * 1024, // 1GB
    allowedModels: ALL_MODELS,
    allowedTools: ALL_TOOLS,
  },
  team: {
    maxMessagesPerDay: 5000,
    maxTokensPerDay: 20000000,
    maxUploadsPerDay: 500,
    maxUploadBytesPerDay: 5 * 1024 * 1024 * 1024, // 5GB
    allowedModels: ALL_MODELS,
    allowedTools: ALL_TOOLS,
  },
  admin: {
    maxMessagesPerDay: Infinity,
    maxTokensPerDay: Infinity,
    maxUploadsPerDay: Infinity,
    maxUploadBytesPerDay: Infinity,
    allowedModels: ALL_MODELS,
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

export function isModelAllowed(role: UserRole, modelId: string): boolean {
  const tier = getTierLimits(role);
  return tier.allowedModels.includes(modelId);
}
