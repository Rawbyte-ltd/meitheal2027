import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";

/** The old moderation page. The reading desk (/desk) replaced it; old links and bookmarks land there. */
export default async function Admin({ searchParams }: { searchParams: Promise<{ key?: string; status?: string }> }) {
  const { key, status } = await searchParams;
  const qs = new URLSearchParams({ ...(key ? { key } : {}), ...(status ? { tab: status === "rejected" || status === "removed" || status === "approved" ? status : "pending" } : {}) });
  redirect(`/desk${qs.size ? `?${qs}` : ""}`);
}
