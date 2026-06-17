export interface AIModel {
  id: string;
  displayName: string;
  provider: "google" | "openai";
  modelId: string;
  description: string;
  tierClass: "fast" | "flagship";
}

export const FALLBACK_MODELS: AIModel[] = [
  {
    id: "gemini-2.5-flash",
    displayName: "Gemini 2.5 Flash",
    provider: "google",
    modelId: "gemini-2.5-flash",
    description: "Fast & efficient",
    tierClass: "fast",
  },
  {
    id: "gemini-3-flash",
    displayName: "Gemini 3 Flash",
    provider: "google",
    modelId: "gemini-3-flash-preview",
    description: "Pro-level speed",
    tierClass: "fast",
  },
  {
    id: "gemini-3.1-pro",
    displayName: "Gemini 3.1 Pro",
    provider: "google",
    modelId: "gemini-3.1-pro-preview",
    description: "Most capable",
    tierClass: "flagship",
  },
  {
    id: "gpt-5.4-mini",
    displayName: "GPT-5.4 Mini",
    provider: "openai",
    modelId: "gpt-5.4-mini",
    description: "Fast & affordable",
    tierClass: "fast",
  },
  {
    id: "gpt-5.4",
    displayName: "GPT-5.4",
    provider: "openai",
    modelId: "gpt-5.4",
    description: "Flagship reasoning",
    tierClass: "flagship",
  },
];

export const DEFAULT_MODEL_ID = "gemini-2.5-flash";

export function getModelById(id: string, models: AIModel[] = FALLBACK_MODELS): AIModel | undefined {
  return models.find((m) => m.id === id);
}

const GOOGLE_NOISE_PATTERNS = [
  "image", "tts", "audio", "robotics", "computer-use",
  "deep-research", "embedding", "aqa", "customtools",
  "nano-banana", "lyria",
];

export function filterGoogleModels(raw: any[]): AIModel[] {
  return raw
    .filter((m) => {
      if (!Array.isArray(m.supportedGenerationMethods)) return false;
      if (!m.supportedGenerationMethods.includes("generateContent")) return false;
      if (typeof m.name !== "string") return false;
      if (!m.name.startsWith("models/gemini-")) return false;
      const lower = m.name.toLowerCase();
      return !GOOGLE_NOISE_PATTERNS.some((p) => lower.includes(p));
    })
    .map((m) => {
      const modelId: string = m.name.replace(/^models\//, "");
      const isFlashOrLite = modelId.includes("flash") || modelId.includes("lite");
      return {
        id: modelId,
        modelId,
        displayName: m.displayName ?? modelId,
        description: m.description ?? "",
        provider: "google" as const,
        tierClass: (isFlashOrLite ? "fast" : "flagship") as "fast" | "flagship",
      };
    });
}

function prettifyOpenAIId(id: string): string {
  if (id === "o4-mini") return "o4 Mini";
  return id
    .replace(/^gpt-/, "GPT-")
    .replace(/-(mini|nano|pro)$/, (_, s) => " " + s.charAt(0).toUpperCase() + s.slice(1));
}

function openAIDescription(id: string): string {
  if (id.includes("nano")) return "Fastest & cheapest";
  if (id.includes("mini")) return "Fast & affordable";
  if (id.includes("pro")) return "Deepest reasoning";
  return "Flagship reasoning";
}

const OPENAI_CHAT_PATTERN = /^(gpt-5(\.\d+)?|o4)(-(mini|nano|pro))?$/;

export function filterOpenAIModels(ids: string[]): AIModel[] {
  return ids
    .filter((id) => OPENAI_CHAT_PATTERN.test(id))
    .map((id) => ({
      id,
      modelId: id,
      displayName: prettifyOpenAIId(id),
      description: openAIDescription(id),
      provider: "openai" as const,
      tierClass: (id.includes("mini") || id.includes("nano") ? "fast" : "flagship") as "fast" | "flagship",
    }));
}

function parseGoogleVersion(id: string): number {
  // gemini-flash-latest → Infinity (alias sorts to top)
  if (id.endsWith("-latest")) return Infinity;
  // extract version number like 2.5, 3, 3.1
  const match = id.match(/gemini-(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

function parseOpenAIVersion(id: string): number {
  if (id.endsWith("-latest")) return Infinity;
  if (id.startsWith("o4")) return -1; // separate bucket
  const match = id.match(/gpt-(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

export function sortModels(models: AIModel[]): AIModel[] {
  const google = models.filter((m) => m.provider === "google");
  const openai = models.filter((m) => m.provider === "openai");

  google.sort((a, b) => {
    const diff = parseGoogleVersion(b.id) - parseGoogleVersion(a.id);
    return diff !== 0 ? diff : a.id.localeCompare(b.id);
  });

  openai.sort((a, b) => {
    const diff = parseOpenAIVersion(b.id) - parseOpenAIVersion(a.id);
    return diff !== 0 ? diff : a.id.localeCompare(b.id);
  });

  return [...google, ...openai];
}

export function pickDefaultModelId(models: AIModel[]): string {
  const latestAlias = models.find((m) => m.id === "gemini-flash-latest");
  if (latestAlias) return latestAlias.id;
  const firstFastGoogle = models.find((m) => m.provider === "google" && m.tierClass === "fast");
  if (firstFastGoogle) return firstFastGoogle.id;
  if (models.length > 0) return models[0].id;
  return DEFAULT_MODEL_ID;
}
