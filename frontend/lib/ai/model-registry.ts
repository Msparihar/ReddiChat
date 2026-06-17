import {
  AIModel,
  FALLBACK_MODELS,
  filterGoogleModels,
  filterOpenAIModels,
  sortModels,
  pickDefaultModelId,
} from "./models";

const cache: { data: AIModel[] | null; ts: number } = { data: null, ts: 0 };
const TTL_MS = 60 * 60 * 1000;

async function fetchGoogleModels(): Promise<AIModel[]> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return [];
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${key}&pageSize=200`
  );
  if (!res.ok) throw new Error(`Google models API ${res.status}`);
  const json = await res.json();
  return filterGoogleModels(json.models ?? []);
}

async function fetchOpenAIModels(): Promise<AIModel[]> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return [];
  const res = await fetch("https://api.openai.com/v1/models", {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`OpenAI models API ${res.status}`);
  const json = await res.json();
  const ids: string[] = (json.data ?? []).map((m: { id: string }) => m.id);
  return filterOpenAIModels(ids);
}

export async function getModels(): Promise<AIModel[]> {
  if (cache.data && Date.now() - cache.ts < TTL_MS) {
    return cache.data;
  }

  const [googleResult, openaiResult] = await Promise.allSettled([
    fetchGoogleModels(),
    fetchOpenAIModels(),
  ]);

  const google = googleResult.status === "fulfilled" ? googleResult.value : [];
  const openai = openaiResult.status === "fulfilled" ? openaiResult.value : [];

  if (google.length === 0 && openai.length === 0) {
    return cache.data ?? FALLBACK_MODELS;
  }

  const combined = [...google, ...openai];
  const seen = new Set<string>();
  const deduped = combined.filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });

  const result = sortModels(deduped);
  cache.data = result;
  cache.ts = Date.now();
  return result;
}

export async function resolveModel(id: string | null | undefined): Promise<AIModel> {
  const models = await getModels();
  const found = models.find((m) => m.id === id);
  if (found) return found;
  const defaultId = pickDefaultModelId(models);
  return models.find((m) => m.id === defaultId) ?? FALLBACK_MODELS[0];
}
