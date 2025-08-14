import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { getHistory, clearHistory, type SearchHistoryItem } from "@/utils/storage";

interface RecentSearchesProps {
  onSearchSelect: (query: string) => void;
}

export default function RecentSearches({ onSearchSelect }: RecentSearchesProps) {
  const history = getHistory().slice(0, 10); // Show latest 10

  const handleClear = () => {
    clearHistory();
    // Force re-render by triggering parent component update
    window.dispatchEvent(new CustomEvent('wtw:history-cleared'));
  };

  const truncateQuery = (query: string, maxLength: number = 25) => {
    return query.length > maxLength ? `${query.slice(0, maxLength)}...` : query;
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Recent</h3>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
              Clear
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear history?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove all your recent searches. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClear}>
                Clear history
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {history.map((item, index) => (
          <Badge
            key={`${item.q}-${index}`}
            variant="secondary"
            className="cursor-pointer bg-muted/40 hover:bg-muted/60 text-muted-foreground hover:text-foreground border-border/30 hover:border-border/50 transition-smooth px-3 py-1.5 text-sm font-normal"
            onClick={() => onSearchSelect(item.q)}
          >
            {truncateQuery(item.q)}
          </Badge>
        ))}
      </div>
    </div>
  );
}