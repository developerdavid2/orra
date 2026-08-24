"use client";

import { Badge } from "@orra/ui/components/badge";
import { Button } from "@orra/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@orra/ui/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@orra/ui/components/popover";
import { cn } from "@orra/ui/lib/utils";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { useState } from "react";

interface ComboboxOption {
  label: string;
  value: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  sublabel?: string;
  triggerLabel?: React.ReactNode;
}

interface SharedProps {
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  ariaInvalid?: boolean;
  className?: string;
  contentClassName?: string;
}

interface SingleSelectProps extends SharedProps {
  multiple?: false;
  value: string;
  onChange: (value: string) => void;
}

interface MultiSelectProps extends SharedProps {
  multiple: true;
  value: string[];
  onChange: (value: string[]) => void;
  // Selected items render as removable chips below the trigger. Default true.
  showChips?: boolean;
}

type Props = SingleSelectProps | MultiSelectProps;

export function MultiSelectCombobox(props: Props) {
  const {
    options,
    placeholder = "Select...",
    searchPlaceholder = "Search...",
    disabled,
    ariaInvalid,
    className,
    contentClassName,
  } = props;

  const [open, setOpen] = useState(false);

  if (props.multiple) {
    const { value, onChange, showChips = true } = props;
    const selected = options.filter((o) => value.includes(o.value));

    const toggle = (val: string) => {
      if (value.includes(val)) onChange(value.filter((v) => v !== val));
      else onChange([...value, val]);
    };

    const remove = (val: string) => onChange(value.filter((v) => v !== val));

    return (
      <div className="space-y-2">
        <Popover
          open={open}
          onOpenChange={disabled ? undefined : setOpen}
          modal
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              role="combobox"
              aria-expanded={open}
              aria-invalid={ariaInvalid}
              disabled={disabled}
              className={cn(
                "w-full justify-between rounded-xl font-normal bg-secondary/50",
                value.length === 0 && "text-muted-foreground",
                className,
              )}
            >
              <span className="truncate">
                {value.length === 0 ? placeholder : `${value.length} selected`}
              </span>
              <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className={cn(
              "min-w-(--radix-popover-trigger-width) w-max max-w-[min(24rem,90vw)] p-0",
              contentClassName,
            )}
            align="start"
            sideOffset={4}
          >
            <Command>
              <CommandInput placeholder={searchPlaceholder} />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  {options.map((opt) => {
                    const isSelected = value.includes(opt.value);
                    return (
                      <CommandItem
                        key={opt.value}
                        value={opt.label}
                        className={cn(
                          "hover:bg-accent",
                          opt.disabled &&
                            "opacity-40 cursor-not-allowed pointer-events-none",
                        )}
                        disabled={opt.disabled}
                        onSelect={() => !opt.disabled && toggle(opt.value)}
                      >
                        <span
                          className={cn(
                            "mr-2 flex size-4 shrink-0 items-center justify-center rounded-sm border",
                            isSelected
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-input",
                          )}
                        >
                          {isSelected && <Check className="size-3" />}
                        </span>
                        <span className="flex flex-col min-w-0">
                          <span className="flex items-center gap-2 truncate">
                            {opt.icon}
                            {opt.label}
                          </span>
                          {opt.sublabel && (
                            <span className="text-xs text-muted-foreground truncate">
                              {opt.sublabel}
                            </span>
                          )}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {showChips && selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selected.map((opt) => (
              <Badge
                key={opt.value}
                variant="secondary"
                className={cn(
                  "gap-1 pr-1.5 text-[11px] font-medium",
                  disabled && "opacity-50",
                )}
              >
                {opt.label}
                <button
                  type="button"
                  onClick={() => remove(opt.value)}
                  className="ml-0.5 rounded-full hover:bg-background/20 p-0.5 transition-colors"
                  aria-label={`Remove ${opt.label}`}
                  disabled={disabled}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Single-select branch — same behavior as the original SearchableCombobox
  const { value, onChange } = props;
  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          role="combobox"
          aria-expanded={open}
          aria-invalid={ariaInvalid}
          disabled={disabled}
          className={cn(
            "w-full justify-between rounded-xl font-normal bg-secondary/50",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <span className="flex items-center gap-2 truncate">
            {selected?.icon}
            <span className="truncate">
              {selected
                ? (selected.triggerLabel ?? selected.label)
                : placeholder}
            </span>
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "min-w-(--radix-popover-trigger-width) w-max max-w-[min(24rem,90vw)] p-0",
          contentClassName,
        )}
        align="start"
        sideOffset={4}
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.label}
                  className={cn(
                    "hover:bg-accent",
                    opt.disabled &&
                      "opacity-40 cursor-not-allowed pointer-events-none",
                  )}
                  disabled={opt.disabled}
                  onSelect={() => {
                    if (opt.disabled) return;
                    onChange(opt.value === value ? "" : opt.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4 shrink-0",
                      value === opt.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="flex items-center gap-2">
                    {opt.icon}
                    {opt.label}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
