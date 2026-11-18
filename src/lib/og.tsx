import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
const font = (f: string) => readFile(join(process.cwd(), "assets", "og", f));

/** A copybook page: cream paper, blue rules, the red margin, a kicker, a big title and a line under it. Fonts from assets/og. */
export async function copybook({ kicker, title, line, year }: { kicker: string; title: string; line: string; year: string }) {
  const [fraunces, inter] = await Promise.all([font("Fraunces-SemiBold.ttf"), font("Inter-SemiBold.ttf")]);
  const size = title.length > 60 ? 64 : title.length > 34 ? 80 : 96;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#f7f2e8", position: "relative", fontFamily: "Inter" }}>
        {Array.from({ length: 13 }, (_, i) => <div key={i} style={{ position: "absolute", left: 0, right: 0, top: 70 + i * 44, height: 2, background: "#dce5f1" }} />)}
        <div style={{ position: "absolute", top: 0, bottom: 0, left: 108, width: 4, background: "#d9534f" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px 56px 150px", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ fontSize: 24, letterSpacing: 4, color: "#d9534f", textTransform: "uppercase" }}>{kicker}</div>
            <div style={{ fontSize: 22, color: year === "1937" ? "#b8862b" : "#2b5fa8", border: `2px solid ${year === "1937" ? "#b8862b" : "#2b5fa8"}`, borderRadius: 999, padding: "2px 14px" }}>{year}</div>
          </div>
          <div style={{ display: "flex", fontFamily: "Fraunces", fontSize: size, lineHeight: 1.05, color: "#1f2733", maxWidth: 960 }}>{title}</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 28, color: "#6b6457" }}>
            <div style={{ display: "flex", maxWidth: 760 }}>{line}</div>
            <div style={{ display: "flex", fontFamily: "Fraunces", fontSize: 40, color: "#1f2733" }}>Meitheal&nbsp;<span style={{ color: "#d9534f" }}>2027</span></div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: [{ name: "Fraunces", data: fraunces, weight: 600, style: "normal" }, { name: "Inter", data: inter, weight: 600, style: "normal" }] },
  );
}
