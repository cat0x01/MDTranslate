import * as React from "react";
import { cn } from "./utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-55",
        variant === "primary" &&
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        variant === "ghost" && "text-foreground hover:bg-muted",
        variant === "outline" && "border border-border bg-muted/40 text-foreground hover:bg-muted",
        className
      )}
      {...props}
    />
  );
}
