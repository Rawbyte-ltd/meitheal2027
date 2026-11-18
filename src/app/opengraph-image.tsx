import { copybook, OG_SIZE } from "@/lib/og";

export const alt = "Meitheal 2027: the Schools' Collection, done again";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return copybook({ kicker: "Bailiúchán na Scol · 1937 · 2027", year: "2027", title: "Ask them before the stories go.", line: "The 1937 Schools' Collection, done again. Free for every family and school." });
}
