import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GraduationCap, Loader2 } from 'lucide-react';

interface University {
  name: string;
  country: string;
  domains: string[];
  alpha_two_code: string;
  "state-province": string | null;
}

interface UniversityAutocompleteProps {
  value: string;
  onChange: (value: string, university?: University) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
  "data-testid"?: string;
  className?: string;
  dropdownClassName?: string;
}

const UNIVERSITIES_API = '/api/universities/search';

export function UniversityAutocomplete({
  value,
  onChange,
  placeholder = "Start typing your university name...",
  required,
  id,
  "data-testid": testId,
  className,
  dropdownClassName,
}: UniversityAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<University[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchUniversities = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${UNIVERSITIES_API}?name=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data: University[] = await response.json();
        setSuggestions(data);
      }
    } catch (error) {
      console.error('Failed to fetch universities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    onChange(newValue);
    setShowSuggestions(true);
    setHighlightedIndex(-1);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchUniversities(newValue);
    }, 300);
  };

  const handleSelectUniversity = (university: University) => {
    setQuery(university.name);
    onChange(university.name, university);
    setSuggestions([]);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelectUniversity(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleFocus = () => {
    if (query.length >= 2 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          data-testid={testId}
          className={`pr-10 ${className || ''}`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GraduationCap className="h-4 w-4" />
          )}
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className={`absolute z-50 w-full mt-1 rounded-md shadow-lg ${dropdownClassName || 'bg-popover border border-border'}`}>
          <ScrollArea className="max-h-[240px]">
            <div className="py-1">
              {suggestions.map((university, index) => (
                <button
                  key={`${university.name}-${university.domains[0]}`}
                  type="button"
                  onClick={() => handleSelectUniversity(university)}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors flex items-start gap-2 ${
                    highlightedIndex === index
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50'
                  }`}
                  data-testid={`suggestion-university-${index}`}
                >
                  <GraduationCap className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{university.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {university["state-province"] && `${university["state-province"]}, `}
                      {university.country}
                      {university.domains[0] && ` • ${university.domains[0]}`}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {showSuggestions && query.length >= 2 && !isLoading && suggestions.length === 0 && (
        <div className={`absolute z-50 w-full mt-1 rounded-md shadow-lg p-3 text-sm ${dropdownClassName || 'bg-popover border border-border text-muted-foreground'}`}>
          No universities found. Try a different search term.
        </div>
      )}
    </div>
  );
}
