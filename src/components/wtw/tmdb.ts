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

async function fetchRecommendations(
  id: number, 
  isMovie: boolean, 
  title: string, 
  region: string, 
  selected: SearchSelected, 
  token: string
): Promise<Array<{ id: number; title: string; year?: number; posterUrl?: string; services: { id: ServiceId; quality: "HD" | "4K"; url: string }[] }>> {
  try {
    // Try recommendations endpoint first (higher quality, curated by TMDB)
    const recommendationsResponse = await fetchJson(`/${isMovie ? "movie" : "tv"}/${id}/recommendations`, token);
    let recommendationResults: any[] = Array.isArray(recommendationsResponse?.results) ? recommendationsResponse.results.slice(0, 12) : [];
    
    // If no recommendations, fallback to similar endpoint
    if (recommendationResults.length === 0) {
      console.log(`No recommendations found for ${title}, trying similar titles`);
      const similarResponse = await fetchJson(`/${isMovie ? "movie" : "tv"}/${id}/similar`, token);
      recommendationResults = Array.isArray(similarResponse?.results) ? similarResponse.results.slice(0, 12) : [];
    }
    
    console.log(`Found ${recommendationResults.length} recommendation candidates for ${title}`);
    
    const priorityRecommendations: any[] = [];
    const otherRecommendations: any[] = [];
    
    for (const rec of recommendationResults) {
      const recIsMovie = isMovie;
      const recId = rec.id;
      
      try {
        const recProviders = await fetchJson(`/${recIsMovie ? "movie" : "tv"}/${recId}/watch/providers`, token);
        const recRegionData = recProviders?.results?.[region] ?? null;
        const recFlat: any[] = recRegionData?.flatrate ?? [];
        const recRent: any[] = recRegionData?.rent ?? [];
        const recBuy: any[] = recRegionData?.buy ?? [];
        const recFree: any[] = recRegionData?.free ?? [];
        const recAds: any[] = recRegionData?.ads ?? [];
        
        // Get all available services
        const allProviders = [...recFlat, ...recRent, ...recBuy, ...recFree, ...recAds];
        const recOffers = Array.from(new Set(allProviders.map(o => nameToServiceId(o?.provider_name)).filter(Boolean))) as ServiceId[];
        
        const recTitle: string = recIsMovie ? (rec.title || rec.original_title) : (rec.name || rec.original_name);
        const recYear = (() => {
          const d = recIsMovie ? rec.release_date : rec.first_air_date;
          return d ? Number(String(d).slice(0, 4)) : undefined;
        })();
        const recPosterUrl = rec.poster_path ? `https://image.tmdb.org/t/p/w300${rec.poster_path}` : undefined;
        
        const recItem = {
          id: recId,
          title: recTitle,
          year: recYear,
          posterUrl: recPosterUrl,
          services: [] as { id: ServiceId; quality: "HD" | "4K"; url: string }[]
        };
        
        // If user has subscriptions selected, prioritize matching ones
        if (selected.size > 0) {
          const recMatched = Array.from(new Set(recOffers.filter(s => selected.has(s))));
          if (recMatched.length > 0) {
            recItem.services = recMatched.map(s => ({ id: s, quality: "HD" as const, url: PROVIDER_HOME[s] }));
            priorityRecommendations.push(recItem);
          } else if (recOffers.length > 0) {
            // Still show it but mark as "other services"
            recItem.services = recOffers.slice(0, 3).map(s => ({ id: s, quality: "HD" as const, url: PROVIDER_HOME[s] }));
            otherRecommendations.push(recItem);
          } else {
            // Show even without providers (user can search elsewhere)
            otherRecommendations.push(recItem);
          }
        } else {
          // No subscriptions selected, show all with any available services
          if (recOffers.length > 0) {
            recItem.services = recOffers.slice(0, 3).map(s => ({ id: s, quality: "HD" as const, url: PROVIDER_HOME[s] }));
            priorityRecommendations.push(recItem);
          } else {
            // Show even without providers
            otherRecommendations.push(recItem);
          }
        }
        
      } catch (error) {
        console.log(`Error fetching providers for recommendation ${rec.title || rec.name}:`, error);
        // Still add the recommendation without provider data
        const recTitle: string = recIsMovie ? (rec.title || rec.original_title) : (rec.name || rec.original_name);
        const recYear = (() => {
          const d = recIsMovie ? rec.release_date : rec.first_air_date;
          return d ? Number(String(d).slice(0, 4)) : undefined;
        })();
        const recPosterUrl = rec.poster_path ? `https://image.tmdb.org/t/p/w300${rec.poster_path}` : undefined;
        
        otherRecommendations.push({
          id: rec.id,
          title: recTitle,
          year: recYear,
          posterUrl: recPosterUrl,
          services: []
        });
      }
    }
    
    // Combine priority and other recommendations, up to 8 total
    const recommendations = [...priorityRecommendations, ...otherRecommendations].slice(0, 8);
    console.log(`Showing ${recommendations.length} recommendations for ${title} (${priorityRecommendations.length} priority, ${otherRecommendations.length} other)`);
    
    return recommendations;
  } catch (error) {
    console.log(`Error fetching recommendations for ${title}:`, error);
    return [];
  }
}

