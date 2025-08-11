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
    <form ref={formRef} onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search a movie or TV show"
        aria-label="Search title"
        className="h-12 text-base"
      />
      <Button type="submit" className="h-12 px-5">Search</Button>
    </form>
  );
}
