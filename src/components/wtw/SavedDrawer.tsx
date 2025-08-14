import { useState, useRef } from "react";
import { Heart, MoreVertical, Download, Upload, Trash2, ExternalLink } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { getSaved, removeSaved, exportSaved, importSaved, type SavedItem } from "@/utils/storage";
import { SERVICES, type ServiceId } from "./services";

interface SavedDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBrowseRecent: () => void;
}

export default function SavedDrawer({ open, onOpenChange, onBrowseRecent }: SavedDrawerProps) {
  const [savedItems, setSavedItems] = useState<SavedItem[]>(() => getSaved());
  const [itemToRemove, setItemToRemove] = useState<SavedItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshSaved = () => {
    setSavedItems(getSaved());
  };

  const handleRemove = (item: SavedItem) => {
    removeSaved(item.id, item.type);
    refreshSaved();
    toast({
      title: "Removed from Saved",
      description: `${item.title} was removed from your saved list`,
      action: (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            // Undo logic would go here
            toast({ title: "Undo not implemented yet" });
          }}
        >
          Undo
        </Button>
      ),
    });
    setItemToRemove(null);
  };

  const handleExport = () => {
    exportSaved();
    toast({
      title: "Export complete",
      description: "Your saved list has been downloaded",
    });
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = await importSaved(file);
    
    if (result.success) {
      refreshSaved();
      toast({
        title: "Import complete",
        description: `Added ${result.count} new items to your saved list`,
      });
    } else {
      toast({
        title: "Import failed",
        description: result.error || "Failed to import file",
        variant: "destructive",
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getServiceChips = (item: SavedItem) => {
    // In a real app, you'd fetch availability data
    // For now, return empty array
    return [];
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:w-[480px] flex flex-col">
          <SheetHeader className="flex-shrink-0 pb-4 border-b border-border/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SheetTitle className="text-xl">Saved</SheetTitle>
                {savedItems.length > 0 && (
                  <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                    {savedItems.length}
                  </Badge>
                )}
              </div>
            </div>
            <SheetDescription className="text-sm text-muted-foreground">
              Saved locally on this device — no account required.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {savedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-12">
                <div className="w-24 h-24 rounded-full bg-muted/40 flex items-center justify-center">
                  <Heart className="w-10 h-10 text-muted-foreground/60" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Nothing saved yet</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Tap the ♥ on any title to save it here.
                  </p>
                </div>
                <Button variant="outline" onClick={onBrowseRecent}>
                  Browse your recent searches
                </Button>
              </div>
            ) : (
              savedItems.map((item) => (
                <Card key={`${item.id}-${item.type}`} className="bg-card/40 border-border/30 hover:bg-card/60 transition-smooth">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Poster */}
                      {item.poster && (
                        <div className="flex-shrink-0">
                          <img
                            src={`https://image.tmdb.org/t/p/w154${item.poster}`}
                            alt={`${item.title} poster`}
                            className="w-16 h-24 object-cover rounded-lg shadow-soft hover:shadow-glow transition-smooth hover:scale-105"
                            loading="lazy"
                          />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0 space-y-3">
                        {/* Title and metadata */}
                        <div className="space-y-1">
                          <h4 className="font-medium truncate">{item.title}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{item.type === "movie" ? "Movie" : "Series"}</span>
                            {item.year && (
                              <>
                                <span>•</span>
                                <span>{item.year}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Service chips */}
                        <div className="flex flex-wrap gap-1.5">
                          {getServiceChips(item).length > 0 ? (
                            getServiceChips(item).map((service: ServiceId) => {
                              const def = SERVICES.find(s => s.id === service);
                              return def ? (
                                <span
                                  key={service}
                                  className="inline-flex items-center rounded-lg px-2 py-1 text-xs font-medium border transition-smooth"
                                  style={{
                                    backgroundColor: `hsl(var(${def.colorVar}) / 0.2)`,
                                    color: `hsl(var(${def.colorVar}))`,
                                    borderColor: `hsl(var(${def.colorVar}) / 0.3)`,
                                  }}
                                >
                                  {def.logoText}
                                </span>
                              ) : null;
                            })
                          ) : (
                            <span className="text-xs text-muted-foreground">Check availability</span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between">
                          <Button size="sm" className="bg-gradient-primary hover:bg-gradient-button-hover text-white shadow-soft transition-bounce hover:scale-105">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Watch now
                          </Button>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setItemToRemove(item)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Heart className="w-4 h-4 fill-current" />
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setItemToRemove(item)}>
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Remove
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  View details
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Footer with export/import */}
          <div className="flex-shrink-0 pt-4 border-t border-border/30">
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleExport} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </SheetContent>
      </Sheet>

      {/* Remove confirmation dialog */}
      <AlertDialog open={!!itemToRemove} onOpenChange={() => setItemToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from saved?</AlertDialogTitle>
            <AlertDialogDescription>
              {itemToRemove && `"${itemToRemove.title}" will be removed from your saved list.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => itemToRemove && handleRemove(itemToRemove)}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}