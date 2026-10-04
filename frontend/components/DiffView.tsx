"use client";

export function DiffView({ original, translated }: { original: string; translated: string }) {
  const left = original.split("\n");
  const right = translated.split("\n");
  const rows = Array.from({ length: Math.max(left.length, right.length) }, (_, index) => ({
    index,
    left: left[index] ?? "",
    right: right[index] ?? ""
  }));

  return (
    <div className="editor-scroll h-[calc(100vh-18rem)] min-h-[34rem] overflow-auto rounded-b-lg bg-background/45 p-4 font-mono text-xs leading-6">
      {rows.map((row) => {
        const changed = row.left.trim() !== row.right.trim();
        return (
          <div key={row.index} className="grid min-w-[52rem] grid-cols-[3rem_1fr_1fr] gap-3 border-b border-border/60 py-1">
            <span className="text-right text-muted-foreground">{row.index + 1}</span>
            <span className={changed ? "rounded bg-rose-500/15 px-2 text-rose-100" : "px-2 text-foreground"}>
              {row.left || " "}
            </span>
            <span
              dir="rtl"
              className={changed ? "rounded bg-emerald-500/15 px-2 text-emerald-100" : "px-2 text-foreground"}
            >
              {row.right || " "}
            </span>
          </div>
        );
      })}
    </div>
  );
}
