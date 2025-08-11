import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SERVICES, ServiceId } from "./services";

export type ServiceHit = { id: ServiceId; quality: "HD" | "4K"; url: string };
export interface TitleResult {
  title: string;
  type: "Movie" | "TV";
  year?: number;
  available: boolean;
  services?: ServiceHit[];
  alternatives?: Array<{ title: string; services: ServiceHit[] }>;
  otherFlatrate?: ServiceHit[];
  rent?: ServiceHit[];
  buy?: ServiceHit[];
  free?: ServiceHit[];
  ads?: ServiceHit[];
  genres?: string[];
  updatedAt?: string;
}

function ServiceBadge({ id, quality }: { id: ServiceId; quality: "HD" | "4K" }) {
  const def = SERVICES.find(s => s.id === id)!;
  return (
    <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium border" style={{
      backgroundColor: `hsl(var(${def.colorVar}))`,
      color: "hsl(var(--chip-foreground))",
      borderColor: "hsl(var(--border))",
    }}>
      {def.logoText} <span className="opacity-90">{quality}</span>
    </span>
  );
}

export default function ResultCard({ data }: { data: TitleResult }) {
  const subTitle = `${data.type}${data.year ? ` • ${data.year}` : ""}`;
  return (
    <Card className="bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{data.title}</span>
          {data.available ? (
            <span className="text-[hsl(var(--positive))] text-sm">✅ Available</span>
          ) : (
            <span className="text-[hsl(var(--negative))] text-sm">✖ Not available</span>
          )}
        </CardTitle>
        <CardDescription>{subTitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.genres && data.genres.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.genres.map((g) => (
              <Badge key={g} variant="secondary" className="bg-muted/60">{g}</Badge>
            ))}
          </div>
        )}

        {data.available && data.services && (
          <div className="space-y-3">
            <p className="text-sm">Available on your subscriptions:</p>
            <div className="flex flex-wrap gap-2">
              {data.services.map(s => (
                <ServiceBadge key={s.id + s.quality} id={s.id} quality={s.quality} />
              ))}
            </div>
            <div>
              {/* Use the first service URL for demo */}
              <Button asChild className="mt-1">
                <a href={data.services[0].url} target="_blank" rel="noopener noreferrer">Watch now</a>
              </Button>
            </div>
          </div>
        )}

        {!data.available && (
          <div className="space-y-6">
            {data.alternatives && (
              <div className="space-y-3">
                <p className="text-sm">Not available on your subscriptions. Try these:</p>
                <div className="space-y-2">
                  {data.alternatives.slice(0, 3).map((alt, idx) => (
                    <div key={alt.title + idx} className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 p-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{alt.title}</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {alt.services.map(s => (
                            <ServiceBadge key={s.id + s.quality} id={s.id} quality={s.quality} />
                          ))}
                        </div>
                      </div>
                      <Button asChild size="sm">
                        <a href={alt.services[0].url} target="_blank" rel="noopener noreferrer">Watch this →</a>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(data.otherFlatrate || data.rent || data.buy || data.free || data.ads) && (
              <div className="space-y-4">
                {data.otherFlatrate && data.otherFlatrate.length > 0 && (
                  <div>
                    <p className="text-sm">Available with other subscriptions:</p>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {data.otherFlatrate.map(s => (
                        <a key={s.id + s.quality + 'of'} href={s.url} target="_blank" rel="noopener noreferrer">
                          <ServiceBadge id={s.id} quality={s.quality} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {data.rent && data.rent.length > 0 && (
                  <div>
                    <p className="text-sm">Rent from:</p>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {data.rent.map(s => (
                        <a key={s.id + s.quality + 'rent'} href={s.url} target="_blank" rel="noopener noreferrer">
                          <ServiceBadge id={s.id} quality={s.quality} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {data.buy && data.buy.length > 0 && (
                  <div>
                    <p className="text-sm">Buy from:</p>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {data.buy.map(s => (
                        <a key={s.id + s.quality + 'buy'} href={s.url} target="_blank" rel="noopener noreferrer">
                          <ServiceBadge id={s.id} quality={s.quality} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {data.free && data.free.length > 0 && (
                  <div>
                    <p className="text-sm">Watch free on:</p>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {data.free.map(s => (
                        <a key={s.id + s.quality + 'free'} href={s.url} target="_blank" rel="noopener noreferrer">
                          <ServiceBadge id={s.id} quality={s.quality} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {data.ads && data.ads.length > 0 && (
                  <div>
                    <p className="text-sm">Free (with ads) on:</p>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {data.ads.map(s => (
                        <a key={s.id + s.quality + 'ads'} href={s.url} target="_blank" rel="noopener noreferrer">
                          <ServiceBadge id={s.id} quality={s.quality} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">Last updated {data.updatedAt ?? "just now"}</p>
      </CardContent>
    </Card>
  );
}
