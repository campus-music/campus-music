import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X } from 'lucide-react';
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

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            data-testid={`button-${testIdPrefix}-trigger`}
          >
            {selected || placeholder}
            <span className="ml-2 opacity-50">↓</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <div className="p-2 space-y-2">
            <Input
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8"
              data-testid={`input-${testIdPrefix}-search`}
            />
            <ScrollArea className="h-48">
              <div className="space-y-1 p-2">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        onSelect(option === selected ? null : option);
                        setOpen(false);
                        setSearchQuery('');
                      }}
                      data-testid={`menu-item-${testIdPrefix}-${option}`}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent text-sm text-left"
                    >
                      <Check
                        className={cn(
                          'h-4 w-4 flex-shrink-0',
                          selected === option ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {option}
                    </button>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground p-2 text-center">
                    No results found
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </PopoverContent>
      </Popover>

      {selected && (
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="flex items-center gap-1 cursor-pointer hover-elevate"
            onClick={() => onSelect(null)}
          >
            {selected}
            <X className="h-3 w-3" />
          </Badge>
        </div>
      )}
    </div>
  );
}
