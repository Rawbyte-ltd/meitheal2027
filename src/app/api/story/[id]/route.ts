import { getStory } from "@/lib/stories";
export const dynamic = "force-dynamic";
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const s = await getStory(id);
  if (!s || s.status !== "approved") return Response.json({ error: "No such story" }, { status: 404 });
  return Response.json(s, { headers: { "Cache-Control": "public, max-age=300" } });
}
