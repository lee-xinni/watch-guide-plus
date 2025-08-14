import { FormEvent, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  query: string;
  onChange: (v: string) => void;
  onSearch: () => void;
}

export default function SearchBar({ query, onChange, onSearch }: SearchBarProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <div className="space-y-3">
      <form ref={formRef} onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1 relative">
          <Input
            value={query}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Search any movie or TV show..."
            aria-label="Search title"
            className="h-14 text-lg rounded-xl border-border/50 bg-card/80 backdrop-blur-sm pl-6 pr-4 text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:shadow-glow transition-smooth"
          />
        </div>
        <Button 
          type="submit" 
          className="h-14 px-8 rounded-xl bg-gradient-search hover:bg-gradient-button-hover text-white font-semibold shadow-soft hover:shadow-glow transition-bounce"
        >
          Search
        </Button>
      </form>
    </div>
  );
}
