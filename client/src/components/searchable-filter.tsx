import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchableFilterProps {
  label: string;
  options: string[];
  selected: string | null;
  onSelect: (value: string | null) => void;
  placeholder?: string;
  testIdPrefix?: string;
}

export function SearchableFilter({
  label,
  options,
  selected,
  onSelect,
  placeholder = 'Search...',
  testIdPrefix = 'filter',
}: SearchableFilterProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: string) => {
    onSelect(option === selected ? null : option);
    setOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold">{label}</label>
      <div ref={containerRef} className="relative">
        <div className="relative">
          <Input
            ref={inputRef}
            placeholder={selected || placeholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            className={cn(
              "pr-8",
              selected && !searchQuery && "text-foreground placeholder:text-foreground"
            )}
            data-testid={`input-${testIdPrefix}-search`}
          />
          <button
            type="button"
            onClick={() => {
              setOpen(!open);
              if (!open) inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            data-testid={`button-${testIdPrefix}-toggle`}
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
          </button>
        </div>

        {open && (
          <div className="absolute z-50 w-full mt-1 bg-popover/60 backdrop-blur-xl border border-border/30 rounded-md shadow-lg">
            <ScrollArea className="max-h-48">
              <div className="p-1">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleSelect(option)}
                      data-testid={`menu-item-${testIdPrefix}-${option}`}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-sm hover:bg-accent text-sm text-left"
                    >
                      <Check
                        className={cn(
                          'h-4 w-4 flex-shrink-0',
                          selected === option ? 'opacity-100 text-primary' : 'opacity-0'
                        )}
                      />
                      {option}
                    </button>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground p-3 text-center">
                    No results found
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {selected && (
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="flex items-center gap-1 cursor-pointer hover-elevate"
            onClick={() => {
              onSelect(null);
              setSearchQuery('');
            }}
            data-testid={`badge-${testIdPrefix}-selected`}
          >
            {selected}
            <X className="h-3 w-3" />
          </Badge>
        </div>
      )}
    </div>
  );
}
