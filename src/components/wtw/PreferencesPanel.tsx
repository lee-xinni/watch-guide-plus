import { useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <aside className="space-y-5">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold">Your region & subscriptions</h2>
        <p className="text-sm text-muted-foreground">Saved to this browser — no account required</p>
      </header>

      <section className="space-y-2">
        <Label htmlFor="region">Search region</Label>
        <Select value={region} onValueChange={onRegionChange}>
          <SelectTrigger id="region" aria-label="Select region">
            <SelectValue placeholder="Select your country" />
          </SelectTrigger>
          <SelectContent>
            {REGIONS.map(r => (
              <SelectItem key={r.code} value={r.code}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      <section className="space-y-2">
        <Label htmlFor="tmdb-token">TMDB API token (v4 Read)</Label>
        <Input
          id="tmdb-token"
          type="password"
          value={tmdbToken}
          onChange={(e) => onTokenChange(e.target.value)}
          placeholder="Paste your TMDB v4 Read token"
          aria-label="TMDB API token"
        />
        <p className="text-xs text-muted-foreground">Stored locally in this browser. Used to fetch real availability data from TMDB.</p>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Streaming services</Label>
          <span className="text-xs text-muted-foreground">{selectedCount} selected</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SERVICES.map(svc => {
            const checked = subscriptions[svc.id];
            return (
              <label
                key={svc.id}
                className="flex items-center gap-2 rounded-lg border bg-card/60 px-3 py-2 cursor-pointer transition-colors hover:bg-accent/40"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(v) => onToggle(svc.id, Boolean(v))}
                  aria-label={`Toggle ${svc.name}`}
                />
                <span className="inline-flex items-center gap-2">
                  <span
                    className="inline-flex items-center justify-center h-5 min-w-5 rounded-sm text-[10px] font-bold"
                    style={{ backgroundColor: `hsl(var(${svc.colorVar}))`, color: "hsl(var(--chip-foreground))" }}
                    aria-hidden
                  >
                    {svc.logoText}
                  </span>
                  <span className="text-sm">{svc.name}</span>
                </span>
              </label>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">Toggle the services you subscribe to.</p>
      </section>

      <div className="flex gap-3 pt-1">
        <Button className="flex-1" onClick={onSave}>Save preferences</Button>
        <Button variant="secondary" className="flex-1" onClick={onClear}>Clear</Button>
      </div>
    </aside>
  );
}
