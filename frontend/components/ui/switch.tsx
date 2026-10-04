"use client";

import { cn } from "./utils";

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
};

export function Switch({ checked, onCheckedChange, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className="inline-flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
    >
      <span className={cn("h-5 w-9 rounded-full p-0.5 transition", checked ? "bg-primary" : "bg-muted")}>
        <span
          className={cn(
            "block h-4 w-4 rounded-full bg-white transition",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </span>
      {label}
    </button>
  );
}
