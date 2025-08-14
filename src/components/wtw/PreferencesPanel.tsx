import { useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { REGIONS, SERVICES, ServiceId } from "./services";

interface PreferencesPanelProps {
  region: string;
  subscriptions: Record<ServiceId, boolean>;
  tmdbToken: string;
  onRegionChange: (code: string) => void;
  onToggle: (id: ServiceId, value: boolean) => void;
  onTokenChange: (token: string) => void;
  onSave: () => void;
  onClear: () => void;
}

export default function PreferencesPanel({
  region,
  subscriptions,
  tmdbToken,
  onRegionChange,
  onToggle,
  onTokenChange,
  onSave,
  onClear,
}: PreferencesPanelProps) {
  const selectedCount = useMemo(
    () => Object.values(subscriptions).filter(Boolean).length,
    [subscriptions]
  );

  return (
    <aside className="flex flex-col h-full">
      {/* Fixed Header */}
      <header className="space-y-2 px-6 py-4 border-b border-border/30 bg-background/95 backdrop-blur-sm">
        <h2 className="text-xl font-bold">Your region & subscriptions</h2>
        <p className="text-sm text-muted-foreground/80">Saved locally in this browser — no account required</p>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        <section className="space-y-3">
          <Label htmlFor="region" className="font-medium">Search region</Label>
          <Select value={region} onValueChange={onRegionChange}>
            <SelectTrigger id="region" aria-label="Select region" className="h-11 bg-card/60 border-border/40">
              <SelectValue placeholder="Select your country" />
            </SelectTrigger>
            <SelectContent>
              {REGIONS.map(r => (
                <SelectItem key={r.code} value={r.code}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        <section className="space-y-3">
          <Label htmlFor="tmdb-token" className="font-medium">TMDB API token (v4 Read)</Label>
          <Input
            id="tmdb-token"
            type="password"
            value={tmdbToken}
            onChange={(e) => onTokenChange(e.target.value)}
            placeholder="Paste your TMDB v4 Read token"
            aria-label="TMDB API token"
            className="h-11 bg-card/60 border-border/40"
          />
          <p className="text-xs text-muted-foreground/80">Stored locally in this browser. Used to fetch real availability data from TMDB.</p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="font-medium">Streaming services</Label>
            <Badge variant="outline" className="text-xs bg-card/40 border-border/40">
              {selectedCount} selected
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SERVICES.map(svc => {
              const checked = subscriptions[svc.id];
              return (
                <label
                  key={svc.id}
                  className="flex items-center gap-3 rounded-xl border bg-card/40 px-4 py-3 cursor-pointer transition-smooth hover:bg-card/60 hover:border-border/60"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(v) => onToggle(svc.id, Boolean(v))}
                    aria-label={`Toggle ${svc.name}`}
                  />
                  <span className="inline-flex items-center gap-3 flex-1">
                    <span
                      className="inline-flex items-center justify-center h-6 min-w-6 rounded-lg text-xs font-bold transition-transform hover:scale-105"
                      style={{ 
                        backgroundColor: `hsl(var(${svc.colorVar}) / 0.2)`, 
                        color: `hsl(var(${svc.colorVar}))`,
                        border: `1px solid hsl(var(${svc.colorVar}) / 0.3)`
                      }}
                      aria-hidden
                    >
                      {svc.logoText}
                    </span>
                    <span className="text-sm font-medium">{svc.name}</span>
                  </span>
                </label>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground/80">Select the streaming services you subscribe to for personalized results.</p>
        </section>
      </div>

      {/* Fixed Footer */}
      <footer className="px-6 py-4 border-t border-border/30 bg-background/95 backdrop-blur-sm">
        <div className="flex gap-3">
          <Button className="flex-1 bg-gradient-primary hover:bg-gradient-button-hover shadow-soft transition-bounce" onClick={onSave}>
            Save preferences
          </Button>
          <Button variant="outline" className="flex-1 bg-card/40 border-border/40 hover:bg-card/60 transition-smooth" onClick={onClear}>
            Clear all
          </Button>
        </div>
      </footer>
    </aside>
  );
}
