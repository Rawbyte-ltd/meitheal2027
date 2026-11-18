import { coOf, headingIn } from "@/lib/i18n";
import { copybook, OG_SIZE } from "@/lib/og";
import { getStory } from "@/lib/stories";

export const alt = "A story in Meitheal 2027";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const s = await getStory((await params).id);
  if (!s || s.status !== "approved") return copybook({ kicker: "Meitheal 2027", year: "2027", title: "Ask them before the stories go.", line: "The 1937 Schools' Collection, done again." });
  const old = Boolean(s.source_url);
  const told = s.teller_name && s.teller_name !== "Name not given" ? `Told by ${s.teller_name}, ` : "";
  return copybook({
    kicker: `${old ? "Schools' Collection 1937–38" : "Meitheal 2027"} · ${headingIn(s, "en")}`,
    year: old ? "1937" : "2027",
    title: s.title,
    line: `${told}${s.townland_en}, ${coOf(s.county, "en")}`,
  });
}
