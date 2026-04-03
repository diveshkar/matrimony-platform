import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Badge } from './badge';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  maxDisplay?: number;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  className,
  maxDisplay = 3,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const removeItem = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== optionValue));
  };

  const selectedLabels = value
    .map((v) => options.find((o) => o.value === v)?.label || v)
    .slice(0, maxDisplay);

  const remaining = value.length - maxDisplay;

  return (
    <div ref={ref} className={cn('relative', className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex min-h-[44px] w-full items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
          open ? 'border-primary-700 ring-2 ring-ring ring-offset-1' : 'border-input hover:border-primary-300',
        )}
      >
        <div className="flex flex-wrap gap-1.5 flex-1">
          {value.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            <>
              {selectedLabels.map((label, i) => (
                <Badge
                  key={value[i]}
                  variant="secondary"
                  className="gap-1 pr-1 text-xs font-normal"
                >
                  {label}
                  <button
                    type="button"
                    onClick={(e) => removeItem(value[i], e)}
                    className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {remaining > 0 && (
                <Badge variant="outline" className="text-xs font-normal">
                  +{remaining} more
                </Badge>
              )}
            </>
          )}
        </div>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform ml-2', open && 'rotate-180')} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-white shadow-soft-lg max-h-60 overflow-y-auto animate-fade-in">
          {options.map((option) => {
            const selected = value.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggle(option.value)}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2.5 text-sm text-left transition-colors',
                  selected ? 'bg-primary-50 text-primary-800' : 'hover:bg-muted',
                )}
              >
                <div className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                  selected ? 'bg-primary-700 border-primary-700 text-white' : 'border-input',
                )}>
                  {selected && <Check className="h-3 w-3" />}
                </div>
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
