export interface AIModel {
  id: string;
  displayName: string;
  provider: "google" | "openai";
  modelId: string;
  description: string;
}

export const AI_MODELS: AIModel[] = [
  {
    id: "gemini-2.5-flash",
    displayName: "Gemini 2.5 Flash",
    provider: "google",
    modelId: "gemini-2.5-flash",
    description: "Fast & efficient",
  },
  {
    id: "gemini-3-flash",
    displayName: "Gemini 3 Flash",
    provider: "google",
    modelId: "gemini-3-flash-preview",
    description: "Pro-level speed",
  },
  {
    id: "gemini-3.1-pro",
    displayName: "Gemini 3.1 Pro",
    provider: "google",
    modelId: "gemini-3.1-pro-preview",
    description: "Most capable",
  },
  {
    id: "gpt-5.4-mini",
    displayName: "GPT-5.4 Mini",
    provider: "openai",
    modelId: "gpt-5.4-mini",
    description: "Fast & affordable",
  },
  {
    id: "gpt-5.4",
    displayName: "GPT-5.4",
    provider: "openai",
    modelId: "gpt-5.4",
    description: "Flagship reasoning",
  },
];

export const DEFAULT_MODEL_ID = "gemini-2.5-flash";

export function getModelById(id: string): AIModel | undefined {
  return AI_MODELS.find((m) => m.id === id);
}
