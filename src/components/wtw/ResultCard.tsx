import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { SERVICES, ServiceId } from "./services";
import { toggleSave, isSaved, type SavedItem } from "@/utils/storage";

export type ServiceHit = { id: ServiceId; quality: "HD" | "4K"; url: string };
export interface TitleResult {
  id: number;
  title: string;
  type: "Movie" | "TV";
  year?: number;
  available: boolean;
  posterUrl?: string;
  services?: ServiceHit[];
  alternatives?: Array<{ title: string; year?: number; posterUrl?: string; services: ServiceHit[] }>;
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
    <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-smooth hover:scale-105" style={{
      backgroundColor: `hsl(var(${def.colorVar}) / 0.2)`,
      color: `hsl(var(${def.colorVar}))`,
      borderColor: `hsl(var(${def.colorVar}) / 0.3)`,
    }}>
      <span className="font-bold">{def.logoText}</span>
      <span className="opacity-80 text-[10px] font-medium">{quality}</span>
    </span>
  );
}

export default function ResultCard({ data }: { data: TitleResult }) {
  const [saved, setSaved] = useState(() => isSaved(data.id, data.type === "Movie" ? "movie" : "tv"));
  const [lastAction, setLastAction] = useState<{ action: 'save' | 'remove'; item: SavedItem } | null>(null);

  useEffect(() => {
    setSaved(isSaved(data.id, data.type === "Movie" ? "movie" : "tv"));
  }, [data.id, data.type]);

  const handleSaveToggle = () => {
    const saveItem = {
      id: data.id,
      type: data.type === "Movie" ? "movie" as const : "tv" as const,
      title: data.title,
      year: data.year,
      poster: data.posterUrl?.replace('https://image.tmdb.org/t/p/w500', ''),
    };

    const result = toggleSave(saveItem);
    setSaved(result.saved);
    setLastAction({ action: result.saved ? 'save' : 'remove', item: result.item });

    toast({
      title: result.saved ? "Added to Saved" : "Removed from Saved",
      description: result.saved ? "Tap to undo" : "Tap to undo",
      action: (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            // Undo the action
            const undoResult = toggleSave(saveItem);
            setSaved(undoResult.saved);
            toast({
              title: "Undone",
              description: undoResult.saved ? "Added back to saved" : "Removed from saved",
            });
          }}
        >
          Undo
        </Button>
      ),
    });
  };

  const subTitle = `${data.type}${data.year ? ` • ${data.year}` : ""}`;
  
  return (
    <Card className="bg-gradient-card backdrop-blur-md border-border/40 shadow-card hover:shadow-elevated transition-smooth overflow-hidden relative group">
      {/* Heart icon for saving - positioned absolutely */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSaveToggle}
          className={`w-10 h-10 rounded-full transition-all duration-200 ${
            saved 
              ? 'text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20' 
              : 'text-muted-foreground hover:text-red-500 bg-background/80 hover:bg-red-500/10'
          } backdrop-blur-sm shadow-soft hover:shadow-glow hover:scale-110`}
          aria-pressed={saved}
          aria-label={saved ? "Remove from saved" : "Add to saved"}
        >
          <Heart className={`w-5 h-5 transition-all duration-200 ${saved ? 'fill-current scale-110' : ''}`} />
        </Button>
      </div>

      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          {/* Poster Image */}
          {data.posterUrl && (
            <div className="flex-shrink-0 w-full sm:w-32 lg:w-40">
              <img
                src={data.posterUrl}
                alt={`${data.title} poster`}
                className="w-full sm:w-32 lg:w-40 h-auto aspect-[2/3] object-cover rounded-lg shadow-soft hover:shadow-glow transition-smooth hover:scale-105"
                loading="lazy"
              />
            </div>
          )}
          
          {/* Title and Info */}
          <div className="flex-1 space-y-4 min-w-0">
            <div className="flex items-start justify-between gap-4 pr-12 sm:pr-0">
              <div className="space-y-2 flex-1 min-w-0">
                <CardTitle className="text-2xl leading-tight">{data.title}</CardTitle>
                <CardDescription className="text-base">{subTitle}</CardDescription>
                
                {/* Heart icon on mobile - inline with title */}
                <div className="flex items-center gap-3 sm:hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSaveToggle}
                    className={`w-8 h-8 rounded-full transition-all duration-200 ${
                      saved 
                        ? 'text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20' 
                        : 'text-muted-foreground hover:text-red-500 bg-muted/40 hover:bg-red-500/10'
                    } hover:scale-110`}
                    aria-pressed={saved}
                    aria-label={saved ? "Remove from saved" : "Add to saved"}
                  >
                    <Heart className={`w-4 h-4 transition-all duration-200 ${saved ? 'fill-current scale-110' : ''}`} />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {saved ? 'Saved' : 'Save for later'}
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0 hidden sm:block">
                {data.available ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    Available
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-red-500/30 text-red-400 gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    Not available
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Availability badge on mobile */}
            <div className="sm:hidden">
              {data.available ? (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  Available
                </Badge>
              ) : (
                <Badge variant="outline" className="border-red-500/30 text-red-400 gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-400"></div>
                  Not available
                </Badge>
              )}
            </div>
            
            {/* Genres */}
            {data.genres && data.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {data.genres.map((g) => (
                  <Badge key={g} variant="secondary" className="bg-muted/40 border-border/30 text-muted-foreground hover:bg-muted/60 transition-smooth">{g}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {data.available && data.services && (
          <div className="space-y-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <p className="text-sm font-medium text-green-400">Available on your subscriptions</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.services.map(s => (
                <ServiceBadge key={s.id + s.quality} id={s.id} quality={s.quality} />
              ))}
            </div>
            <Button asChild className="w-full bg-gradient-primary hover:bg-gradient-button-hover shadow-soft hover:shadow-glow transition-bounce">
              <a href={data.services[0].url} target="_blank" rel="noopener noreferrer">
                🎬 Watch Now
              </a>
            </Button>
          </div>
        )}

        {!data.available && (
          <div className="space-y-6">
            {data.alternatives && (
              <div className="space-y-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <p className="text-sm font-medium text-blue-400">Similar titles on your subscriptions</p>
                </div>
                <div className="space-y-3">
                  {data.alternatives.slice(0, 3).map((alt, idx) => (
                    <div key={alt.title + idx} className="flex items-center gap-4 p-4 rounded-xl bg-card/40 border border-border/30 hover:bg-card/60 transition-smooth">
                      {/* Alternative Poster */}
                      {alt.posterUrl && (
                        <div className="flex-shrink-0">
                          <img
                            src={alt.posterUrl}
                            alt={`${alt.title} poster`}
                            className="w-16 h-24 object-cover rounded-lg shadow-soft hover:shadow-glow transition-smooth hover:scale-105"
                            loading="lazy"
                          />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="space-y-1">
                          <p className="font-medium truncate">{alt.title}</p>
                          {alt.year && (
                            <p className="text-sm text-muted-foreground">{alt.year}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {alt.services.map(s => (
                            <ServiceBadge key={s.id + s.quality} id={s.id} quality={s.quality} />
                          ))}
                        </div>
                      </div>
                      <Button asChild size="sm" className="bg-gradient-primary hover:bg-gradient-button-hover text-white shadow-soft transition-bounce hover:scale-105">
                        <a href={alt.services[0].url} target="_blank" rel="noopener noreferrer">
                          Watch this →
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(data.otherFlatrate || data.rent || data.buy || data.free || data.ads) && (
              <div className="space-y-4 p-4 rounded-xl bg-muted/20 border border-border/30">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                  <p className="text-sm font-medium">Other ways to watch</p>
                </div>
                
                <div className="grid gap-4">
                  {data.otherFlatrate && data.otherFlatrate.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Other subscriptions:</p>
                        <div className="flex flex-wrap gap-2">
                          {data.otherFlatrate.map(s => (
                            <a key={s.id + s.quality + 'of'} href={s.url} target="_blank" rel="noopener noreferrer" className="hover:scale-105 transition-smooth">
                              <ServiceBadge id={s.id} quality={s.quality} />
                            </a>
                          ))}
                        </div>
                      </div>
                  )}

                  {data.rent && data.rent.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">💳 Rent from:</p>
                        <div className="flex flex-wrap gap-2">
                          {data.rent.map(s => (
                            <a key={s.id + s.quality + 'rent'} href={s.url} target="_blank" rel="noopener noreferrer" className="hover:scale-105 transition-smooth">
                              <ServiceBadge id={s.id} quality={s.quality} />
                            </a>
                          ))}
                        </div>
                      </div>
                  )}

                  {data.buy && data.buy.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">🛒 Buy from:</p>
                        <div className="flex flex-wrap gap-2">
                          {data.buy.map(s => (
                            <a key={s.id + s.quality + 'buy'} href={s.url} target="_blank" rel="noopener noreferrer" className="hover:scale-105 transition-smooth">
                              <ServiceBadge id={s.id} quality={s.quality} />
                            </a>
                          ))}
                        </div>
                      </div>
                  )}

                  {data.free && data.free.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">🆓 Watch free:</p>
                        <div className="flex flex-wrap gap-2">
                          {data.free.map(s => (
                            <a key={s.id + s.quality + 'free'} href={s.url} target="_blank" rel="noopener noreferrer" className="hover:scale-105 transition-smooth">
                              <ServiceBadge id={s.id} quality={s.quality} />
                            </a>
                          ))}
                        </div>
                      </div>
                  )}

                  {data.ads && data.ads.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">📺 Free with ads:</p>
                        <div className="flex flex-wrap gap-2">
                          {data.ads.map(s => (
                            <a key={s.id + s.quality + 'ads'} href={s.url} target="_blank" rel="noopener noreferrer" className="hover:scale-105 transition-smooth">
                              <ServiceBadge id={s.id} quality={s.quality} />
                            </a>
                          ))}
                        </div>
                      </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="pt-2 border-t border-border/30">
          <p className="text-xs text-muted-foreground/60">Last updated {data.updatedAt ?? "just now"}</p>
        </div>
      </CardContent>
    </Card>
  );
}
