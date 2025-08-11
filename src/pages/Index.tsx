import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PreferencesPanel from "@/components/wtw/PreferencesPanel";
import SearchBar from "@/components/wtw/SearchBar";
import ResultCard, { TitleResult } from "@/components/wtw/ResultCard";
import { ServiceId } from "@/components/wtw/services";
import { useToast } from "@/hooks/use-toast";

const PREF_KEY = "wtw_prefs_v1";

const Index = () => {
  const { toast } = useToast();
  const [region, setRegion] = useState<string>("US");
  const [subscriptions, setSubscriptions] = useState<Record<ServiceId, boolean>>({
    netflix: false,
    prime: false,
    disney: false,
    hulu: false,
    appletv: false,
    max: false,
  });
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<TitleResult | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) {
      try {
        const data = JSON.parse(raw);
        if (data.region) setRegion(data.region);
        if (data.subscriptions) setSubscriptions(data.subscriptions);
      } catch {}
    }
  }, []);

  const savePrefs = () => {
    localStorage.setItem(PREF_KEY, JSON.stringify({ region, subscriptions }));
    toast({ title: "Preferences saved" });
  };

  const clearPrefs = () => {
    setRegion("US");
    setSubscriptions({ netflix: false, prime: false, disney: false, hulu: false, appletv: false, max: false });
    localStorage.removeItem(PREF_KEY);
    toast({ title: "Preferences cleared" });
  };

  const onToggle = (id: ServiceId, value: boolean) => {
    setSubscriptions((prev) => ({ ...prev, [id]: value }));
  };

  const runSearch = () => {
    const q = query.trim().toLowerCase();
    if (!q) return;

    const selected = new Set<ServiceId>(
      Object.entries(subscriptions)
        .filter(([, v]) => v)
        .map(([id]) => id as ServiceId)
    );

    const filterAlts = (
      alts: { title: string; services: { id: ServiceId; quality: "HD" | "4K"; url: string }[] }[]
    ) =>
      alts
        .map((a) => ({ ...a, services: a.services.filter((s) => selected.has(s.id)) }))
        .filter((a) => a.services.length > 0);

    // Demo logic: "inception" is available; others show alternatives
    if (q.includes("inception")) {
      const allServices = [
        { id: "netflix" as ServiceId, quality: "HD" as const, url: "https://www.netflix.com/title/70131314" },
        { id: "max" as ServiceId, quality: "4K" as const, url: "https://www.max.com" },
      ];

      const filteredServices = allServices.filter((s) => selected.has(s.id));

      if (filteredServices.length > 0) {
        setResult({
          title: "Inception",
          type: "Movie",
          year: 2010,
          available: true,
          services: filteredServices,
          genres: ["Sci‑Fi", "Thriller"],
          updatedAt: "2 days ago",
        });
      } else {
        setResult({
          title: "Inception",
          type: "Movie",
          year: 2010,
          available: false,
          alternatives: filterAlts([
            { title: "Interstellar", services: [{ id: "prime" as ServiceId, quality: "4K" as const, url: "https://www.primevideo.com" }] },
            { title: "Tenet", services: [{ id: "max" as ServiceId, quality: "HD" as const, url: "https://www.max.com" }] },
          ]),
          genres: ["Sci‑Fi", "Thriller"],
          updatedAt: "2 days ago",
        });
      }
    } else {
      const alts = [
        { title: "Interstellar", services: [{ id: "prime" as ServiceId, quality: "4K" as const, url: "https://www.primevideo.com" }] },
        { title: "Tenet", services: [{ id: "max" as ServiceId, quality: "HD" as const, url: "https://www.max.com" }] },
      ];

      const filteredAlternatives = filterAlts(alts);

      setResult({
        title: query,
        type: "Movie",
        available: false,
        alternatives: filteredAlternatives,
        genres: ["Action", "Drama"],
        updatedAt: "just now",
      });
    }
  };

  const prefsPanel = (
    <PreferencesPanel
      region={region}
      subscriptions={subscriptions}
      onRegionChange={setRegion}
      onToggle={onToggle}
      onSave={savePrefs}
      onClear={clearPrefs}
    />
  );

  return (
    <div className="min-h-screen container py-5">
      <header className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-primary elevated" aria-hidden />
          <h1 className="text-2xl font-bold">Where To Watch</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-muted/60">Prototype • TMDB providers</Badge>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary">Preferences</Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-11/12 sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Your region & subscriptions</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                {prefsPanel}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="grid md:grid-cols-[320px_1fr] gap-5">
        <div className="hidden md:block">{prefsPanel}</div>

        <section className="space-y-4">
          <h2 className="sr-only">Search</h2>
          <p className="text-sm text-muted-foreground">Single-title search. We’ll show one match; if unavailable, we’ll suggest similar titles on your services.</p>

          <SearchBar query={query} onChange={setQuery} onSearch={runSearch} />

          {result && (
            <div className="mt-2">
              <ResultCard data={result} />
            </div>
          )}
        </section>
      </main>

      {/* Structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Where To Watch",
        applicationCategory: "EntertainmentApplication",
        description: "Find where to watch any movie or TV show across your streaming subscriptions and region.",
        operatingSystem: "Web",
      }) }} />
    </div>
  );
};

export default Index;
