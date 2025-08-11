import { ServiceId } from "./services";

const API_BASE = "https://api.themoviedb.org/3";

const PROVIDER_HOME: Record<ServiceId, string> = {
  netflix: "https://www.netflix.com/",
  prime: "https://www.primevideo.com/",
  disney: "https://www.disneyplus.com/",
  hulu: "https://www.hulu.com/",
  appletv: "https://tv.apple.com/",
  max: "https://www.max.com/",
};

function nameToServiceId(name?: string): ServiceId | null {
  if (!name) return null;
  const n = name.toLowerCase();
  if (n.includes("netflix")) return "netflix";
  if (n.includes("amazon") || n.includes("prime video") || n === "prime video") return "prime";
  if (n.includes("disney")) return "disney";
  if (n.includes("hulu")) return "hulu";
  if (n.includes("apple tv")) return "appletv";
  if (n.includes("hbo max") || n === "max" || n.includes("max")) return "max";
  return null;
}

async function fetchJson(path: string, token: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`TMDB error ${res.status}: ${text}`);
  }
  return res.json();
}

export type SearchSelected = Set<ServiceId>;

export async function searchTitle(query: string, region: string, selected: SearchSelected, token: string) {
  if (!token) throw new Error("TMDB token missing");

  const q = encodeURIComponent(query);
  const search = await fetchJson(`/search/multi?query=${q}&include_adult=false`, token);
  const results: any[] = Array.isArray(search?.results) ? search.results : [];
  const primary = results.find(r => r.media_type === "movie" || r.media_type === "tv") || results[0];

  if (!primary) {
    return {
      title: query,
      type: "Movie" as const,
      available: false,
      alternatives: [],
      updatedAt: "just now",
    };
  }

  const isMovie = primary.media_type === "movie" || !!primary.title;
  const id = primary.id;
  const type = isMovie ? "Movie" : "TV";
  const title: string = isMovie ? (primary.title || primary.original_title) : (primary.name || primary.original_name);
  const year = (() => {
    const d = isMovie ? primary.release_date : primary.first_air_date;
    return d ? Number(String(d).slice(0, 4)) : undefined;
  })();

  const prov = await fetchJson(`/${isMovie ? "movie" : "tv"}/${id}/watch/providers`, token);
  const regionData = prov?.results?.[region] ?? null;
  const flat: any[] = regionData?.flatrate ?? [];
  const offers = flat.map(o => nameToServiceId(o?.provider_name)).filter(Boolean) as ServiceId[];

  const matched = offers.filter(s => selected.has(s));
  const services = matched.map(s => ({ id: s, quality: "HD" as const, url: PROVIDER_HOME[s] }));

  if (services.length > 0) {
    return {
      title,
      type,
      year,
      available: true,
      services,
      genres: undefined,
      updatedAt: "just now",
    } as const;
  }

  // Build alternatives from next few results with matching providers
  const alternatives: Array<{ title: string; services: { id: ServiceId; quality: "HD" | "4K"; url: string }[] }> = [];
  for (const cand of results.slice(1, 8)) {
    const candIsMovie = cand.media_type === "movie" || !!cand.title;
    const candId = cand.id;
    try {
      const p = await fetchJson(`/${candIsMovie ? "movie" : "tv"}/${candId}/watch/providers`, token);
      const rd = p?.results?.[region] ?? null;
      const fr: any[] = rd?.flatrate ?? [];
      const off = fr.map(o => nameToServiceId(o?.provider_name)).filter(Boolean) as ServiceId[];
      const m = off.filter(s => selected.has(s));
      if (m.length > 0) {
        const altTitle: string = candIsMovie ? (cand.title || cand.original_title) : (cand.name || cand.original_name);
        alternatives.push({
          title: altTitle,
          services: m.map(s => ({ id: s, quality: "HD" as const, url: PROVIDER_HOME[s] })),
        });
      }
      if (alternatives.length >= 3) break;
    } catch {
      // ignore per-candidate errors
    }
  }

  return {
    title,
    type,
    year,
    available: false,
    alternatives,
    genres: undefined,
    updatedAt: "just now",
  } as const;
}
