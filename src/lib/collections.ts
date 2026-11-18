/**
 * The four collections, after dúchas.ie. They are views of one body of stories, not a choice the contributor makes:
 * Schools' and Main are decided by who collected it; Photographic and Audio are every story with a photograph or a recording.
 */
export type Collection = { slug: "schools" | "main" | "photo" | "audio"; name: string; ga: string; blurb: string; view: "cards" | "grid" | "listen"; mode?: "write" | "record" | "photo" };
export const COLLECTIONS: Collection[] = [
  { slug: "schools", name: "The Schools' Collection 2027", ga: "Bailiúchán na Scol 2027", blurb: "Collected by children from their elders, as in 1937. The heart of the project.", view: "cards", mode: "write" },
  { slug: "main", name: "The Main Collection", ga: "An Príomhbhailiúchán", blurb: "Collected by adults: families, historical societies, Men's Sheds, active retirement groups.", view: "cards", mode: "write" },
  { slug: "photo", name: "The Photographic Collection", ga: "An Bailiúchán Grianghraf", blurb: "Every photograph in the collection, with the story behind it: the forge, the churn, the ration book, the road before it was tarred.", view: "grid", mode: "photo" },
  { slug: "audio", name: "The Audio Collection", ga: "An Bailiúchán Fuaime", blurb: "The voices themselves. Every recording in the collection, with a note of what is on it.", view: "listen", mode: "record" },
];
export const collectionBySlug = (s: string) => COLLECTIONS.find(c => c.slug === s) ?? null;
/** Provenance from the collector: a child, or anyone naming a school, is the Schools' Collection; otherwise the Main Collection. */
export const provenance = (collectorAge: string | null, school: string | null): "schools" | "main" => (collectorAge && collectorAge !== "adult") || (school && school.trim()) ? "schools" : "main";
