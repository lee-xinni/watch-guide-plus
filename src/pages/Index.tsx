import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";
import PreferencesPanel from "@/components/wtw/PreferencesPanel";
import SearchBar from "@/components/wtw/SearchBar";
import ResultCard, { TitleResult } from "@/components/wtw/ResultCard";
import { ServiceId } from "@/components/wtw/services";
import { useToast } from "@/hooks/use-toast";
import { searchTitle } from "@/components/wtw/tmdb";
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
  const [tmdbToken, setTmdbToken] = useState<string>("");
  useEffect(() => {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) {
      try {
        const data = JSON.parse(raw);
        if (data.region) setRegion(data.region);
        if (data.subscriptions) setSubscriptions(data.subscriptions);
        if (data.tmdbToken) setTmdbToken(data.tmdbToken);
      } catch {}
    }
  }, []);

  const savePrefs = () => {
    localStorage.setItem(PREF_KEY, JSON.stringify({ region, subscriptions, tmdbToken }));
    toast({ title: "Preferences saved" });
  };

  const clearPrefs = () => {
    setRegion("US");
    setSubscriptions({ netflix: false, prime: false, disney: false, hulu: false, appletv: false, max: false });
    setTmdbToken("");
    localStorage.removeItem(PREF_KEY);
    toast({ title: "Preferences cleared" });
  };

  const onToggle = (id: ServiceId, value: boolean) => {
    setSubscriptions((prev) => ({ ...prev, [id]: value }));
  };

  const runSearch = async () => {
    const q = query.trim();
    if (!q) return;

    const selected = new Set<ServiceId>(
      Object.entries(subscriptions)
        .filter(([, v]) => v)
        .map(([id]) => id as ServiceId)
    );

    if (!tmdbToken) {
      toast({ title: "Add TMDB token", description: "Open Preferences and paste your TMDB v4 Read token to enable real results." });
      return;
    }

    toast({ title: "Searching TMDB…", description: "Fetching availability and suggestions" });

    try {
      const res = await searchTitle(q, region, selected, tmdbToken);
      setResult(res as TitleResult);
      toast({ title: "Done", description: res.available ? "Found availability" : "Showing alternatives" });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Search failed", description: err?.message ?? "Unexpected error" });
    }
  };

  const prefsPanel = (
    <PreferencesPanel
      region={region}
      subscriptions={subscriptions}
      tmdbToken={tmdbToken}
      onRegionChange={setRegion}
      onToggle={onToggle}
      onTokenChange={setTmdbToken}
      onSave={savePrefs}
      onClear={clearPrefs}
    />
  );

  return (
    <div className="min-h-screen bg-gradient-surface">
      <div className="container py-8 max-w-4xl">
        <header className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-primary elevated shadow-glow flex items-center justify-center" aria-hidden>
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.2"/>
                <path d="M10 8l6 4-6 4V8z" fill="currentColor"/>
                <circle cx="12" cy="12" r="2" fill="currentColor" fillOpacity="0.3"/>
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">Where To Watch</h1>
              <p className="text-sm text-muted-foreground/80">Find your next binge-worthy content</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-muted/40 border-border/40 backdrop-blur-sm">TMDB • Beta</Badge>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2 bg-card/60 border-border/50 hover:bg-card/80 transition-smooth">
                  <Settings className="h-4 w-4" />
                  Preferences
                </Button>
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

        <main className="space-y-8">
          <section className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold">Discover where to stream anything</h2>
              <p className="text-muted-foreground/80 max-w-lg mx-auto">Search any movie or TV show and we'll find where it's available on your subscriptions, or suggest similar content you can watch.</p>
            </div>

            <SearchBar query={query} onChange={setQuery} onSearch={runSearch} />
          </section>

          {result && (
            <section className="space-y-4">
              <h3 className="text-lg font-semibold">Search Results</h3>
              <ResultCard data={result} />
            </section>
          )}
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
    </div>
  );
};

export default Index;