export async function searchTitle(query: string, region: string, selected: SearchSelected, token: string) {
  if (!token) throw new Error("TMDB token missing");

  const q = encodeURIComponent(query);
  const search = await fetchJson(`/search/multi?query=${q}&include_adult=false`, token);
  const results: any[] = Array.isArray(search?.results) ? search.results : [];
  const primary = results.find(r => r.media_type === "movie" || r.media_type === "tv") || results[0];

  if (!primary) {
    return {
      id: 0, // Fallback ID for no results
      title: query,
      type: "Movie" as const,
      available: false,
      alternatives: [],
      posterUrl: undefined,
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
  const posterUrl = primary.poster_path ? `https://image.tmdb.org/t/p/w500${primary.poster_path}` : undefined;

  const prov = await fetchJson(`/${isMovie ? "movie" : "tv"}/${id}/watch/providers`, token);
  const regionData = prov?.results?.[region] ?? null;
  const flat: any[] = regionData?.flatrate ?? [];
  const offers = flat.map(o => nameToServiceId(o?.provider_name)).filter(Boolean) as ServiceId[];

  const matched = Array.from(new Set(offers.filter(s => selected.has(s))));
  const services = matched.map(s => ({ id: s, quality: "HD" as const, url: PROVIDER_HOME[s] }));

  if (services.length > 0) {
    const recommendations = await fetchRecommendations(id, isMovie, title, region, selected, token);
    
    return {
      id,
      title,
      type,
      year,
      available: true,
      services,
      posterUrl,
      recommendations,
      genres: undefined,
      updatedAt: "just now",
    } as const;
  }

  // When not available on selected subscriptions, compute other options
  const otherFlatrate = Array.from(new Set(offers.filter(s => !selected.has(s)))).map(id => ({ id, quality: "HD" as const, url: PROVIDER_HOME[id] }));
  const rentList: any[] = regionData?.rent ?? [];
  const buyList: any[] = regionData?.buy ?? [];
  const freeList: any[] = regionData?.free ?? [];
  const adsList: any[] = regionData?.ads ?? [];

  const rent = Array.from(new Set(rentList.map(o => nameToServiceId(o?.provider_name)).filter(Boolean) as ServiceId[])).map(id => ({ id, quality: "HD" as const, url: PROVIDER_HOME[id] }));
  const buy = Array.from(new Set(buyList.map(o => nameToServiceId(o?.provider_name)).filter(Boolean) as ServiceId[])).map(id => ({ id, quality: "HD" as const, url: PROVIDER_HOME[id] }));
  const free = Array.from(new Set(freeList.map(o => nameToServiceId(o?.provider_name)).filter(Boolean) as ServiceId[])).map(id => ({ id, quality: "HD" as const, url: PROVIDER_HOME[id] }));
  const ads = Array.from(new Set(adsList.map(o => nameToServiceId(o?.provider_name)).filter(Boolean) as ServiceId[])).map(id => ({ id, quality: "HD" as const, url: PROVIDER_HOME[id] }));
  // Build alternatives from next few results with matching providers
  const alternatives: Array<{ title: string; year?: number; posterUrl?: string; services: { id: ServiceId; quality: "HD" | "4K"; url: string }[] }> = [];
  for (const cand of results.slice(1, 8)) {
    const candIsMovie = cand.media_type === "movie" || !!cand.title;
    const candId = cand.id;
    try {
      const p = await fetchJson(`/${candIsMovie ? "movie" : "tv"}/${candId}/watch/providers`, token);
      const rd = p?.results?.[region] ?? null;
      const fr: any[] = rd?.flatrate ?? [];
      const off = fr.map(o => nameToServiceId(o?.provider_name)).filter(Boolean) as ServiceId[];
      const m = Array.from(new Set(off.filter(s => selected.has(s))));
      if (m.length > 0) {
        const altTitle: string = candIsMovie ? (cand.title || cand.original_title) : (cand.name || cand.original_name);
        const altYear = (() => {
          const d = candIsMovie ? cand.release_date : cand.first_air_date;
          return d ? Number(String(d).slice(0, 4)) : undefined;
        })();
        const altPosterUrl = cand.poster_path ? `https://image.tmdb.org/t/p/w300${cand.poster_path}` : undefined;
        alternatives.push({
          title: altTitle,
          year: altYear,
          posterUrl: altPosterUrl,
          services: m.map(s => ({ id: s, quality: "HD" as const, url: PROVIDER_HOME[s] })),
        });
      }
      if (alternatives.length >= 3) break;
    } catch {
      // ignore per-candidate errors
    }
  }

  // Fetch recommendations (always show as "You might also like")
  const recommendations = await fetchRecommendations(id, isMovie, title, region, selected, token);

  return {
    id,
    title,
    type,
    year,
    available: false,
    posterUrl,
    alternatives,
    recommendations,
    ...(otherFlatrate.length ? { otherFlatrate } : {}),
    ...(rent.length ? { rent } : {}),
    ...(buy.length ? { buy } : {}),
    ...(free.length ? { free } : {}),
    ...(ads.length ? { ads } : {}),
    genres: undefined,
    updatedAt: "just now",
  } as const;
}
