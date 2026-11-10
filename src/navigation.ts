import { cities, type CityId, type Lang } from "./content";
export type Navigation = { city: CityId | null; place: string | null };
export const initialNavigation = (): Navigation => {
  const p = new URLSearchParams(location.search);
  const city = cities.find((c) => c.id === p.get("city"));
  return {
    city: city?.id ?? null,
    place: city?.places.some((q) => q.id === p.get("place"))
      ? p.get("place")
      : null,
  };
};
export function navigationUrl(n: Navigation) {
  const url = new URL(location.href);
  url.searchParams.delete("city");
  url.searchParams.delete("place");
  if (n.city) url.searchParams.set("city", n.city);
  if (n.city && n.place) url.searchParams.set("place", n.place);
  return url.pathname + url.search + url.hash;
}
export function safeGet(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
export function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
export function readLanguage(): Lang {
  const s = safeGet("fold-language");
  return s === "ru" || s === "kk" ? s : "en";
}
export function readSaved(): string[] {
  try {
    const s = JSON.parse(safeGet("fold-saved") || "[]");
    const keys = new Set(
      cities.flatMap((c) => c.places.map((p) => c.id + "/" + p.id)),
    );
    return Array.isArray(s)
      ? [
          ...new Set(
            s.filter((v: unknown) => typeof v === "string" && keys.has(v)),
          ),
        ]
      : [];
  } catch {
    return [];
  }
}
