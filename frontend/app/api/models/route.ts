import { getModels } from "@/lib/ai/model-registry";

export const dynamic = "force-dynamic";

export async function GET() {
  const models = await getModels();
  return Response.json(models);
}
