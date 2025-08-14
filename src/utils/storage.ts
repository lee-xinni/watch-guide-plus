export interface SavedItem {
  id: number;
  type: "movie" | "tv";
  title: string;
  year?: number;
  poster?: string;
  savedAt: number;
}

export interface SearchHistoryItem {
  q: string;
  id?: number;
  type?: "movie" | "tv";
  at: number;
}

const SAVED_KEY = "wtw:saved";
const HISTORY_KEY = "wtw:history";
const MAX_SAVED = 300;
const MAX_HISTORY = 25;

// Saved items management
export function getSaved(): SavedItem[] {
  try {
    const data = localStorage.getItem(SAVED_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function setSaved(items: SavedItem[]): void {
  try {
    const limited = items.slice(0, MAX_SAVED);
    localStorage.setItem(SAVED_KEY, JSON.stringify(limited));
  } catch (error) {
    console.error("Failed to save items:", error);
  }
}

export function toggleSave(item: Omit<SavedItem, "savedAt">): { saved: boolean; item: SavedItem } {
  const saved = getSaved();
  const existingIndex = saved.findIndex(s => s.id === item.id && s.type === item.type);
  
  if (existingIndex >= 0) {
    // Remove
    const removedItem = saved[existingIndex];
    saved.splice(existingIndex, 1);
    setSaved(saved);
    return { saved: false, item: removedItem };
  } else {
    // Add
    const newItem: SavedItem = { ...item, savedAt: Date.now() };
    saved.unshift(newItem);
    setSaved(saved);
    return { saved: true, item: newItem };
  }
}

export function isSaved(id: number, type: "movie" | "tv"): boolean {
  const saved = getSaved();
  return saved.some(s => s.id === id && s.type === type);
}

export function removeSaved(id: number, type: "movie" | "tv"): SavedItem | null {
  const saved = getSaved();
  const index = saved.findIndex(s => s.id === id && s.type === type);
  if (index >= 0) {
    const removed = saved[index];
    saved.splice(index, 1);
    setSaved(saved);
    return removed;
  }
  return null;
}

// Search history management
export function getHistory(): SearchHistoryItem[] {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function pushHistory(query: string, topResult?: { id: number; type: "movie" | "tv" }): void {
  try {
    const history = getHistory();
    
    // Remove existing entry with same query
    const filtered = history.filter(h => h.q.toLowerCase() !== query.toLowerCase());
    
    // Add new entry at beginning
    const newItem: SearchHistoryItem = {
      q: query,
      id: topResult?.id,
      type: topResult?.type,
      at: Date.now()
    };
    
    filtered.unshift(newItem);
    
    // Keep only recent items
    const limited = filtered.slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(limited));
  } catch (error) {
    console.error("Failed to save search history:", error);
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error("Failed to clear history:", error);
  }
}

// Export/Import functionality
export function exportSaved(): void {
  const saved = getSaved();
  const data = {
    version: "1.0",
    exported: new Date().toISOString(),
    items: saved
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = "where-to-watch-backup.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export function importSaved(file: File): Promise<{ success: boolean; count: number; error?: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        if (!data.items || !Array.isArray(data.items)) {
          resolve({ success: false, count: 0, error: "Invalid file format" });
          return;
        }
        
        const existing = getSaved();
        const existingIds = new Set(existing.map(item => `${item.id}-${item.type}`));
        
        // Merge new items, avoiding duplicates
        const newItems = data.items.filter((item: SavedItem) => 
          !existingIds.has(`${item.id}-${item.type}`)
        );
        
        const merged = [...existing, ...newItems];
        setSaved(merged);
        
        resolve({ success: true, count: newItems.length });
      } catch (error) {
        resolve({ success: false, count: 0, error: "Failed to parse file" });
      }
    };
    
    reader.onerror = () => {
      resolve({ success: false, count: 0, error: "Failed to read file" });
    };
    
    reader.readAsText(file);
  });
}
